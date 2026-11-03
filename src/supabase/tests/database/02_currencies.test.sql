begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: the rollback restores whatever the database held.
delete from public.exchange_rates;

-- Invented rates, EUR base. Friday 2024-03-01 and Monday 2024-03-04; nothing on the weekend.
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2024-03-01', 1.5000, 'frankfurter'),
  ('USD', '2024-03-01', 1.2000, 'frankfurter'),
  ('CAD', '2024-03-04', 1.6000, 'frankfurter'),
  ('USD', '2024-03-04', 1.0000, 'frankfurter');

-- Reference data
select ok((select count(*) from public.currencies) > 150, 'the ISO list is loaded');
select is(
  (select name_fr || ' / ' || name_en || ' / ' || symbol from public.currencies where code = 'CAD'),
  'Dollar canadien / Canadian Dollar / $', 'currency names come in both languages'
);
select throws_ok(
  $$ insert into public.exchange_rates (base, quote, rate_date, rate, source)
     values ('USD', 'CAD', '2024-03-01', 1.3, 'frankfurter') $$,
  '23514', null, 'EUR is the only base'
);

-- Sign-up
select results_eq(
  $$ select code::text from public.user_currencies
     where user_id = '11111111-1111-1111-1111-111111111111' order by code $$,
  $$ values ('CAD'), ('CHF'), ('EUR'), ('GBP'), ('USD') $$,
  'sign-up adds the five starting currencies'
);
select is(
  (select default_currency || display_currency from public.profiles
   where user_id = '11111111-1111-1111-1111-111111111111'),
  'CADCAD', 'CAD is the starting default and display currency'
);

-- exchange_rate
select is(public.exchange_rate('CAD', 'CAD', '2000-01-01'), 1::numeric, 'same currency is 1, even with no rates');
select is(public.exchange_rate('EUR', 'CAD', '2024-03-01'), 1.5::numeric, 'EUR to a quote is the stored rate');
select is(public.exchange_rate('CAD', 'EUR', '2024-03-04'), 0.625::numeric, 'a quote to EUR is the inverse');
select is(public.exchange_rate('USD', 'CAD', '2024-03-01'), 1.25::numeric, 'two quotes give a cross rate');
select is(public.exchange_rate('USD', 'CAD', '2024-03-03'), 1.25::numeric, 'a Sunday uses Friday''s rate');
select is(public.exchange_rate('USD', 'CAD', '2024-02-29'), null, 'no rate before the first one: null, never zero');
select is(public.exchange_rate('USD', 'GBP', '2024-03-04'), null, 'a currency with no rates gives null');

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  (select count(*)::int from public.user_currencies), 5,
  'a user sees only their own currencies'
);
select ok((select count(*) from public.exchange_rates) = 4, 'a user reads the exchange rates');
select throws_ok(
  $$ insert into public.exchange_rates (quote, rate_date, rate, source)
     values ('CHF', '2024-03-01', 1, 'frankfurter') $$,
  '42501', null, 'a user cannot write exchange rates'
);
select throws_ok(
  $$ insert into public.user_currencies (user_id, code)
     values ('22222222-2222-2222-2222-222222222222', 'JPY') $$,
  '42501', null, 'a user cannot add a currency for someone else'
);
select lives_ok(
  $$ insert into public.user_currencies (code) values ('JPY') $$,
  'a user adds a currency to their own list'
);
select throws_ok(
  $$ delete from public.user_currencies where code = 'JPY' $$,
  '42501', null, 'currencies are removed with removed_at, never deleted'
);

update public.user_currencies set is_favourite = true
where user_id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select count(*)::int from public.user_currencies
   where user_id = '22222222-2222-2222-2222-222222222222' and is_favourite),
  0, 'a user cannot change another user''s currencies'
);
set local role authenticated;

-- Removal rules (CUR-04, spec 10)
select throws_ok(
  $$ update public.user_currencies set removed_at = now() where code = 'CAD' $$,
  '23514', 'default_currency_cannot_be_removed', 'the default currency cannot be removed'
);

update public.profiles set display_currency = 'EUR';
update public.user_currencies set removed_at = now() where code = 'EUR';
select is(
  (select display_currency::text from public.profiles), 'CAD',
  'removing the display currency switches the display to the default'
);
select throws_ok(
  $$ update public.profiles set display_currency = 'EUR' $$,
  '23514', 'currency_removed', 'a removed currency cannot be the display currency'
);
select throws_ok(
  $$ update public.profiles set default_currency = 'AUD' $$,
  '23503', null, 'the default must be in the user''s list'
);

-- Alice without the second factor
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal1"}', true);

select is_empty('select 1 from public.exchange_rates', 'an aal1 session sees no rates');

-- Anonymous
set local role anon;
select throws_ok('select 1 from public.currencies', '42501', null, 'anon is denied outright');

select * from finish();
rollback;
