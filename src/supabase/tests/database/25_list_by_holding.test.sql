begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test');

insert into public.accounts (id, user_id, name, type, currency) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD');
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Bourse', 'investment', '#2255aa');
insert into public.holdings (id, user_id, type, name, country, currency, opened_on) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CA_TFSA', null, 'CA', 'CAD', '2020-01-01');

-- Linked investment, unlinked investment, and a grocery. The sum checks wait for the
-- commit, which a test never reaches.
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, holding_id) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-01', -200, 'CAD', 'a5000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-02', -100, 'CAD', null),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'a2000000-0000-0000-0000-000000000001', 'expense', '2026-10-03', -50, 'CAD', null);
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'amount', 200, -200),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'amount', 100, -100),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'amount', 50, -50);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  (select count(*)::int from public.list_transactions('2026-10-01', '2026-10-31')), 3,
  'every transaction is listed'
);
select results_eq(
  $$ select holding ->> 'typeFr', holding ->> 'typeEn', holding ->> 'currency', holding ->> 'name'
     from public.list_transactions('2026-10-01', '2026-10-31')
     where id = 'a3000000-0000-0000-0000-000000000001' $$,
  $$ values ('CELI'::text, 'TFSA'::text, 'CAD'::text, null::text) $$,
  'a row gives its holding as parts, a holding with no name included'
);
select is(
  (select holding from public.list_transactions('2026-10-01', '2026-10-31')
   where id = 'a3000000-0000-0000-0000-000000000003'), null,
  'a row with no holding has none'
);

select * from finish();
rollback;
