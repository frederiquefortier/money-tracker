begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: the rollback restores whatever the database held.
delete from public.exchange_rates;

-- Invented rates for today.
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', current_date, 1.5, 'frankfurter'),
  ('CHF', current_date, 1.0, 'frankfurter');

-- Bruno's institution and account, made as the owner of the tables.
insert into public.institutions (id, user_id, name) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Banque Bruno');
insert into public.accounts (id, user_id, institution_id, name, type, currency) values
  ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'b0000000-0000-0000-0000-000000000001', 'Chèque Bruno', 'checking', 'CAD');

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is((select count(*)::int from public.account_types), 5, 'account types are readable');

select lives_ok(
  $$ insert into public.institutions (name, website_url)
     values ('Banque Exemple', 'https://example.com') $$,
  'a user creates an institution'
);
select throws_ok(
  $$ insert into public.institutions (name) values ('banque exemple') $$,
  '23505', null, 'institution names are unique per user, ignoring case'
);
select throws_ok(
  $$ insert into public.institutions (name, website_url) values ('Autre', 'http://example.com') $$,
  '23514', null, 'a website must be https'
);
select lives_ok(
  $$ insert into public.institutions (name) values ('Banque Bruno') $$,
  'another user''s institution name does not collide'
);

select lives_ok(
  $$ insert into public.accounts (institution_id, name, type, currency, opening_balance)
     select id, 'Chèque', 'checking', 'CAD', 150 from public.institutions
     where name = 'Banque Exemple' $$,
  'a user creates an account'
);
select lives_ok(
  $$ insert into public.accounts (name, type, currency, opening_balance)
     values ('Suisse', 'checking', 'CHF', 100) $$,
  'an account needs no institution'
);
select throws_ok(
  $$ insert into public.accounts (name, type, currency) values ('chèque', 'savings', 'CAD') $$,
  '23505', null, 'open account names are unique, ignoring case'
);
select throws_ok(
  $$ insert into public.accounts (institution_id, name, type, currency)
     values ('b0000000-0000-0000-0000-000000000001', 'Volé', 'checking', 'CAD') $$,
  '23503', null, 'an account cannot point at another user''s institution'
);
select throws_ok(
  $$ insert into public.accounts (name, type, currency) values ('Yen', 'cash', 'JPY') $$,
  '23503', null, 'an account books in one of the user''s currencies'
);
select throws_ok(
  $$ insert into public.accounts (name, type, currency, opened_on, closed_on)
     values ('Vieux', 'cash', 'CAD', '2024-01-02', '2024-01-01') $$,
  '23514', null, 'an account cannot close before it opens'
);

-- Isolation
select results_eq(
  'select name from public.accounts order by name',
  $$ values ('Chèque'), ('Suisse') $$,
  'a user sees only their own accounts'
);
select is((select count(*)::int from public.institutions), 2, 'a user sees only their own institutions');
delete from public.accounts where id = 'b0000000-0000-0000-0000-000000000002';
reset role;
select is(
  (select count(*)::int from public.accounts where user_id = '22222222-2222-2222-2222-222222222222'),
  1, 'a user cannot delete another user''s account'
);
set local role authenticated;

-- Currencies (CUR-04)
select throws_ok(
  $$ update public.user_currencies set removed_at = now() where code = 'CHF' $$,
  '23514', 'currency_used_by_open_account', 'a currency used by an open account stays'
);
update public.accounts set closed_on = current_date where name = 'Suisse';
select lives_ok(
  $$ update public.user_currencies set removed_at = now() where code = 'CHF' $$,
  'a closed account does not block removal'
);
select throws_ok(
  $$ update public.accounts set closed_on = null where name = 'Suisse' $$,
  '23514', 'currency_removed', 'an account in a removed currency cannot be reopened'
);
select lives_ok(
  $$ insert into public.accounts (name, type, currency) values ('Suisse', 'cash', 'CAD') $$,
  'a closed account frees its name'
);

-- Institutions in use
select throws_ok(
  $$ delete from public.institutions where name = 'Banque Exemple' $$,
  '23503', null, 'an institution with accounts cannot be deleted'
);

-- Balances and totals, display currency CAD
update public.user_currencies set removed_at = null where code = 'CHF';
update public.accounts set name = 'Suisse CHF' where currency = 'CHF';
update public.accounts set closed_on = null where currency = 'CHF';
select is(
  (select b.display_balance from public.account_balances b
   join public.accounts a on a.id = b.account_id where a.currency = 'CHF'),
  150.0000::numeric, '100 CHF shows as 150 CAD at today''s rate'
);
select is(
  (select total::text || ' ' || converted::text from public.institution_totals
   where institution_id is null),
  '150.0000 true', 'a group total is converted and says so'
);

-- XSU: a currency no provider publishes, so it has no rate on any database.
insert into public.user_currencies (code) values ('XSU');
update public.profiles set display_currency = 'XSU';
select is(
  (select t.total from public.institution_totals t
   join public.institutions i on i.id = t.institution_id where i.name = 'Banque Exemple'),
  null, 'a missing rate gives no total, never a partial sum'
);

select * from finish();
rollback;
