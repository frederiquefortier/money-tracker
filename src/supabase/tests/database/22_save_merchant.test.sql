begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.merchants (id, user_id, name) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Café Mila'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Coop'),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Tibits');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- MER-02
select lives_ok(
  $$ select public.save_merchant('a3000000-0000-0000-0000-000000000001', 'Café Mila', null,
       array['Mila', 'Cafe Mila Inc']) $$,
  'a merchant is saved with aliases'
);
select is(
  (select array_agg(alias order by alias) from public.merchant_aliases
   where merchant_id = 'a3000000-0000-0000-0000-000000000001'),
  array['Cafe Mila Inc', 'Mila'], 'the aliases are stored'
);
select lives_ok(
  $$ select public.save_merchant('a3000000-0000-0000-0000-000000000001', 'Mila', null,
       array['Café Mila']) $$,
  'a merchant can swap its name with one of its aliases'
);
select throws_ok(
  $$ select public.save_merchant('a3000000-0000-0000-0000-000000000002', 'Coop', null,
       array['café mila']) $$,
  '23514', 'alias_taken', 'an alias cannot repeat another merchant''s name'
);
select is(
  public.save_merchant(null, ' Aetepic ', null, array['Aetepic Inc']) is not null,
  true, 'a new merchant is created with its aliases'
);
select is(
  (select count(*)::int from public.merchant_aliases a
   join public.merchants m on m.id = a.merchant_id where m.name = 'Aetepic'),
  1, 'the name is trimmed and the alias stored'
);
select throws_ok(
  $$ select public.save_merchant('b3000000-0000-0000-0000-000000000001', 'Tibits', null, '{}') $$,
  'P0002', 'merchant_not_found', 'another user''s merchant is not found'
);
select is(
  (select count(*)::int from public.merchant_aliases where user_id <> auth.uid()),
  0, 'a user sees none of another user''s aliases'
);

select * from finish();
rollback;
