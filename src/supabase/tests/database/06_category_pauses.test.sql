begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.categories (id, user_id, name, color) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', '#336699'),
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Garderie', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Transport', '#2255aa');
insert into public.categories (id, user_id, parent_id, name, color) values
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Camp de jour', '#bb4433');
-- Transport was archived in 2024.
insert into public.category_status_events (user_id, category_id, status, effective_on) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003', 'archived', '2024-01-01');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Past periods (CAT-03)
select is(
  public.add_category_pause('a0000000-0000-0000-0000-000000000001', '2019-06-01', '2021-09-01'),
  1, 'a past period takes the branch along and says how many'
);
select results_eq(
  $$ select active_from, active_to from public.category_active_periods
     where category_id = 'a0000000-0000-0000-0000-000000000002' order by active_from nulls first $$,
  $$ values (null::date, '2019-06-01'::date), ('2021-09-01'::date, null::date) $$,
  'the sub-category has the same gap'
);
select is(
  public.category_status('a0000000-0000-0000-0000-000000000001'), 'active',
  'a category with a past period stays active'
);
select lives_ok(
  $$ select public.add_category_pause('a0000000-0000-0000-0000-000000000003', '2020-01-01', '2021-01-01') $$,
  'a category archived today can get an older period'
);
select results_eq(
  $$ select active_from, active_to from public.category_active_periods
     where category_id = 'a0000000-0000-0000-0000-000000000003' order by active_from nulls first $$,
  $$ values (null::date, '2020-01-01'::date), ('2021-01-01'::date, '2024-01-01'::date) $$,
  'its periods follow both'
);
select throws_ok(
  $$ select public.add_category_pause('a0000000-0000-0000-0000-000000000001', '2020-01-01', '2022-01-01') $$,
  '23514', 'category_pause_overlaps', 'a period cannot overlap another'
);
select throws_ok(
  $$ select public.add_category_pause('a0000000-0000-0000-0000-000000000003', '2023-06-01', '2024-06-01') $$,
  '23514', 'category_pause_overlaps', 'a period cannot run into the current archive'
);
select throws_ok(
  $$ select public.add_category_pause('a0000000-0000-0000-0000-000000000001', '2018-01-01', '2017-01-01') $$,
  '23514', 'category_pause_order', 'a period ends after it starts'
);
select throws_ok(
  $$ select public.add_category_pause('a0000000-0000-0000-0000-000000000001', '2017-01-01', current_date + 1) $$,
  '23514', 'category_pause_future', 'a period is in the past'
);
select throws_ok(
  $$ select public.add_category_pause('b0000000-0000-0000-0000-000000000001', '2017-01-01', '2018-01-01') $$,
  'P0002', 'category_not_found', 'another user''s category gets no period'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on)
     values ('a0000000-0000-0000-0000-000000000001', 'archived', '2010-01-01') $$,
  '23514', 'category_event_before_previous', 'a plain insert still never goes back in time'
);

select * from finish();
rollback;
