begin;
create extension if not exists pgtap with schema extensions;

select plan(42);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: the rollback restores whatever the database held. No CHF rate, so a
-- CAD amount cannot be converted into a CHF holding.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2026-01-01', 1.5, 'frankfurter');

insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Placements', 'investment', '#336699'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322');
insert into public.institutions (id, user_id, name) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Banque Bruno');

-- Bruno's holding, with a value and an employer contribution, made as the owner of the tables.
insert into public.holdings (id, user_id, type, name, country, currency, opened_on) values
  ('b5000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'CA_RRSP', 'REER Bruno', 'CA', 'CAD', '2020-01-01');
insert into public.holding_snapshots (user_id, holding_id, on_date, amount) values
  ('22222222-2222-2222-2222-222222222222', 'b5000000-0000-0000-0000-000000000001', '2026-10-01', 500);
insert into public.holding_contributions (user_id, holding_id, on_date, amount) values
  ('22222222-2222-2222-2222-222222222222', 'b5000000-0000-0000-0000-000000000001', '2026-10-01', 40);

-- The deferred checks wait for the commit, which a test never reaches. This runs them now;
-- statements in between stay deferred, as in a real request.
create function pg_temp.check_now() returns void language plpgsql as $$
begin
  set constraints all immediate;
  set constraints all deferred;
end;
$$;
grant execute on function pg_temp.check_now() to authenticated;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is((select count(*)::int from public.holding_types), 17, 'holding types are readable');

-- Holdings (NW-01)
select lives_ok(
  $$ insert into public.holdings (type, name, country, currency, opened_on)
     values ('CA_TFSA', 'CELI', 'CA', 'CAD', '2020-01-01') $$,
  'a user creates a holding'
);
select throws_ok(
  $$ insert into public.holdings (type, name, country, currency, opened_on)
     values ('CA_RRSP', 'céli', 'CA', 'CAD', '2020-01-01') $$,
  '23505', null, 'open holding names are unique ignoring case and accents'
);
select throws_ok(
  $$ insert into public.holdings (type, kind, name, country, currency, opened_on)
     values ('NOPE', 'asset', 'Autre', 'CA', 'CAD', '2020-01-01') $$,
  '23503', null, 'a holding has a known type'
);
select throws_ok(
  $$ insert into public.holdings (type, name, country, currency, institution_id, opened_on)
     values ('CA_RRSP', 'REER', 'CA', 'CAD', 'b0000000-0000-0000-0000-000000000001', '2020-01-01') $$,
  '23503', null, 'a holding cannot use another user''s institution'
);
select lives_ok(
  $$ insert into public.holdings (type, name, country, currency, opened_on)
     values ('CH_PILLAR3A', 'Pilier 3a', 'CH', 'CHF', '2020-01-01'),
            ('ANY_BROKERAGE', 'Courtage', 'CA', 'CAD', '2020-01-01') $$,
  'a holding can book in another currency'
);
select is(
  (select kind from public.holdings where name = 'Pilier 3a'), 'investment',
  'a predefined type gives the holding its kind'
);
select lives_ok(
  $$ insert into public.holdings (type, country, currency, opened_on)
     values ('CA_RRSP', 'CA', 'CAD', '2020-01-01'),
            ('CA_RRSP', 'CA', 'CAD', '2020-01-01') $$,
  'holdings need no name, and unnamed ones never conflict'
);
select lives_ok(
  $$ insert into public.holdings (type_label, kind, country, currency, opened_on)
     values ('Rente viagère', 'asset', 'FR', 'EUR', '2020-01-01') $$,
  'a typed type takes the kind chosen with it'
);
select throws_ok(
  $$ insert into public.holdings (type, type_label, kind, country, currency, opened_on)
     values ('CA_RRSP', 'Autre', 'asset', 'CA', 'CAD', '2020-01-01') $$,
  '23514', null, 'a holding has a predefined type or a typed one, not both'
);
select throws_ok(
  $$ insert into public.holdings (kind, country, currency, opened_on)
     values ('asset', 'CA', 'CAD', '2020-01-01') $$,
  '23514', null, 'a holding has one or the other'
);
select is(
  (select count(*)::int from public.holdings where name = 'REER Bruno'), 0,
  'a user does not see another user''s holdings'
);

-- Values (NW-02)
select lives_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, d::date, a from public.holdings, (values ('2026-10-01', 100), ('2026-11-01', 300)) v (d, a)
     where name = 'CELI' $$,
  'a user records values on a holding'
);
select throws_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, '2026-10-01', 5 from public.holdings where name = 'CELI' $$,
  '23505', null, 'a holding has one value per date'
);
select throws_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, '2026-10-02', 10.005 from public.holdings where name = 'CELI' $$,
  '23514', 'amount_precision', 'a value is no finer than the currency''s cents'
);
select throws_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, '2026-10-02', -1 from public.holdings where name = 'CELI' $$,
  '23514', null, 'a value is not negative'
);
select lives_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, '2026-10-02', 0 from public.holdings where name = 'Courtage' $$,
  'a value can be zero'
);
select throws_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     values ('b5000000-0000-0000-0000-000000000001', '2026-10-05', 1) $$,
  '23503', null, 'a user cannot add a value to another user''s holding'
);
select is(
  (select count(*)::int from public.holding_snapshots where amount = 500), 0,
  'a user does not see another user''s values'
);

