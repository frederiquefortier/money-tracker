begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Restaurants', 'expense', '#aa3322');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam');

create function pg_temp.check_now() returns void language plpgsql as $$
begin
  set constraints all immediate;
  set constraints all deferred;
end;
$$;
grant execute on function pg_temp.check_now() to authenticated;

-- The lines of an expense on a date, in order: role, amount.
create function pg_temp.parts(day date) returns table (role text, amount numeric) language sql as $$
  select p.role, p.amount from public.transaction_people p
  join public.transactions t on t.id = p.transaction_id
  where t.occurred_on = day and t.kind = 'expense' order by p.position
$$;
grant execute on function pg_temp.parts(date) to authenticated;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- A 90 $ dinner: Moi and Alex (invited) at 1 part, Sam owes an amount not known yet.
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 90,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 90}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000002", "amount_unknown": true, "input_mode": "share", "input_value": 0}]');
     select pg_temp.check_now() $$,
  'a part can be unknown'
);
select results_eq(
  $$ select * from pg_temp.parts('2026-11-03') $$,
  $$ values ('me'::text, -45::numeric), ('invited', -45), ('owes', null) $$,
  'until it is known, the others share the whole amount'
);
select is(
  (select open from public.owed_lines), true, 'an unknown part is open'
);

-- Sam sends 25 $: linked from the income, it sets Sam's part.
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-06', 25,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 25}]',
       people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]',
       reimburses => array[(select id from public.transaction_people where role = 'owes')]);
     select pg_temp.check_now() $$,
  'an income pays back an owed line'
);
select results_eq(
  $$ select * from pg_temp.parts('2026-11-03') $$,
  $$ values ('me'::text, -32.5::numeric), ('invited', -32.5), ('owes', -25) $$,
  'the reimbursement sets the part, the others share what remains'
);
select is(
  (select open from public.owed_lines), false, 'a part set by its reimbursement is settled'
);

-- Deleting the income makes the part unknown again.
delete from public.transactions where kind = 'income';
select results_eq(
  $$ select * from pg_temp.parts('2026-11-03') $$,
  $$ values ('me'::text, -45::numeric), ('invited', -45), ('owes', null) $$,
  'unlinked, the part is unknown again'
);

-- A known part: 60 $, Alex owes 30. An income of 50 pays back 30; the rest is a gift.
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-04', 60,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 60}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]');
     select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-07', 50,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 50}]',
       people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]',
       reimburses => array[(select p.id from public.transaction_people p
                            where p.role = 'owes' and p.person_id = 'a4000000-0000-0000-0000-000000000001')]);
     select pg_temp.check_now() $$,
  'an income larger than what is owed'
);
select is(
  (select amount from public.reimbursements), 30::numeric(19,4),
  'a line never takes more than it is owed'
);

-- Re-saving the expense keeps its links.
select lives_ok(
  $$ select public.save_transaction((select id from public.transactions where occurred_on = '2026-11-04'),
       'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-04', 60,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 60}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]');
     select pg_temp.check_now() $$,
  'an expense with a reimbursement can be edited'
);
select is(
  (select count(*)::int from public.reimbursements), 1, 'its links are kept'
);

-- Someone without a name: an income from Sans nom pays back their line (spec 21).
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "head_count": 1, "input_mode": "share", "input_value": 1}]');
     select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-08', 20,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 20}]',
       people => '[{"role": "from", "input_mode": "share", "input_value": 1}]',
       reimburses => array[(select p.id from public.transaction_people p
                            where p.role = 'owes' and p.person_id is null)]);
     select pg_temp.check_now() $$,
  'an income from someone without a name pays back their line'
);

-- Montant (decided 2026-11-08): typed lines keep their amounts, the empty ones absorb.
-- 90 $: Alex typed 30, Moi left empty (60 for now), Sam's part not known yet.
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-01', 90,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 90}]',
       people => '[{"role": "me", "fills_rest": true, "input_mode": "amount", "input_value": 60},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 30},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000002", "amount_unknown": true, "input_mode": "amount", "input_value": 0}]');
     select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-10-02', 25,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 25}]',
       people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]',
       reimburses => array[(select p.id from public.transaction_people p join public.transactions t on t.id = p.transaction_id
                            where p.role = 'owes' and t.occurred_on = '2026-10-01')]);
     select pg_temp.check_now() $$,
  'in Montant, a part not known yet is paid back'
);
select results_eq(
  $$ select * from pg_temp.parts('2026-10-01') $$,
  $$ values ('me'::text, -35::numeric), ('invited', -30), ('owes', -25) $$,
  'the empty Moi absorbs it, Alex keeps the typed 30'
);

-- Nothing left empty: Moi 60 and Alex 30 typed, Sam not known; Sam sends 100 $.
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-03', 90,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 90}]',
       people => '[{"role": "me", "input_mode": "amount", "input_value": 60},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 30},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000002", "amount_unknown": true, "input_mode": "amount", "input_value": 0}]');
     select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-10-04', 100,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 100}]',
       people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]',
       reimburses => array[(select p.id from public.transaction_people p join public.transactions t on t.id = p.transaction_id
                            where p.role = 'owes' and t.occurred_on = '2026-10-03')]);
     select pg_temp.check_now() $$,
  'a reimbursement larger than what Moi can give up'
);
select results_eq(
  $$ select * from pg_temp.parts('2026-10-03') $$,
  $$ values ('me'::text, 0::numeric), ('invited', -30), ('owes', -60) $$,
  'with nothing empty Moi absorbs, and the part never takes more than Moi had'
);

-- Refusals and isolation
select throws_ok(
  $$ insert into public.reimbursements (owed_line_id, income_id, amount)
     values ((select id from public.transaction_people where role = 'me' limit 1),
             (select id from public.transactions where kind = 'income' limit 1), 5) $$,
  '23514', 'reimbursement_invalid', 'only an owed line is paid back'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select count(*)::int from public.reimbursements) + (select count(*)::int from public.owed_lines),
  0, 'another user sees none of the reimbursements or owed lines'
);

select * from finish();
rollback;
