begin;
create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: CHF to CAD is 1.6, and USD has none.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2026-09-30', 1.5, 'frankfurter'),
  ('CHF', '2026-09-30', 0.9375, 'frankfurter');

-- Made as the owner of the tables, so the ids and entry times are known.
insert into public.institutions (id, user_id, name) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Caisse Lumière');
insert into public.accounts (id, user_id, name, type, currency, institution_id) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD',
   'a5000000-0000-0000-0000-000000000001');
insert into public.accounts (id, user_id, name, type, currency) values
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Wise', 'checking', 'CHF'),
  ('a2000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Épargne', 'savings', 'CAD'),
  ('a2000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Voyage', 'checking', 'USD'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.categories (id, user_id, name, kind, color, icon) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322', 'shopping-cart'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Salaire', 'income', '#338855', 'coins'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Bourse', 'investment', '#2255aa', 'chart-line'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699', 'tag');
insert into public.categories (id, user_id, name, kind, color, icon, parent_id) values
  ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Fruits', 'expense', '#cc5533', 'tag',
   'a0000000-0000-0000-0000-000000000001');
insert into public.merchants (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marché Tau');

-- October: groceries, a coffee in CHF, a transfer with its fee, a refund, a salary, a
-- purchase split between groceries and an investment, an adjustment. November: a
-- purchase in USD, which has no rate. December: a transfer from CAD to CHF, 100 $ sent
-- and 61 CHF received (62,50 CHF at the rate), and 10 CHF paid 16,50 $ from Chèque (16 $
-- at the rate). And one of Bruno's.
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, status, merchant_id, note, transfer_id, created_at) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-03', -84.12, 'CAD', 'cleared', 'a1000000-0000-0000-0000-000000000001', null, null, '2026-10-03 10:00'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000002',
   'expense', '2026-10-03', -4.20, 'CHF', 'cleared', null, 'Café', null, '2026-10-03 11:00'),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'transfer', '2026-10-03', -500, 'CAD', 'pending', null, null, 'a4000000-0000-0000-0000-000000000001', '2026-10-03 12:00'),
  ('a3000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000003',
   'transfer', '2026-10-03', 500, 'CAD', 'cleared', null, null, 'a4000000-0000-0000-0000-000000000001', '2026-10-03 12:00'),
  ('a3000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-03', -2, 'CAD', 'pending', null, null, 'a4000000-0000-0000-0000-000000000001', '2026-10-03 12:00'),
  ('a3000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'income', '2026-10-02', 10, 'CAD', 'cleared', null, null, null, '2026-10-02 08:00'),
  ('a3000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'income', '2026-10-01', 3000, 'CAD', 'cleared', null, null, null, '2026-10-01 06:00'),
  ('a3000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-01', -200, 'CAD', 'cleared', null, null, null, '2026-10-01 07:00'),
  ('a3000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000003',
   'adjustment', '2026-10-02', 5, 'CAD', 'cleared', null, null, null, '2026-10-02 09:00'),
  ('a3000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000004',
   'expense', '2026-11-02', -10, 'USD', 'cleared', null, null, null, '2026-11-02 09:00'),
  ('a3000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'transfer', '2026-12-04', -100, 'CAD', 'cleared', null, null, 'a4000000-0000-0000-0000-000000000002', '2026-12-04 09:00'),
  ('a3000000-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000002',
   'transfer', '2026-12-04', 61, 'CHF', 'cleared', null, null, 'a4000000-0000-0000-0000-000000000002', '2026-12-04 09:00'),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-03', -12, 'CAD', 'cleared', null, null, null, '2026-10-03 09:00');
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, original_amount, original_currency, created_at) values
  ('a3000000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', '2026-12-05', -16.50, 'CAD', -10, 'CHF', '2026-12-05 09:00');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'amount', 84.12, -84.12),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'amount', 4.20, -4.20),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'amount', 2, -2),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'amount', 10, 10),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'amount', 3000, 3000),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'amount', 50, -50),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'amount', 150, -150),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'amount', 10, -10),
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 12, -12);