-- Employer and government money (NW-03)
select lives_ok(
  $$ insert into public.holding_contributions (holding_id, on_date, amount, label)
     select id, '2026-10-10', 50, 'Employeur' from public.holdings where name = 'CELI' $$,
  'a user records money that did not leave their accounts'
);
select throws_ok(
  $$ insert into public.holding_contributions (holding_id, on_date, amount)
     select id, '2026-10-10', 0 from public.holdings where name = 'CELI' $$,
  '23514', null, 'a contribution is above zero'
);
select is(
  (select count(*)::int from public.holding_contributions where amount = 40), 0,
  'a user does not see another user''s contributions'
);

-- My own contributions are transactions (ADR-045)
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-15', 200,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 200}]',
       holding_id => (select id from public.holdings where name = 'CELI'));
     select pg_temp.check_now() $$,
  'an expense on an investment category can pay into a holding'
);
select results_eq(
  $$ select placed, latest_value, profit, profit_percent
     from public.holding_totals t join public.holdings h on h.id = t.holding_id where h.name = 'CELI' $$,
  $$ values (250::numeric, 300::numeric, 50::numeric, 20::numeric) $$,
  'placed is the transaction plus the employer money, profit is the latest value minus placed'
);
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-10-20', 50,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 50}]',
       holding_id => (select id from public.holdings where name = 'CELI'));
     select pg_temp.check_now() $$,
  'an income on an investment category is a withdrawal from the holding'
);
select results_eq(
  $$ select placed, profit, profit_percent
     from public.holding_totals t join public.holdings h on h.id = t.holding_id where h.name = 'CELI' $$,
  $$ values (200::numeric, 100::numeric, 50::numeric) $$,
  'a withdrawal lowers placed'
);
select results_eq(
  $$ select placed, latest_value, profit, profit_percent
     from public.holding_totals t join public.holdings h on h.id = t.holding_id where h.name = 'Courtage' $$,
  $$ values (0::numeric, 0::numeric, 0::numeric, null::numeric) $$,
  'a holding with a zero value and nothing placed has no percent'
);

select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-16', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 10}]',
       holding_id => (select id from public.holdings where name = 'CELI'));
     select pg_temp.check_now() $$,
  '23514', 'holding_needs_investment_category', 'a holding needs an investment category'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-16', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 10}]',
       holding_id => 'b5000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'a transaction cannot pay into another user''s holding'
);

-- A rate that is missing empties the figures instead of showing a wrong one (ADR-004)
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-17', 20,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 20}]',
       holding_id => (select id from public.holdings where name = 'Pilier 3a'));
     select pg_temp.check_now() $$,
  'a transaction can pay into a holding in another currency'
);
select results_eq(
  $$ select placed is null, profit is null
     from public.holding_totals t join public.holdings h on h.id = t.holding_id where h.name = 'Pilier 3a' $$,
  $$ values (true, true) $$,
  'a missing rate leaves placed and profit empty'
);

-- What a holding with entries cannot do
select throws_ok(
  $$ update public.holdings set currency = 'USD' where name = 'CELI' $$,
  '23514', 'holding_currency_locked', 'the currency is fixed once the holding has entries'
);
select throws_ok(
  $$ update public.holdings set closed_on = '2026-10-01' where name = 'CELI' $$,
  '23514', 'holding_closed_before_entry', 'a holding cannot close before its last entry'
);
select throws_ok(
  $$ delete from public.holdings where name = 'Pilier 3a' $$,
  '23503', null, 'a holding with transactions cannot be deleted'
);
select throws_ok(
  $$ update public.categories set kind = 'expense' where name = 'Placements' $$,
  '23514', 'category_has_holding_transactions', 'a category with contributions stays an investment'
);
select throws_ok(
  $$ update public.user_currencies set removed_at = now() where code = 'CHF' $$,
  '23514', 'currency_used_by_open_holding', 'a currency an open holding books in cannot be removed'
);

-- Closing
select lives_ok(
  $$ update public.holdings set closed_on = '2026-11-05' where name = 'CELI' $$,
  'a holding closes after its last entry'
);
select throws_ok(
  $$ insert into public.holding_snapshots (holding_id, on_date, amount)
     select id, '2026-11-06', 1 from public.holdings where name = 'CELI' $$,
  '23514', 'holding_closed', 'a closed holding takes no later value'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-06', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 10}]',
       holding_id => (select id from public.holdings where name = 'CELI'));
     select pg_temp.check_now() $$,
  '23514', 'holding_closed', 'a closed holding takes no later transaction'
);
select lives_ok(
  $$ insert into public.holdings (type, name, country, currency, opened_on)
     values ('CA_RRSP', 'CELI', 'CA', 'CAD', '2020-01-01') $$,
  'a closed holding frees its name'
);

-- Deleting a holding takes its values with it
select lives_ok(
  $$ delete from public.holdings where name = 'Courtage' $$,
  'a holding with no transactions can be deleted'
);
select is(
  (select count(*)::int from public.holding_snapshots s
   where not exists (select 1 from public.holdings h where h.id = s.holding_id)), 0,
  'its values went with it'
);

select * from finish();
rollback;
