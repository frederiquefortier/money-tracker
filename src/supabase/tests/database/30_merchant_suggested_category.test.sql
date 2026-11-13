begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.accounts (id, user_id, name, type, currency) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Café', 'expense', '#2255aa'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699');
insert into public.merchants (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marché Tau'),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tie Shop'),
  ('b1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Librairie Bruno');

-- Marché Tau: Épicerie twice (older), Café once (newer): the most used wins.
-- Tie Shop: one of each, Café the later: the one used last wins.
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, merchant_id) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 20, -10, 'CAD', 'a1000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 10, -20, 'CAD', 'a1000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 1, -4, 'CAD', 'a1000000-0000-0000-0000-000000000001'),
  ('a3000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 8, -5, 'CAD', 'a1000000-0000-0000-0000-000000000002'),
  ('a3000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', current_date - 2, -6, 'CAD', 'a1000000-0000-0000-0000-000000000002'),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', current_date - 1, -12, 'CAD', 'b1000000-0000-0000-0000-000000000001');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'amount', 10, -10),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'amount', 20, -20),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'amount', 4, -4),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'amount', 5, -5),
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'amount', 6, -6),
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 12, -12);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select results_eq(
  $$ select merchant_id, category_id from public.merchant_suggested_category order by merchant_id $$,
  $$ values
    ('a1000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid),
    ('a1000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid) $$,
  'the most used category, then the last used on a tie'
);

select is(
  (select count(*)::int from public.merchant_suggested_category where merchant_id = 'b1000000-0000-0000-0000-000000000001'),
  0,
  'another user''s merchant is not visible'
);

set local role anon;
select throws_ok(
  $$ select * from public.merchant_suggested_category $$,
  '42501',
  null,
  'anon cannot read it'
);

select * from finish();
rollback;