-- Alice with MFA passed, displaying in CAD
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select results_eq(
  $$ select id from public.list_transactions('2026-10-01', '2026-10-31') $$,
  $$ values ('a3000000-0000-0000-0000-000000000003'::uuid),
            ('a3000000-0000-0000-0000-000000000002'::uuid), ('a3000000-0000-0000-0000-000000000001'::uuid),
            ('a3000000-0000-0000-0000-000000000009'::uuid), ('a3000000-0000-0000-0000-000000000006'::uuid),
            ('a3000000-0000-0000-0000-000000000008'::uuid), ('a3000000-0000-0000-0000-000000000007'::uuid) $$,
  'newest day first, the last entered first, a transfer once with its fee on it, another user''s left out'
);
select results_eq(
  $$ select pending, from_account, from_institution, to_account, to_institution, amount, fee_amount, fee_category
     from public.list_transactions('2026-10-01', '2026-10-31') where kind = 'transfer' $$,
  $$ values (true, 'Chèque', 'Caisse Lumière', 'Épargne', null, '500.0000', '2.0000', 'Épicerie') $$,
  'a transfer names both accounts and their institutions, unsigned, pending while a side is, with its fee'
);
select results_eq(
  $$ select account_name, institution, display_amount, rate from public.list_transactions('2026-10-01', '2026-10-31')
     where id in ('a3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002') order by id $$,
  $$ values ('Chèque', 'Caisse Lumière', '-84.12', '1'), ('Wise', null, '-6.72', '1.600000000000') $$,
  'a row names its account and institution, converted at its date''s rate (CUR-07)'
);
select results_eq(
  $$ select merchant, categories from public.list_transactions('2026-10-01', '2026-10-31')
     where id in ('a3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000008') order by id $$,
  $$ values ('Marché Tau', '[{"name": "Épicerie", "icon": "shopping-cart", "color": "#aa3322"}]'::jsonb),
            (null, '[{"name": "Bourse", "icon": "chart-line", "color": "#2255aa"}, {"name": "Épicerie", "icon": "shopping-cart", "color": "#aa3322"}]'::jsonb) $$,
  'every category of a split comes, the largest share first (TRX-06)'
);
select results_eq(
  $$ select distinct occurred_on, day_net from public.list_transactions('2026-10-01', '2026-10-31') order by occurred_on desc $$,
  $$ values ('2026-10-03'::date, '-92.84'), ('2026-10-02'::date, '10.00'), ('2026-10-01'::date, '2800.00') $$,
  'each day nets its expenses, incomes and transfer fees, without transfers or adjustments'
);
select results_eq(
  $$ select id, amount, pending from public.list_transactions('2026-10-01', '2026-10-31', array['a2000000-0000-0000-0000-000000000003'::uuid]) $$,
  $$ values ('a3000000-0000-0000-0000-000000000004'::uuid, '500.0000', false),
            ('a3000000-0000-0000-0000-000000000009'::uuid, '5.0000', false) $$,
  'filtered to an account, a transfer shows that account''s leg'
);
select results_eq(
  $$ select display_amount, day_net from public.list_transactions('2026-11-01', '2026-11-30') $$,
  $$ values (null::text, null::text) $$,
  'a missing rate leaves the amount and its day net empty, never zero'
);
select is_empty(
  $$ select 1 from public.list_transactions('2026-09-01', '2026-09-30') $$,
  'an empty month has no rows'
);
select is(
  (select count(*)::int from public.list_transactions()),
  10, 'with no bounds, every transaction comes'
);
select results_eq(
  $$ select distinct occurred_on, more from public.list_transactions('2026-10-01', '2026-10-31', max_rows => 3) $$,
  $$ values ('2026-10-03'::date, true) $$,
  'a page keeps whole days and says older rows remain'
);
select results_eq(
  $$ select distinct occurred_on, more from public.list_transactions('2026-10-01', '2026-10-31', before => '2026-10-03', max_rows => 3)
     order by occurred_on desc $$,
  $$ values ('2026-10-02'::date, false), ('2026-10-01'::date, false) $$,
  'the next page starts before the last day, and the last page says so'
);

select results_eq(
  $$ select id from public.list_transactions('2026-10-01', '2026-10-31', category_ids => array['a0000000-0000-0000-0000-000000000001'::uuid]) $$,
  $$ values ('a3000000-0000-0000-0000-000000000005'::uuid), ('a3000000-0000-0000-0000-000000000002'::uuid),
            ('a3000000-0000-0000-0000-000000000001'::uuid), ('a3000000-0000-0000-0000-000000000006'::uuid),
            ('a3000000-0000-0000-0000-000000000008'::uuid) $$,
  'a category keeps its own and its sub-categories'' transactions, a split by any of its categories, no transfer'
);
select results_eq(
  $$ select id from public.list_transactions(merchant_ids => array['a1000000-0000-0000-0000-000000000001'::uuid]) $$,
  $$ values ('a3000000-0000-0000-0000-000000000001'::uuid) $$,
  'a merchant keeps its own transactions'
);
select results_eq(
  $$ select id from public.list_transactions(search => '  marche ') $$,
  $$ values ('a3000000-0000-0000-0000-000000000001'::uuid) $$,
  'search finds a merchant, ignoring case, accents and spaces around (TRX-12)'
);
select results_eq(
  $$ select id, day_net from public.list_transactions(search => 'CAFÉ') $$,
  $$ values ('a3000000-0000-0000-0000-000000000002'::uuid, '-6.72') $$,
  'search finds a note, and the day net counts only what is shown'
);

