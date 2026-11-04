begin;
create extension if not exists pgtap with schema extensions;

select plan(40);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 100),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Wise', 'checking', 'CHF', 0),
  ('a2000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Épargne', 'savings', 'CAD', 0),
  ('a2000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Comptant', 'cash', 'CAD', 20),
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Maison', 'expense', '#2255aa'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Frais bancaires', 'expense', '#557733'),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Salaire', 'income', '#338855'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699');
insert into public.merchants (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marché Tau'),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Marché Tau Mile End');
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency) values
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'b2000000-0000-0000-0000-000000000001', 'expense', '2026-11-01', -12, 'CAD');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'amount', 12, -12);

-- The sum and transfer checks wait for the commit, which a test never reaches. This runs
-- them now; statements in between stay deferred, as in a real request.
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

-- A calendar date only, so no time zone can move it (spec 15)
select is_empty(
  $$ select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'transactions' and data_type in ('time without time zone', 'time with time zone') $$,
  'transactions have no time column'
);

-- Expenses and incomes (TRX-01, 02, 05)
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 84.12,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 84.12}]',
       merchant_id => 'a1000000-0000-0000-0000-000000000002', note => ' Épicerie de la semaine ');
     select pg_temp.check_now() $$,
  'an expense saves with its category'
);
select results_eq(
  $$ select t.amount, t.currency::text, t.note, s.amount
     from public.transactions t join public.transaction_splits s on s.transaction_id = t.id
     where t.note = 'Épicerie de la semaine' $$,
  $$ values (-84.12::numeric, 'CAD', 'Épicerie de la semaine', -84.12::numeric) $$,
  'an expense is booked negative in the account''s currency, the note trimmed'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 1.005,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 1.005}]') $$,
  '23514', 'amount_precision', 'an amount is no finer than the currency''s cents'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 0,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 1}]') $$,
  '23514', 'amount_not_positive', 'an amount is above zero'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 5, '[]') $$,
  '23514', 'transaction_needs_category', 'an expense needs a category'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'transfer', '2026-11-03', 5,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 5}]') $$,
  '23514', 'transaction_kind_invalid', 'transfers have their own function'
);

-- Splits (TRX-06)
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 1},
         {"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1},
         {"category_id": "a0000000-0000-0000-0000-000000000003", "input_mode": "share", "input_value": 1}]',
       note => 'Partagé');
     select pg_temp.check_now() $$,
  'an expense splits by shares'
);
select results_eq(
  $$ select s.amount from public.transaction_splits s
     join public.transactions t on t.id = s.transaction_id
     where t.note = 'Partagé' order by s.amount $$,
  $$ values (-3.34::numeric), (-3.33), (-3.33) $$,
  'the last line takes the rounding cent, so the lines sum to the amount'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "percent", "input_value": 60},
         {"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "percent", "input_value": 30}]') $$,
  '23514', 'splits_sum_mismatch', 'percentages total 100'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 6},
         {"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 4}]') $$,
  '23514', 'splits_mixed_modes', 'one input mode per transaction'
);
select throws_ok(
  $$ update public.transaction_splits s set amount = -80
     from public.transactions t
     where t.id = s.transaction_id and t.note = 'Épicerie de la semaine';
     select pg_temp.check_now() $$,
  '23514', 'splits_sum_mismatch', 'the database refuses splits that do not sum to the amount'
);
select throws_ok(
  $$ insert into public.transactions (account_id, kind, occurred_on, amount, currency)
     values ('a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', -5, 'CAD');
     select pg_temp.check_now() $$,
  '23514', 'transaction_needs_category', 'the database refuses an expense with no split'
);

-- Edit
select lives_ok(
  $$ select public.save_transaction(t.id, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-04', 50,
       '[{"category_id": "a0000000-0000-0000-0000-000000000004", "input_mode": "amount", "input_value": 50}]',
       note => 'Partagé')
     from public.transactions t where t.note = 'Partagé';
     select pg_temp.check_now() $$,
  'editing a transaction replaces its splits'
);
select results_eq(
  $$ select t.kind, t.amount, count(s.id)::int from public.transactions t
     join public.transaction_splits s on s.transaction_id = t.id
     where t.note = 'Partagé' group by t.kind, t.amount $$,
  $$ values ('income', 50::numeric, 1) $$,
  'the edited transaction has its new kind, amount and single split'
);

-- Foreign currency (CUR-08)
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 22.54,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 22.54}]',
       original_amount => 15, original_currency => 'EUR', note => 'Paris');
     select pg_temp.check_now() $$,
  'a foreign purchase keeps its receipt price'
);
select results_eq(
  $$ select amount, original_amount, original_currency::text from public.transactions where note = 'Paris' $$,
  $$ values (-22.54::numeric, -15::numeric, 'EUR') $$,
  'the original amount is signed like the amount'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 5,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 5}]',
       original_amount => 5, original_currency => 'CAD') $$,
  '23514', null, 'the original currency differs from the account''s'
);

