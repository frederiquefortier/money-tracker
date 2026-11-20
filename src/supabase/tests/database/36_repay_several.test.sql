begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test');

insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Loyer', 'expense', '#aa3322');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Sam');

create function pg_temp.check_now() returns void language plpgsql as $$
begin
  set constraints all immediate;
  set constraints all deferred;
end;
$$;
grant execute on function pg_temp.check_now() to authenticated;

-- An expense of `amount` on `day`: Moi at 1 part and Sam owing a part not known yet, or,
-- with `owed`, Moi and Sam at known amounts.
create function pg_temp.expense(day date, amount numeric, owed numeric default null)
returns void language plpgsql as $$
begin
  perform public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', day, amount,
    jsonb_build_array(jsonb_build_object('category_id', 'a0000000-0000-0000-0000-000000000001',
      'input_mode', 'amount', 'input_value', amount)),
    people => case when owed is null then
      '[{"role": "me", "input_mode": "share", "input_value": 1},
        {"role": "owes", "person_id": "a4000000-0000-0000-0000-000000000001", "amount_unknown": true, "input_mode": "share", "input_value": 0}]'::jsonb
    else jsonb_build_array(
      jsonb_build_object('role', 'me', 'input_mode', 'amount', 'input_value', amount - owed),
      jsonb_build_object('role', 'owes', 'person_id', 'a4000000-0000-0000-0000-000000000001',
        'input_mode', 'amount', 'input_value', owed)) end);
end;
$$;
grant execute on function pg_temp.expense(date, numeric, numeric) to authenticated;

-- Sam's owed line on the expense of `day`.
create function pg_temp.owed(day date) returns uuid language sql as $$
  select p.id from public.transaction_people p
  join public.transactions t on t.id = p.transaction_id
  where t.occurred_on = day and t.kind = 'expense' and p.role = 'owes'
$$;
grant execute on function pg_temp.owed(date) to authenticated;

-- What the income of `day` put on each line, by the expense's date.
create function pg_temp.back(day date) returns table (expense date, amount numeric) language sql as $$
  select e.occurred_on, r.amount from public.reimbursements r
  join public.transactions i on i.id = r.income_id
  join public.transaction_people p on p.id = r.owed_line_id
  join public.transactions e on e.id = p.transaction_id
  where i.occurred_on = day order by e.occurred_on
$$;
grant execute on function pg_temp.back(date) to authenticated;

create function pg_temp.income(day date, amount numeric, lines uuid[], id uuid default null)
returns uuid language sql as $$
  select public.save_transaction(id, 'a2000000-0000-0000-0000-000000000001', 'income', day, amount,
    jsonb_build_array(jsonb_build_object('category_id', 'a0000000-0000-0000-0000-000000000001',
      'input_mode', 'amount', 'input_value', amount)),
    people => '[{"role": "from", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1}]',
    reimburses => lines)
$$;
grant execute on function pg_temp.income(date, numeric, uuid[], uuid) to authenticated;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Two months of rent, Sam's part not known yet, paid back at once.
select pg_temp.expense('2026-10-01', 1000);
select pg_temp.expense('2026-11-01', 1000);
select lives_ok(
  $$ select pg_temp.income('2026-11-15', 800,
       array[pg_temp.owed('2026-10-01'), pg_temp.owed('2026-11-01')]);
     select pg_temp.check_now() $$,
  'an income pays back two parts not known yet'
);
select results_eq(
  $$ select * from pg_temp.back('2026-11-15') $$,
  $$ values ('2026-10-01'::date, 400::numeric), ('2026-11-01', 400) $$,
  'the parts not known yet share it equally, the first no longer taking it all'
);

-- Saved again from the form, both lines stay.
select lives_ok(
  $$ select pg_temp.income('2026-11-15', 800,
       array[pg_temp.owed('2026-10-01'), pg_temp.owed('2026-11-01')],
       (select id from public.transactions where kind = 'income' and occurred_on = '2026-11-15'));
     select pg_temp.check_now() $$,
  'saving the income again'
);
select results_eq(
  $$ select * from pg_temp.back('2026-11-15') $$,
  $$ values ('2026-10-01'::date, 400::numeric), ('2026-11-01', 400) $$,
  'keeps both lines'
);

-- A 60 $ part not known yet ticked first, a known 300 $ part, another part not known yet.
select pg_temp.expense('2026-07-01', 60);
select pg_temp.expense('2026-08-01', 600, 300);
select pg_temp.expense('2026-09-01', 1000);
select lives_ok(
  $$ select pg_temp.income('2026-11-16', 500,
       array[pg_temp.owed('2026-07-01'), pg_temp.owed('2026-08-01'), pg_temp.owed('2026-09-01')]);
     select pg_temp.check_now() $$,
  'an income pays back known and unknown parts'
);
select results_eq(
  $$ select * from pg_temp.back('2026-11-16') $$,
  $$ values ('2026-07-01'::date, 60::numeric), ('2026-08-01', 300), ('2026-09-01', 140) $$,
  'the known part first, then the others share the rest, the small one within its room'
);

-- More than everything ticked can take: what is over is a gift.
select pg_temp.expense('2026-06-01', 50);
select lives_ok(
  $$ select pg_temp.income('2026-11-17', 120, array[pg_temp.owed('2026-06-01')]);
     select pg_temp.check_now() $$,
  'an income larger than what it pays back'
);
select results_eq(
  $$ select * from pg_temp.back('2026-11-17') $$,
  $$ values ('2026-06-01'::date, 50::numeric) $$,
  'a part not known yet takes no more than its expense'
);

select * from finish();
rollback;
