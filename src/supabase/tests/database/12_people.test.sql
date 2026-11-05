begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.people (id, user_id, name) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Élise'),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Marco'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ines');
insert into public.person_groups (id, user_id, name) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Escalade'),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chorale');
insert into public.person_group_members (user_id, group_id, person_id) values
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001',
   'b2000000-0000-0000-0000-000000000001');

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Names (spec 19)
select throws_ok(
  $$ insert into public.people (name) values ('elise') $$,
  '23505', null, 'names are unique ignoring case and accents'
);
select lives_ok(
  $$ insert into public.people (name) values ('Ines') $$,
  'another user''s person name is free'
);
select throws_ok(
  $$ insert into public.person_groups (name) values ('  ') $$,
  '23514', null, 'a group name is not blank'
);

-- Saving with memberships (ADR-012)
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000001', 'Élise',
       array['a3000000-0000-0000-0000-000000000001']::uuid[]) $$,
  'a person is saved with their groups'
);
select lives_ok(
  $$ select public.save_person_group('a3000000-0000-0000-0000-000000000001', 'Escalade',
       array['a2000000-0000-0000-0000-000000000001',
             'a2000000-0000-0000-0000-000000000002']::uuid[]) $$,
  'a group is saved with its members'
);
select is(
  (select count(*)::int from public.person_group_members
   where group_id = 'a3000000-0000-0000-0000-000000000001'),
  2, 'both forms edit the same memberships'
);
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000002', 'Marco', '{}') $$,
  'a person leaves every group'
);
select is(
  (select array_agg(person_id) from public.person_group_members),
  array['a2000000-0000-0000-0000-000000000001']::uuid[],
  'only the memberships not chosen are removed'
);
select throws_ok(
  $$ select public.save_person(null, 'Volé',
       array['b3000000-0000-0000-0000-000000000001']::uuid[]) $$,
  '23503', null, 'a person joins only the user''s own groups'
);
select throws_ok(
  $$ select public.save_person_group('b3000000-0000-0000-0000-000000000001', 'Pris', '{}') $$,
  'P0002', 'group_not_found', 'another user''s group cannot be saved'
);

-- Archive (PPL-02) and delete
select lives_ok(
  $$ update public.person_groups set archived_on = '2026-11-01'
     where id = 'a3000000-0000-0000-0000-000000000001' $$,
  'a group is archived with a date'
);
delete from public.person_groups where id = 'a3000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.people where user_id = auth.uid()),
  3, 'deleting a group keeps its members'
);

-- Isolation
select is(
  (select count(*)::int from public.people where user_id <> auth.uid())
  + (select count(*)::int from public.person_groups where user_id <> auth.uid())
  + (select count(*)::int from public.person_group_members where user_id <> auth.uid()),
  0, 'a user sees none of another user''s people, groups or memberships'
);
delete from public.people where id = 'b2000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.people where id = 'b2000000-0000-0000-0000-000000000001'),
  1, 'a user cannot delete another user''s person'
);

select * from finish();
rollback;
