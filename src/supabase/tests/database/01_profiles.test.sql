begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', '{"locale": "en-CA"}'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test', '{"locale": "xx-XX"}');

-- Sign-up trigger
select is(
  (select locale from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'en-CA', 'sign-up creates a profile with the requested locale'
);
select is(
  (select locale from public.profiles where user_id = '22222222-2222-2222-2222-222222222222'),
  'fr-CA', 'an invalid locale falls back to fr-CA'
);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select results_eq(
  'select user_id from public.profiles',
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'a user sees only their own profile'
);

update public.profiles set locale = 'fr-CH' where user_id = '22222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.profiles where locale = 'fr-CH'), 0,
  'a user cannot update another user''s profile'
);

select lives_ok(
  $$ update public.profiles set locale = 'fr-CH' where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'a user can update their own profile'
);

select throws_ok(
  $$ insert into public.profiles (user_id) values ('33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'a user cannot insert profiles'
);

-- Alice without the second factor
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal1"}', true);

select is_empty('select 1 from public.profiles', 'an aal1 session sees nothing');

update public.profiles set locale = 'en-US' where user_id = '11111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select locale from public.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'fr-CH', 'an aal1 session cannot update its own profile'
);

-- Anonymous
set local role anon;
select throws_ok('select 1 from public.profiles', '42501', null, 'anon is denied outright');

select * from finish();
rollback;
