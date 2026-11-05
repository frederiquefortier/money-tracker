begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Restaurants', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cadeaux reçus', 'income', '#338855');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam'),
  ('b4000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ines');

-- The sum checks wait for the commit, which a test never reaches. This runs them now.
create function pg_temp.check_now() returns void language plpgsql as $$
begin
  set constraints all immediate;
  set constraints all deferred;
end;
$$;
grant execute on function pg_temp.check_now() to authenticated;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- PPL-03: a 90 $ dinner in equal parts, Alex invited, Sam owes
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 90,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 90}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]');
     select pg_temp.check_now() $$,
  'an expense saves with Moi and two people'
);
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p order by p.position $$,
  $$ values ('me'::text, -30::numeric), ('invited', -30), ('owes', -30) $$,
  'each part is signed like the expense and they sum to it'
);

-- Rounding: 100 in three parts, the last line takes the cent
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-04', 100,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 100}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "head_count": 2, "input_mode": "share", "input_value": 2}]');
     select pg_temp.check_now() $$,
  'a line without a name counts its people (PPL-04)'
);
select results_eq(
  $$ select p.amount, p.head_count from public.transaction_people p
     join public.transactions t on t.id = p.transaction_id
     where t.occurred_on = '2026-11-04' order by p.position $$,
  $$ values (-33.33::numeric, 1), (-66.67, 2) $$,
  'shares are rounded and the last line takes the rest'
);

-- Moi can be zero, when I paid entirely for others
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "amount", "input_value": 0},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]');
     select pg_temp.check_now() $$,
  'Moi can be zero'
);

-- An income comes from someone
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-05', 50,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 50}]',
       people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]');
     select pg_temp.check_now() $$,
  'an income saves with who it came from'
);

-- Refusals
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "amount", "input_value": 10},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 20}]') $$,
  '23514', 'people_sum_mismatch', 'amounts must cover the whole expense'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]');
     select pg_temp.check_now() $$,
  '23514', 'people_role_invalid', 'an expense with people has a Moi line'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]');
     select pg_temp.check_now() $$,
  '23514', 'people_role_invalid', 'an income only has people it came from'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "b4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]') $$,
  '23503', null, 'another user''s person cannot be on a transaction'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]') $$,
  '23505', null, 'a person is on a transaction once'
);

-- Deleting a person keeps their lines, without a name
delete from public.people where id = 'a4000000-0000-0000-0000-000000000002';
select results_eq(
  $$ select count(*)::int from public.transaction_people where role = 'owes' and person_id is null $$,
  $$ values (1) $$,
  'a deleted person''s lines stay, without a name'
);

-- Isolation
select is(
  (select count(*)::int from public.transaction_people where user_id <> auth.uid()),
  0, 'a user sees none of another user''s lines'
);
select is(
  (select count(*)::int from public.list_transactions(person_ids => array['a4000000-0000-0000-0000-000000000001'::uuid])),
  2, 'the list filters by person'
);

select * from finish();
rollback;
