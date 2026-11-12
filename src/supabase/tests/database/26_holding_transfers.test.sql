begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.holdings (id, user_id, type, name, country, currency, opened_on) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CA_RRSP', 'Ancien REER', 'CA', 'CAD', '2020-01-01'),
  ('a5000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'CA_RRSP', 'Nouveau REER', 'CA', 'CAD', '2024-01-01'),
  ('a5000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'CH_PILLAR3A', 'Pilier 3a', 'CH', 'CHF', '2020-01-01'),
  ('b5000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'CA_RRSP', 'REER Bruno', 'CA', 'CAD', '2020-01-01');
insert into public.holding_contributions (user_id, holding_id, on_date, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', '2020-06-01', 1000);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select lives_ok(
  $$ insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
     values ('a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000002', '2024-02-01', 400) $$,
  'a user transfers money from one holding to another');
select results_eq(
  $$ select placed, withdrawn from public.holding_totals where holding_id = 'a5000000-0000-0000-0000-000000000001' $$,
  $$ values (1000::numeric, 400::numeric) $$, 'the source keeps what was placed and shows the withdrawal');
select results_eq(
  $$ select placed, withdrawn from public.holding_totals where holding_id = 'a5000000-0000-0000-0000-000000000002' $$,
  $$ values (400::numeric, 0::numeric) $$, 'the target placed more');
select throws_ok(
  $$ insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
     values ('a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '2024-02-01', 1) $$,
  '23514', null, 'a holding does not transfer to itself');
select throws_ok(
  $$ insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
     values ('a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000003', '2024-02-01', 1) $$,
  '23514', 'holding_transfer_currency', 'both holdings book in the same currency');
select throws_ok(
  $$ insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
     values ('a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000002', '2024-02-01', 0) $$,
  '23514', null, 'a transfer is above zero');
select throws_ok(
  $$ insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
     values ('a5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '2024-02-01', 1) $$,
  '23503', null, 'a transfer cannot reach another user''s holding');
select throws_ok(
  $$ delete from public.holdings where id = 'a5000000-0000-0000-0000-000000000002' $$,
  '23503', null, 'a holding with a transfer cannot be deleted');
select throws_ok(
  $$ update public.holdings set closed_on = '2024-01-15' where id = 'a5000000-0000-0000-0000-000000000002' $$,
  '23514', 'holding_closed_before_entry', 'a holding cannot close before its last transfer');
select lives_ok(
  $$ update public.holdings set closed_on = '2024-03-01' where id = 'a5000000-0000-0000-0000-000000000001' $$,
  'the source closes after the transfer');

reset role;
select is(
  (select count(*)::int from public.holding_transfers where user_id = '22222222-2222-2222-2222-222222222222'), 0,
  'the other user has no transfers');

select * from finish();
rollback;
