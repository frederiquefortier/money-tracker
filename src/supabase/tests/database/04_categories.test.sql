begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Bruno's category and its history, made as the owner of the tables.
insert into public.categories (id, user_id, name, color) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Loisirs Bruno', '#336699');
insert into public.category_status_events (user_id, category_id, status, effective_on) values
  ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001',
   'archived', '2024-01-01');

-- Alice's tree, made the same way so the ids are known.
insert into public.categories (id, user_id, name, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alimentation', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Transport', '#2255aa');
insert into public.categories (id, user_id, parent_id, name, color, color_is_auto) values
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001',
   'Épicerie', '#bb4433', true),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001',
   'Restaurants', '#cc5544', true);
insert into public.categories (id, user_id, parent_id, name, color) values
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003',
   'Café', '#dd6655');

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Names, colours, kinds
select throws_ok(
  $$ insert into public.categories (name, color) values ('alimentation', '#000000') $$,
  '23505', null, 'top-level names are unique per kind, ignoring case'
);
select lives_ok(
  $$ insert into public.categories (name, kind, color) values ('Alimentation', 'income', '#000000') $$,
  'the same top-level name works in another kind'
);
select lives_ok(
  $$ insert into public.categories (parent_id, name, color)
     values ('a0000000-0000-0000-0000-000000000004', 'Restaurants', '#000000') $$,
  'the same name works under another parent'
);
select throws_ok(
  $$ insert into public.categories (parent_id, name, color)
     values ('a0000000-0000-0000-0000-000000000001', 'restaurants', '#000000') $$,
  '23505', null, 'names are unique among siblings'
);
select throws_ok(
  $$ insert into public.categories (name, color) values ('Rouge', 'red') $$,
  '23514', null, 'a colour is a hex value'
);
select throws_ok(
  $$ insert into public.categories (parent_id, name, kind, color)
     values ('a0000000-0000-0000-0000-000000000001', 'Salaire', 'income', '#000000') $$,
  '23514', 'category_kind_differs_from_parent', 'a sub-category has its parent''s kind'
);
select throws_ok(
  $$ update public.categories set parent_id = 'a0000000-0000-0000-0000-000000000005'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '23514', 'category_cycle', 'a category cannot move under its own grandchild'
);
select throws_ok(
  $$ update public.categories set parent_id = id
     where id = 'a0000000-0000-0000-0000-000000000004' $$,
  '23514', 'category_cycle', 'a category cannot be its own parent'
);
update public.categories set kind = 'investment' where id = 'a0000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.categories where kind = 'investment'),
  4, 'changing a top-level kind carries the whole branch'
);
update public.categories set kind = 'expense' where id = 'a0000000-0000-0000-0000-000000000001';
select throws_ok(
  $$ insert into public.categories (parent_id, name, color)
     values ('b0000000-0000-0000-0000-000000000001', 'Volée', '#000000') $$,
  '23503', null, 'a category cannot sit under another user''s category'
);
select throws_ok(
  $$ delete from public.categories where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '23503', null, 'a category with children cannot be deleted'
);

-- Archive and reactivation (CAT-03)
select is(
  public.archive_category('a0000000-0000-0000-0000-000000000001', '2024-03-03'),
  3, 'archiving a parent archives its branch and says how many'
);
select is(
  public.category_status('a0000000-0000-0000-0000-000000000005'), 'archived',
  'a grandchild goes with the branch'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on)
     values ('a0000000-0000-0000-0000-000000000002', 'active', '2025-01-01') $$,
  '23514', 'category_parent_archived', 'a sub-category waits for its parent'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on)
     values ('a0000000-0000-0000-0000-000000000001', 'archived', '2025-01-01') $$,
  '23514', 'category_already_archived', 'an archived category cannot be archived again'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on)
     values ('a0000000-0000-0000-0000-000000000001', 'active', '2024-01-01') $$,
  '23514', 'category_event_before_previous', 'history never goes back in time'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on)
     values ('a0000000-0000-0000-0000-000000000004', 'active', '2024-01-01') $$,
  '23514', 'category_already_active', 'a category starts active'
);
insert into public.category_status_events (category_id, status, effective_on)
values ('a0000000-0000-0000-0000-000000000001', 'active', '2025-01-01');
select results_eq(
  $$ select active_from, active_to from public.category_active_periods
     where category_id = 'a0000000-0000-0000-0000-000000000001' order by active_from nulls first $$,
  $$ values (null::date, '2024-03-03'::date), ('2025-01-01'::date, null::date) $$,
  'periods follow the history'
);
select results_eq(
  $$ select active_from, active_to from public.category_active_periods
     where category_id = 'a0000000-0000-0000-0000-000000000004' $$,
  $$ values (null::date, null::date) $$,
  'a category with no history is always active'
);
select throws_ok(
  $$ update public.category_status_events set effective_on = '2020-01-01' $$,
  '42501', null, 'the history cannot be rewritten'
);

-- Automatic colours (spec 12)
select public.recolor_categories(
  '[{"id": "a0000000-0000-0000-0000-000000000002", "color": "#112233"},
    {"id": "a0000000-0000-0000-0000-000000000005", "color": "#112233"}]'
);
select is(
  (select color from public.categories where id = 'a0000000-0000-0000-0000-000000000002'),
  '#112233', 'an automatic colour follows'
);
select is(
  (select color from public.categories where id = 'a0000000-0000-0000-0000-000000000005'),
  '#dd6655', 'a colour picked by hand stays'
);

-- Isolation
select is(
  (select count(*)::int from public.categories where user_id <> auth.uid()),
  0, 'a user sees none of another user''s categories'
);
select is(
  (select count(*)::int from public.category_status_events where user_id <> auth.uid())
  + (select count(*)::int from public.category_active_periods
     where category_id = 'b0000000-0000-0000-0000-000000000001'),
  0, 'a user sees none of another user''s history or periods'
);
delete from public.categories where id = 'b0000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.categories where user_id = '22222222-2222-2222-2222-222222222222'),
  1, 'a user cannot delete another user''s category'
);

select * from finish();
rollback;
