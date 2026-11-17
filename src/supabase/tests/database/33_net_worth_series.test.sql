begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: the rollback restores whatever the database held. CHF has a rate
-- from 2025-03-01 only, so earlier CHF points cannot be converted.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2020-01-01', 1.5, 'frankfurter'),
  ('CHF', '2025-03-01', 1.0, 'frankfurter');

-- Everything made as the owner of the tables. Alice displays in CAD (the default).
insert into public.accounts (id, user_id, name, type, currency, opening_balance, opened_on, closed_on) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Chèque', 'checking', 'CAD', 100, '2025-01-01', null),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Ancien', 'checking', 'CAD', 40, '2025-01-01', '2025-02-15'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Chèque Bruno', 'checking', 'CAD', 900, '2025-01-01', null);
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000001', 'expense', '2025-01-15', -10, 'CAD'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000001', 'income', '2025-03-10', 50, 'CAD'),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000002', 'expense', '2025-02-15', -40, 'CAD');

insert into public.holdings (id, user_id, type, name, country, currency, opened_on, closed_on) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'CA_RRSP', 'REER', 'CA', 'CAD', '2025-01-01', null),
  ('a5000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'ANY_MORTGAGE', 'Hypothèque', 'CA', 'CAD', '2025-01-01', null),
  ('a5000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'CH_PILLAR3A', 'Pilier 3a', 'CH', 'CHF', '2025-01-01', null),
  ('a5000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'CA_TFSA', 'CELI fermé', 'CA', 'CAD', '2025-01-01', '2025-02-10'),
  ('b5000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'CA_RRSP', 'REER Bruno', 'CA', 'CAD', '2025-01-01', null);
insert into public.holding_snapshots (user_id, holding_id, on_date, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', '2025-01-20', 1000),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', '2025-03-05', 1200),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000002', '2025-01-20', 300),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000003', '2025-01-20', 50),
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000004', '2025-01-20', 70),
  ('22222222-2222-2222-2222-222222222222', 'b5000000-0000-0000-0000-000000000001', '2025-01-20', 500);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

create temporary table points as select * from public.net_worth_series();

select is(
  (select min(on_date) from points), '2025-01-31'::date,
  'the series starts at the first month end'
);
select is(
  (select max(on_date) from points), current_date,
  'the series ends today'
);
select is(
  (select count(*)::int from points where item_id in
    ('b2000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001')),
  0, 'another user''s accounts and holdings are not in the series'
);
select is(
  (select display_value from points
   where item_id = 'a2000000-0000-0000-0000-000000000001' and on_date = '2025-01-31'),
  '90.0000', 'an account is its opening balance plus its transactions to that date'
);
select is(
  (select display_value from points
   where item_id = 'a2000000-0000-0000-0000-000000000001' and on_date = '2025-03-31'),
  public.account_balance_on('a2000000-0000-0000-0000-000000000001', '2025-03-31')::text,
  'a month end matches account_balance_on'
);
select is(
  (select display_value from points
   where item_id = 'a5000000-0000-0000-0000-000000000001' and on_date = '2025-02-28'),
  '1000.0000', 'a month with no value keeps the last one'
);
select is(
  (select display_value from points
   where item_id = 'a5000000-0000-0000-0000-000000000001' and on_date = '2025-03-31'),
  '1200.0000', 'a new value moves the holding'
);
select is(
  (select display_value from points
   where item_id = 'a5000000-0000-0000-0000-000000000002' and on_date = '2025-01-31'),
  '-300.0000', 'a debt is negative'
);
select ok(
  (select display_value is null from points
   where item_id = 'a5000000-0000-0000-0000-000000000003' and on_date = '2025-01-31'),
  'a missing rate gives null'
);
select is(
  (select display_value from points
   where item_id = 'a5000000-0000-0000-0000-000000000003' and on_date = '2025-03-31'),
  round(50 * public.exchange_rate('CHF', 'CAD', '2025-03-31'), 4)::text,
  'a point is converted at its own date''s rate'
);
select is(
  (select array_agg(on_date order by on_date) from points
   where item_id = 'a5000000-0000-0000-0000-000000000004'),
  array['2025-01-31'::date, '2025-02-28'::date],
  'a closed holding has the month end of its closing, then leaves the series'
);
select is(
  (select display_value from points
   where item_id = 'a5000000-0000-0000-0000-000000000004' and on_date = '2025-02-28'),
  '0.0000', 'a closed holding ends at 0'
);
select is(
  (select array_agg(on_date order by on_date) from points
   where item_id = 'a2000000-0000-0000-0000-000000000002'),
  array['2025-01-31'::date, '2025-02-28'::date],
  'a closed account has the month end of its closing, then leaves the series'
);
select is(
  (select display_value from points
   where item_id = 'a2000000-0000-0000-0000-000000000002' and on_date = '2025-02-28'),
  '0.0000', 'a closed account emptied by its last transfer ends at 0'
);

select * from finish();
rollback;
