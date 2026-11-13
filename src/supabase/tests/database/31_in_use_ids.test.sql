begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.accounts (id, user_id, name, type, currency) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD'),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Épargne', 'savings', 'CAD'),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Café', 'expense', '#2255aa'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699');
insert into public.holdings (id, user_id, type, name, country, currency, opened_on) values
  ('a5000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CA_RRSP', 'Ancien REER', 'CA', 'CAD', '2020-01-01'),
  ('a5000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'CA_RRSP', 'Nouveau REER', 'CA', 'CAD', '2024-01-01'),
  ('a5000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'CA_TFSA', 'CELI', 'CA', 'CAD', '2024-01-01'),
  ('a5000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'CA_TFSA', 'Vide', 'CA', 'CAD', '2024-01-01'),
  ('b5000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'CA_RRSP', 'REER Bruno', 'CA', 'CAD', '2020-01-01');

insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency) values
  ('a3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-01', -10, 'CAD'),
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', '2026-10-01', -12, 'CAD');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'amount', 10, -10),
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 12, -12);
insert into public.holding_contributions (user_id, holding_id, on_date, amount) values
  ('11111111-1111-1111-1111-111111111111', 'a5000000-0000-0000-0000-000000000001', '2020-06-01', 1000),
  ('22222222-2222-2222-2222-222222222222', 'b5000000-0000-0000-0000-000000000001', '2020-06-01', 1000);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

insert into public.holding_transfers (from_holding_id, to_holding_id, on_date, amount)
  values ('a5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000003', '2024-02-01', 1);

select is(
  public.used_category_ids(),
  array['a0000000-0000-0000-0000-000000000001']::uuid[],
  'a category is in use once a split names it, another user''s left out'
);
select is(
  public.used_account_ids(),
  array['a2000000-0000-0000-0000-000000000001']::uuid[],
  'an account is in use once a transaction names it, another user''s left out'
);
select is(
  (select array_agg(id order by id) from unnest(public.holdings_with_history()) id),
  array['a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000002',
        'a5000000-0000-0000-0000-000000000003']::uuid[],
  'a contribution and both sides of a transfer give a holding a history, another user''s left out'
);

-- Bruno sees only his own.
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);

select is(
  public.used_category_ids(),
  array['b0000000-0000-0000-0000-000000000001']::uuid[],
  'another user sees only his categories'
);
select is(
  public.holdings_with_history(),
  array['b5000000-0000-0000-0000-000000000001']::uuid[],
  'another user sees only his holdings'
);

-- Signed out, nothing.
reset role;
set local role anon;
select throws_ok(
  $$ select public.used_category_ids() $$,
  '42501', null, 'anon cannot call it'
);
select throws_ok(
  $$ select public.holdings_with_history() $$,
  '42501', null, 'anon cannot call the holdings one'
);

reset role;
select * from finish();
rollback;
