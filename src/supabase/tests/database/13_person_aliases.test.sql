begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.people (id, user_id, name) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Élise'),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Marco'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ines');
insert into public.person_aliases (user_id, person_id, alias) values
  ('22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001', 'Nénès');

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- PPL-06
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000001', 'Élise',
       '{}', array['Lili', 'E. Tremblay']) $$,
  'a person is saved with aliases'
);
select is(
  (select array_agg(alias order by alias) from public.person_aliases
   where person_id = 'a2000000-0000-0000-0000-000000000001'),
  array['E. Tremblay', 'Lili'], 'the aliases are stored'
);
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000001', 'Lili',
       '{}', array['Élise']) $$,
  'a person can swap their name with one of their aliases'
);
select throws_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000002', 'Marco',
       '{}', array['lili']) $$,
  '23514', 'alias_taken', 'an alias cannot repeat another person''s name'
);
select throws_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000002', 'Marco',
       '{}', array['elise']) $$,
  '23514', 'alias_taken', 'an alias cannot repeat another alias, ignoring case and accents'
);
select throws_ok(
  $$ select public.save_person(null, 'ÉLISE', '{}') $$,
  '23514', 'name_is_alias', 'a name cannot repeat an alias'
);
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000002', 'Marco',
       '{}', array['Nénès']) $$,
  'another user''s alias is free'
);
select lives_ok(
  $$ select public.save_person('a2000000-0000-0000-0000-000000000002', 'Marco', '{}') $$,
  'saving without aliases removes them'
);

-- Isolation
select is(
  (select count(*)::int from public.person_aliases where user_id <> auth.uid()),
  0, 'a user sees none of another user''s aliases'
);
delete from public.people where id = 'a2000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.person_aliases
   where person_id = 'a2000000-0000-0000-0000-000000000001'),
  0, 'aliases go with their person'
);

select * from finish();
rollback;
