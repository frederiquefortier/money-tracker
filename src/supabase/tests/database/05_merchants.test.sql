begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.categories (id, user_id, name, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sorties', '#2255aa'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', '#336699');
insert into public.merchants (id, user_id, name, default_category_id) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Café Olimpico', 'a0000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Marché Tau', 'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Marche Tau Mile End', null),
  ('b1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Librairie Bruno', null);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Names (spec 13)
select throws_ok(
  $$ insert into public.merchants (name) values ('cafe olimpico') $$,
  '23505', null, 'names are unique ignoring case and accents'
);
select lives_ok(
  $$ insert into public.merchants (name) values ('Librairie Bruno') $$,
  'another user''s merchant name is free'
);
select throws_ok(
  $$ insert into public.merchants (name) values ('   ') $$,
  '23514', null, 'a name is not blank'
);

-- Default category (MER-01)
select throws_ok(
  $$ insert into public.merchants (name, default_category_id)
     values ('Volé', 'b0000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'the default category is one of the user''s own'
);
delete from public.categories where id = 'a0000000-0000-0000-0000-000000000002';
select is(
  (select default_category_id from public.merchants where id = 'a1000000-0000-0000-0000-000000000001'),
  null, 'deleting a category clears it as a default'
);

-- Merge (MER-05)
select lives_ok(
  $$ select public.merge_merchants('a1000000-0000-0000-0000-000000000003',
                                   'a1000000-0000-0000-0000-000000000002') $$,
  'a merchant merges into another'
);
select results_eq(
  $$ select name, default_category_id from public.merchants where name like 'Marc%' $$,
  $$ values ('Marché Tau'::text, 'a0000000-0000-0000-0000-000000000001'::uuid) $$,
  'the source is gone; the target keeps its name and default category'
);
select throws_ok(
  $$ select public.merge_merchants('a1000000-0000-0000-0000-000000000002',
                                   'a1000000-0000-0000-0000-000000000002') $$,
  '23514', 'merchant_merge_into_itself', 'a merchant cannot merge into itself'
);
select throws_ok(
  $$ select public.merge_merchants('b1000000-0000-0000-0000-000000000001',
                                   'a1000000-0000-0000-0000-000000000002') $$,
  'P0002', 'merchant_not_found', 'another user''s merchant cannot be merged away'
);
select throws_ok(
  $$ select public.merge_merchants('a1000000-0000-0000-0000-000000000002',
                                   'b1000000-0000-0000-0000-000000000001') $$,
  'P0002', 'merchant_not_found', 'nothing merges into another user''s merchant'
);

-- Isolation
select is(
  (select count(*)::int from public.merchants where user_id <> auth.uid()),
  0, 'a user sees none of another user''s merchants'
);
delete from public.merchants where id = 'b1000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.merchants where id = 'b1000000-0000-0000-0000-000000000001'),
  1, 'a user cannot delete another user''s merchant'
);

select * from finish();
rollback;
