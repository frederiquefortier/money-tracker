begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, parent_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', null, 'Restaurants', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', null, 'Loyer', 'expense', '#3322aa');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex');

-- The event of the expense on a day, with how it was linked.
create function pg_temp.linked(day date) returns table (name text, source text) language sql as $$
  select e.name, t.event_source from public.transactions t
  left join public.events e on e.id = t.event_id
  where t.occurred_on = day and t.kind = 'expense'
$$;
grant execute on function pg_temp.linked(date) to authenticated;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select lives_ok(
  $$ select public.save_event_type(null, 'Voyage', '#3366cc') $$,
  'an event type is saved'
);
select throws_ok(
  $$ select public.save_event_type(null, 'voyage', '#3366cc') $$,
  '23505', null, 'type names are unique ignoring case'
);

-- Lisbonne covers ten days; the dinner is one day inside it.
select lives_ok(
  $$ select public.save_event(null, 'Lisbonne',
       (select id from public.event_types), '2026-05-10', '2026-05-20',
       array['a4000000-0000-0000-0000-000000000001']::uuid[]) $$,
  'an event is saved with its people'
);
select lives_ok(
  $$ select public.save_event(null, 'Souper', null, '2026-05-12', null, '{}') $$,
  'a one-day event is saved'
);

select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-15', 40,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]') $$,
  'a transaction is saved'
);
select results_eq(
  $$ select * from pg_temp.linked('2026-05-15') $$,
  $$ values ('Lisbonne'::text, 'auto'::text) $$,
  'a transaction in the dates is linked, whatever its category'
);

select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-12', 30,
  '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 30}]');
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-12', 20,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 20}]');
select is(
  (select count(*)::int from public.transactions where event_id = (select id from public.events where name = 'Souper')),
  2, 'two events match: the narrower range wins'
);

select is(
  public.matching_event('2026-05-15', 'transfer'),
  null, 'a transfer is never linked'
);
select is(
  public.matching_event('2026-07-01', 'expense'),
  null, 'a date outside every event links nothing'
);

-- A manual link stays outside the dates and through a recompute.
select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-06-01', 10,
  '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 10}]',
  event_id => (select id from public.events where name = 'Lisbonne'), event_choice => 'manual');
select public.save_event((select id from public.events where name = 'Lisbonne'), 'Lisbonne',
  (select id from public.event_types), '2026-05-10', '2026-05-20', '{}');
select results_eq(
  $$ select * from pg_temp.linked('2026-06-01') $$,
  $$ values ('Lisbonne'::text, 'manual'::text) $$,
  'a manual link is never changed by the rule'
);

-- Clearing an automatic link by hand is remembered.
select public.save_transaction(
  (select id from public.transactions where occurred_on = '2026-05-15'),
  'a2000000-0000-0000-0000-000000000001', 'expense', '2026-05-15', 40,
  '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 40}]',
  event_choice => 'none');
select public.save_event((select id from public.events where name = 'Lisbonne'), 'Lisbonne',
  (select id from public.event_types), '2026-05-10', '2026-05-20', '{}');
select is(
  (select event_id from public.transactions where occurred_on = '2026-05-15'),
  null, 'a removed automatic link does not come back'
);
select is(
  (select count(*)::int from public.event_exclusions), 1, 'the removal is kept'
);

-- Deleting an event hands its transactions to the next one, and a type only leaves its events.
select public.delete_event((select id from public.events where name = 'Souper'));
select is(
  (select event_id from public.transactions where occurred_on = '2026-05-12' and amount = -30),
  (select id from public.events where name = 'Lisbonne'),
  'deleting an event hands its transactions to the next one in range'
);
delete from public.event_types;
select is(
  (select type_id from public.events where name = 'Lisbonne'),
  null, 'deleting a type leaves its events without one'
);

-- An event with no dates is linked by hand only.
select public.save_event(null, 'Vide', null, null, null, '{}');
select is(
  public.matching_event('2031-01-01', 'expense'),
  null, 'an event with no dates links nothing by itself'
);

-- Bruno sees none of it
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select count(*)::int from public.events) + (select count(*)::int from public.event_exclusions)
    + (select count(*)::int from public.event_people),
  0, 'another user sees no event, link or person'
);

select * from finish();
rollback;
