begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Cadeaux', 'expense', '#aa3322');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex');

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

-- PPL-03: a gift for Alex, whole amount on Moi, Alex invited with a part of 0
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-12', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 0}]');
     select pg_temp.check_now() $$,
  'an invited person can have a part of 0'
);
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p order by p.position $$,
  $$ values ('me'::text, -40::numeric), ('invited', 0) $$,
  'Moi has the whole amount and the invited person nothing'
);

-- Bruno sees none of it
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select count(*)::int from public.transaction_people), 0,
  'another user sees no people line'
);

select * from finish();
rollback;
