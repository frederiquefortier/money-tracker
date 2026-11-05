begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.categories (id, user_id, name, color) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', '#336699'),
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Maison', '#2255aa'),
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Voyages', '#aa3322');
insert into public.categories (id, user_id, parent_id, name, color) values
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Entretien', '#3366bb'),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Meubles', '#4477cc');
insert into public.categories (id, user_id, parent_id, name, color) values
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000002', 'Plomberie', '#5588dd');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  public.archive_category('a0000000-0000-0000-0000-000000000001', '2024-06-01'),
  3, 'Maison is archived with its branch'
);
select throws_ok(
  $$ select public.reactivate_category('a0000000-0000-0000-0000-000000000003', '2024-03-01') $$,
  '23514', 'category_event_before_previous', 'the parents cannot come back before they were archived'
);
select is(
  public.reactivate_category('a0000000-0000-0000-0000-000000000003', '2025-01-01'),
  2, 'reactivating Plomberie brings back its two archived parents'
);
select results_eq(
  $$ select name, public.category_status(id) from public.categories
     where id in ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
                  'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004')
     order by name $$,
  $$ values ('Entretien', 'active'), ('Maison', 'active'), ('Meubles', 'archived'), ('Plomberie', 'active') $$,
  'the parents are active again and the other sub-category stays archived'
);
select results_eq(
  $$ select active_from from public.category_active_periods
     where category_id = 'a0000000-0000-0000-0000-000000000001' and active_from is not null $$,
  $$ values ('2025-01-01'::date) $$,
  'the parent is active from the same date'
);
select lives_ok(
  $$ select public.archive_category('a0000000-0000-0000-0000-000000000005', '2024-01-01') $$,
  'Voyages is archived'
);
select is(
  public.reactivate_category('a0000000-0000-0000-0000-000000000005', '2025-01-01'),
  0, 'a top-level category brings back no parent'
);

-- Events through another category name it (CAT-03)
select results_eq(
  $$ select c.name, e.status, v.name from public.category_status_events e
     join public.categories c on c.id = e.category_id
     left join public.categories v on v.id = e.via_category_id
     where e.category_id in ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
                             'a0000000-0000-0000-0000-000000000003')
     order by e.id $$,
  $$ values ('Maison'::text, 'archived'::text, null::text),
            ('Entretien', 'archived', 'Maison'),
            ('Plomberie', 'archived', 'Maison'),
            ('Maison', 'active', 'Plomberie'),
            ('Entretien', 'active', 'Plomberie'),
            ('Plomberie', 'active', null) $$,
  'the branch was archived with Maison, the parents reactivated with Plomberie'
);
select is(
  public.add_category_pause('a0000000-0000-0000-0000-000000000001', '2020-01-01', '2021-01-01'),
  3, 'a past period takes the branch along'
);
select results_eq(
  $$ select count(*)::int from public.category_status_events
     where via_category_id = 'a0000000-0000-0000-0000-000000000001' and effective_on in ('2020-01-01', '2021-01-01') $$,
  $$ values (6) $$,
  'both events of each sub-category name the parent'
);
select throws_ok(
  $$ insert into public.category_status_events (category_id, status, effective_on, via_category_id)
     values ('a0000000-0000-0000-0000-000000000004', 'active', '2026-01-01', 'b0000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'an event cannot name another user''s category'
);

select * from finish();
rollback;
