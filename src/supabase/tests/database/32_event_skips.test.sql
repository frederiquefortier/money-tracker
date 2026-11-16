begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, parent_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', null, 'Restaurants', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', null, 'Maison', 'expense', '#3322aa'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000002', 'Loyer', 'expense', '#3322aa');

create function pg_temp.event_on(day date, amount numeric) returns text language sql as $$
  select e.name from public.transactions t
  left join public.events e on e.id = t.event_id
  where t.occurred_on = day and t.amount = -amount
$$;
grant execute on function pg_temp.event_on(date, numeric) to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select public.save_event(null, 'Lisbonne', null, '2026-05-10', '2026-05-20', '{}');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-12', 900,
  '[{"category_id": "a0000000-0000-0000-0000-000000000003", "input_mode": "amount", "input_value": 900}]');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-12', 40,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-13', 100,
  '[{"category_id": "a0000000-0000-0000-0000-000000000003", "input_mode": "amount", "input_value": 60},
    {"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]');

-- The default list skips Maison, so its sub-category Loyer too.
select public.save_event_default_skips(array['a0000000-0000-0000-0000-000000000002']::uuid[]);
select is(pg_temp.event_on('2026-05-12', 900), null, 'the default skips a sub-category of a skipped one');
select is(pg_temp.event_on('2026-05-12', 40), 'Lisbonne', 'other categories stay linked');
select is(pg_temp.event_on('2026-05-13', 100), 'Lisbonne', 'a split outside the skipped ones keeps the link');
select is(
  public.matching_event('2026-05-14', 'expense', category_ids => array['a0000000-0000-0000-0000-000000000003']::uuid[]),
  null, 'the form gets the same answer before a save'
);

-- The event's own list replaces the default.
select public.save_event((select id from public.events), 'Lisbonne', null, '2026-05-10', '2026-05-20', '{}',
  true, array['a0000000-0000-0000-0000-000000000001']::uuid[]);
select is(pg_temp.event_on('2026-05-12', 900), 'Lisbonne', 'an event list replaces the default');
select is(pg_temp.event_on('2026-05-12', 40), null, 'and skips its own categories');

-- An own list may be empty: every default category unticked.
select public.save_event((select id from public.events), 'Lisbonne', null, '2026-05-10', '2026-05-20', '{}',
  true, '{}'::uuid[]);
select is(pg_temp.event_on('2026-05-12', 900), 'Lisbonne', 'an empty own list skips nothing');

-- No list (null) follows the default again.
select public.save_event((select id from public.events), 'Lisbonne', null, '2026-05-10', '2026-05-20', '{}');
select is(pg_temp.event_on('2026-05-12', 900), null, 'without its own list an event follows the default');

-- A manual link ignores the skips.
select public.save_transaction(
  (select id from public.transactions where amount = -900),
  'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-12', 900,
  '[{"category_id": "a0000000-0000-0000-0000-000000000003", "input_mode": "amount", "input_value": 900}]',
  event_id => (select id from public.events), event_choice => 'manual');
select is(pg_temp.event_on('2026-05-12', 900), 'Lisbonne', 'a manual link ignores the skips');

-- Bruno sees none of it
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select count(*)::int from public.event_default_skips) + (select count(*)::int from public.event_skips),
  0, 'another user sees no skipped category'
);

select * from finish();
rollback;