select results_eq(
  $$ select id from public.list_transactions('2026-10-01', '2026-10-31',
       category_ids => array['a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003']::uuid[]) $$,
  $$ values ('a3000000-0000-0000-0000-000000000008'::uuid), ('a3000000-0000-0000-0000-000000000007'::uuid) $$,
  'several categories keep the transactions in any of them'
);
select results_eq(
  $$ select id, amount from public.list_transactions('2026-10-03', '2026-10-03',
       array['a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000003']::uuid[]) $$,
  $$ values ('a3000000-0000-0000-0000-000000000003'::uuid, '-500.0000'), ('a3000000-0000-0000-0000-000000000004'::uuid, '500.0000'),
            ('a3000000-0000-0000-0000-000000000001'::uuid, '-84.1200') $$,
  'several accounts show each one''s legs, so a transfer between two of them shows both'
);

select results_eq(
  $$ select id from public.list_transactions(search => 'fruits') $$,
  $$ values ('a3000000-0000-0000-0000-000000000002'::uuid) $$,
  'search finds a category'
);
select is(
  (select count(*)::int from public.list_transactions(search => 'lumiere')),
  7, 'search finds an institution, through its account'
);
select results_eq(
  $$ select id from public.list_transactions(search => 'épargne') $$,
  $$ values ('a3000000-0000-0000-0000-000000000003'::uuid), ('a3000000-0000-0000-0000-000000000009'::uuid) $$,
  'search finds an account, a transfer by either side'
);

select results_eq(
  $$ select distinct total from public.list_transactions('2026-10-01', '2026-10-31', max_rows => 3) $$,
  $$ values (7::bigint) $$,
  'the total counts every row of the period, past the page'
);
select results_eq(
  $$ select distinct total from public.list_transactions(category_ids => array['a0000000-0000-0000-0000-000000000001'::uuid]) $$,
  $$ values (6::bigint) $$,
  'the total counts what the filters match, sub-categories included'
);

select results_eq(
  $$ select from_account, to_account from public.list_transactions(
       category_ids => array['a0000000-0000-0000-0000-000000000001'::uuid])
     where id = 'a3000000-0000-0000-0000-000000000005' $$,
  $$ values ('Chèque', 'Épargne') $$,
  'filtered on its category, a fee has its own row naming both accounts'
);
select results_eq(
  $$ select received_amount, received_currency, received_value, conversion_cost
     from public.list_transactions('2026-12-01', '2026-12-31') where kind = 'transfer' $$,
  $$ values ('61.0000', 'CHF', '97.60', '2.4000') $$,
  'between two currencies, the departure row carries what arrived, its value and the conversion cost (TRX-11)'
);
select results_eq(
  $$ select conversion_cost from public.list_transactions('2026-12-01', '2026-12-31') where kind = 'expense' $$,
  $$ values ('0.5000') $$,
  'an expense paid in another currency carries what it cost above the market value (CUR-08)'
);
select results_eq(
  $$ select id from public.list_transactions(pending_only => true) $$,
  $$ values ('a3000000-0000-0000-0000-000000000003'::uuid) $$,
  'pending_only keeps what is pending'
);
select results_eq(
  $$ select distinct pending_count from public.list_transactions('2026-12-01', '2026-12-31') $$,
  $$ values (1::bigint) $$,
  'the pending count looks past the period'
);

-- Bruno sees only his own
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);

select results_eq(
  $$ select id from public.list_transactions() $$,
  $$ values ('b3000000-0000-0000-0000-000000000001'::uuid) $$,
  'a user sees none of another user''s transactions'
);
select is_empty(
  $$ select 1 from public.list_transactions(account_ids => array['a2000000-0000-0000-0000-000000000001'::uuid]) $$,
  'filtering on another user''s account shows nothing'
);

select * from finish();
rollback;