-- Transfers (TRX-04, 11)
select lives_ok(
  $$ select public.save_transfer(null, 'a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000003',
       500, '2026-11-03', fee => 2.5, fee_category => 'a0000000-0000-0000-0000-000000000003',
       note => 'Épargne novembre', to_pending => true);
     select pg_temp.check_now() $$,
  'a transfer saves with its fee'
);
select results_eq(
  $$ select kind, amount, status from public.transactions
     where transfer_id = (select transfer_id from public.transactions where note = 'Épargne novembre' limit 1)
     order by amount $$,
  $$ values ('transfer', -500::numeric, 'cleared'), ('expense', -2.5, 'cleared'), ('transfer', 500, 'pending') $$,
  'two mirrored legs and a fee on the departure side, each with its own status'
);
select is(
  (select transfer_fee_category_id from public.profiles),
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'the fee category is remembered on the profile'
);
select throws_ok(
  $$ delete from public.transactions where note = 'Épargne novembre' and amount > 0;
     select pg_temp.check_now() $$,
  '23514', 'transfer_incomplete', 'one leg cannot be deleted alone'
);
select lives_ok(
  $$ select public.save_transfer(t.transfer_id, 'a2000000-0000-0000-0000-000000000001',
       'a2000000-0000-0000-0000-000000000003', 400, '2026-11-03', note => 'Épargne novembre')
     from public.transactions t where t.note = 'Épargne novembre' and t.amount < 0;
     select pg_temp.check_now() $$,
  'editing a transfer can drop its fee'
);
select results_eq(
  $$ select amount from public.transactions
     where transfer_id = (select transfer_id from public.transactions where note = 'Épargne novembre' limit 1)
     order by amount $$,
  $$ values (-400::numeric), (400) $$,
  'the legs are updated and the fee is gone'
);
select throws_ok(
  $$ select public.save_transfer(null, 'a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
       100, '2026-11-03') $$,
  '23514', 'transfer_received_required', 'a transfer between currencies needs what arrived'
);
select lives_ok(
  $$ select public.save_transfer(null, 'a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
       100, '2026-11-03', received => 57.40, note => 'Vers Wise');
     select pg_temp.check_now() $$,
  'a transfer between currencies keeps what really moved'
);
select throws_ok(
  $$ select public.save_transfer(null, 'a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
       100, '2026-11-03') $$,
  '23514', 'transfer_same_account', 'a transfer needs two accounts'
);
select lives_ok(
  $$ select public.delete_transfer(t.transfer_id) from public.transactions t where t.note = 'Vers Wise' limit 1;
     select pg_temp.check_now() $$,
  'a transfer is deleted with all its parts'
);
select throws_ok(
  $$ select public.save_transaction(t.id, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 5,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 5}]')
     from public.transactions t where t.note = 'Épargne novembre' limit 1 $$,
  'P0002', 'transaction_not_found', 'a transfer leg is not edited as an expense'
);

-- Adjustment and balances (TRX-03, TRX-09, ACC-06)
select lives_ok(
  $$ select public.save_adjustment('a2000000-0000-0000-0000-000000000004', 32.40, '2026-11-03') $$,
  'an adjustment saves from the real balance'
);
select throws_ok(
  $$ select public.save_adjustment('a2000000-0000-0000-0000-000000000004', 32.40, '2026-11-03') $$,
  '23514', 'balance_already_matches', 'an adjustment of zero is refused'
);
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000004', 'expense', '2026-11-04', 5,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 5}]',
       status => 'pending') $$,
  'a pending expense saves'
);
select results_eq(
  $$ select balance, pending from public.account_balances
     where account_id = 'a2000000-0000-0000-0000-000000000004' $$,
  $$ values (27.40::numeric(19,4), -5::numeric(19,4)) $$,
  'the balance is the opening balance, the adjustment and the pending expense'
);

-- What transactions hold in place
select throws_ok(
  $$ update public.accounts set currency = 'CHF' where id = 'a2000000-0000-0000-0000-000000000004' $$,
  '23503', null, 'an account''s currency cannot change once it has transactions'
);
select throws_ok(
  $$ delete from public.categories where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '23503', null, 'a category with transactions cannot be deleted'
);
select lives_ok(
  $$ select public.merge_merchants('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001') $$,
  'a merchant with transactions merges'
);
select results_eq(
  $$ select count(*)::int from public.transactions where merchant_id = 'a1000000-0000-0000-0000-000000000001' $$,
  $$ values (1) $$,
  'merging merchants moves the transactions to the target (MER-05)'
);

-- Isolation
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 5,
       '[{"category_id": "b0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 5}]') $$,
  '23503', null, 'a split cannot use another user''s category'
);
select is(
  (select count(*)::int from public.transactions where user_id <> auth.uid())
    + (select count(*)::int from public.transaction_splits where user_id <> auth.uid()),
  0, 'a user sees none of another user''s transactions or splits'
);
delete from public.transactions where id = 'b3000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.transactions where id = 'b3000000-0000-0000-0000-000000000001'),
  1, 'a user cannot delete another user''s transaction'
);

select * from finish();
rollback;
