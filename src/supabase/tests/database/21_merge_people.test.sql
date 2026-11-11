begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Restaurants', 'expense', '#aa3322');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Nina'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam'),
  ('a4000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Claire'),
  ('b4000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ines');
insert into public.person_aliases (user_id, person_id, alias) values
  ('11111111-1111-1111-1111-111111111111', 'a4000000-0000-0000-0000-000000000003', 'Clo');
insert into public.person_groups (id, user_id, name) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Amis');
insert into public.person_group_members (user_id, group_id, person_id) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000003');

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

-- Nina and Sam share the first dinner; Claire is on the second one alone.
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 60,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 60}]',
  people => '[{"role": "me", "input_mode": "share", "input_value": 1},
              {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1},
              {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1}]');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-04', 40,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
  people => '[{"role": "me", "input_mode": "share", "input_value": 1},
              {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000003", "input_mode": "share", "input_value": 1}]');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-05', 15,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 15}]',
  seller_id => 'a4000000-0000-0000-0000-000000000003');

-- PPL-07
select throws_ok(
  $$ select public.merge_people('a4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000001') $$,
  '23514', 'person_merge_into_itself', 'a person cannot merge into itself'
);
select throws_ok(
  $$ select public.merge_people('a4000000-0000-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000001') $$,
  'P0002', 'person_not_found', 'another user''s person is not found'
);
select throws_ok(
  $$ select public.merge_people('b4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000001') $$,
  'P0002', 'person_not_found', 'another user''s person cannot be merged away'
);
select throws_ok(
  $$ select public.merge_people('a4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001') $$,
  '23514', 'people_merge_shared_transaction', 'two people on one transaction cannot merge'
);

select lives_ok(
  $$ select public.merge_people('a4000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000001');
     select pg_temp.check_now() $$,
  'Claire merges into Nina'
);
select is(
  (select count(*)::int from public.transaction_people
   where person_id = 'a4000000-0000-0000-0000-000000000001'),
  2, 'her line is now Nina''s'
);
select is(
  (select array_agg(alias order by alias) from public.person_aliases
   where person_id = 'a4000000-0000-0000-0000-000000000001'),
  array['Clo', 'Claire'], 'her name and her alias are Nina''s aliases'
);
select is_empty(
  $$ select 1 from public.people where id = 'a4000000-0000-0000-0000-000000000003' $$,
  'Claire is gone'
);
select is(
  (select count(*)::int from public.person_group_members
   where group_id = 'a5000000-0000-0000-0000-000000000001'
     and person_id = 'a4000000-0000-0000-0000-000000000001'),
  1, 'Nina joins her groups'
);
select is(
  (select count(*)::int from public.transactions
   where seller_person_id = 'a4000000-0000-0000-0000-000000000001'),
  1, 'what was bought from her was bought from Nina'
);

select * from finish();
rollback;
