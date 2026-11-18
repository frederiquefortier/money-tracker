begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates. CHF has a rate from 2025-03-01 only.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2020-01-01', 1.5, 'frankfurter'),
  ('CHF', '2025-03-01', 1.0, 'frankfurter');

-- Alice displays in CAD (the default).
insert into public.accounts (id, user_id, name, type, currency, opening_balance, opened_on) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Chèque', 'checking', 'CAD', 0, '2025-01-01'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Chèque Bruno', 'checking', 'CAD', 0, '2025-01-01');

insert into public.holdings (id, user_id, type, name, country, currency, opened_on) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'CA_RRSP', 'REER', 'CA', 'CAD', '2025-01-01'),
  ('a5000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'CA_TFSA', 'CELI', 'CA', 'CAD', '2025-01-01'),
  ('a5000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'ANY_MORTGAGE', 'Hypothèque', 'CA', 'CAD', '2025-01-01'),
  ('a5000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'CH_PILLAR3A', 'Pilier 3a', 'CH', 'CHF', '2025-01-01'),
  ('b5000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'CA_RRSP', 'REER Bruno', 'CA', 'CAD', '2025-01-01');

insert into public.transactions (user_id, account_id, holding_id, kind, occurred_on, amount, currency) values
  ('11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'a5000000-0000-0000-0000-000000000001', 'expense', '2025-01-15', -1000, 'CAD'),
  ('11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'a5000000-0000-0000-0000-000000000001', 'income', '2025-02-10', 200, 'CAD'),
  ('11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'a5000000-0000-0000-0000-000000000003', 'expense', '2025-01-15', -300, 'CAD'),
  ('11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'a5000000-0000-0000-0000-000000000001', 'expense', current_date + 30, -999, 'CAD'),
  ('22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'b5000000-0000-0000-0000-000000000001', 'expense', '2025-01-15', -500, 'CAD');

insert into public.holding_contributions (user_id, holding_id, on_date, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', '2025-01-15', 50),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000004', '2025-01-20', 40),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000004', '2025-03-20', 40);

insert into public.holding_transfers (user_id, from_holding_id, to_holding_id, on_date, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001',
   'a5000000-0000-0000-0000-000000000002', '2025-03-01', 400);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

create temporary table flows as select * from public.holding_flows();

select is(
  (select count(*)::int from flows where holding_id = 'b5000000-0000-0000-0000-000000000001'),
  0, 'another user''s flows are not returned'
);
select is(
  (select display_amount from flows
   where holding_id = 'a5000000-0000-0000-0000-000000000001' and on_date = '2025-01-15'),
  '1050.0000', 'a linked expense and a contribution on one day go in together'
);
select is(
  (select display_amount from flows
   where holding_id = 'a5000000-0000-0000-0000-000000000001' and on_date = '2025-02-10'),
  '-200.0000', 'a linked income comes out'
);
select is(
  (select array_agg(display_amount order by holding_id) from flows where on_date = '2025-03-01'),
  array['-400.0000', '400.0000'],
  'a transfer comes out of one holding and goes into the other'
);
select is(
  (select count(*)::int from flows where holding_id = 'a5000000-0000-0000-0000-000000000003'),
  0, 'a debt has no flows'
);
select ok(
  (select display_amount is null from flows
   where holding_id = 'a5000000-0000-0000-0000-000000000004' and on_date = '2025-01-20'),
  'a missing rate gives null'
);
select is(
  (select count(*)::int from flows where on_date > current_date),
  0, 'a future transaction does not count'
);

select * from finish();
rollback;
