begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates: the rollback restores whatever the database held.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', current_date - 3, 1.5, 'frankfurter'),
  ('CHF', current_date - 3, 0.9375, 'frankfurter');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Café', 'expense', '#2255aa'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Salaire', 'income', '#338855'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699');
insert into public.merchants (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marché Tau'),
  ('b1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Librairie Bruno');

-- Épicerie twice this month and Café once, Café twice long ago; a salary; Bruno's purchase.
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, merchant_id) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 2, -10, 'CAD', 'a1000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 5, -20, 'CAD', 'a1000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 1, -4, 'CAD', null),
  ('a3000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 200, -4, 'CAD', null),
  ('a3000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 201, -4, 'CAD', null),
  ('a3000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'income', current_date - 3, 100, 'CAD', null),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', current_date - 1, -12, 'CAD', 'b1000000-0000-0000-0000-000000000001');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'amount', 10, -10),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'amount', 20, -20),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'amount', 4, -4),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'amount', 4, -4),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'amount', 4, -4),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'amount', 100, 100),
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 12, -12);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select results_eq(
  $$ select merchant_id, transaction_count from public.merchant_usage $$,
  $$ values ('a1000000-0000-0000-0000-000000000001'::uuid, 2) $$,
  'merchants are counted by use, another user''s left out'
);
select results_eq(
  $$ select category_id, rank from public.frequent_categories where kind = 'expense' order by rank $$,
  $$ values ('a0000000-0000-0000-0000-000000000001'::uuid, 1), ('a0000000-0000-0000-0000-000000000002'::uuid, 2) $$,
  'frequent categories count the last 90 days only'
);
select results_eq(
  $$ select category_id from public.frequent_categories where kind = 'income' $$,
  $$ values ('a0000000-0000-0000-0000-000000000003'::uuid) $$,
  'each kind has its own frequent categories'
);
select is(
  public.exchange_rate_text('CAD', 'CHF', current_date),
  '0.625000000000',
  'the rate comes back as exact text, from the last day with a rate'
);
select is(
  public.exchange_rate_text('CAD', 'JPY', current_date),
  null,
  'a missing rate is null, never zero'
);
select is(
  (select count(*)::int from public.frequent_categories where category_id = 'b0000000-0000-0000-0000-000000000001'),
  0, 'a user sees none of another user''s usage'
);

select * from finish();
rollback;
