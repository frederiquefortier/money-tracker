begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.merchants (id, user_id, name) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Café Mila'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mila Café'),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Coop');
insert into public.merchant_aliases (merchant_id, user_id, alias) values
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mila');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select lives_ok(
  $$ insert into public.merchant_aliases (merchant_id, alias) values ('a3000000-0000-0000-0000-000000000003', 'Coop Québec') $$,
  'an alias is saved'
);
select throws_ok(
  $$ insert into public.merchant_aliases (merchant_id, alias) values ('a3000000-0000-0000-0000-000000000003', 'café mila') $$,
  '23514', 'alias_taken', 'an alias cannot repeat a merchant''s name, whatever the case or accents'
);
select throws_ok(
  $$ insert into public.merchant_aliases (merchant_id, alias) values ('a3000000-0000-0000-0000-000000000003', 'MILA') $$,
  '23514', 'alias_taken', 'or another alias'
);
select throws_ok(
  $$ insert into public.merchants (name) values ('Coop Quebec') $$,
  '23514', 'name_is_alias', 'a name cannot repeat an alias'
);

-- A merge leaves a trace: its aliases move over, and its name becomes one.
select lives_ok(
  $$ select public.merge_merchants('a3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000001') $$,
  'two merchants are merged'
);
select is(
  (select array_agg(alias order by alias) from public.merchant_aliases
   where merchant_id = 'a3000000-0000-0000-0000-000000000001'),
  array['Mila', 'Mila Café'], 'the merged one''s alias and name are now the target''s'
);

select lives_ok(
  $$ delete from public.merchants where id = 'a3000000-0000-0000-0000-000000000003' $$,
  'a merchant is deleted'
);

-- Bruno sees none of Alice's.
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is((select count(*)::int from public.merchant_aliases), 0, 'another user sees no alias');

select * from finish();
rollback;
