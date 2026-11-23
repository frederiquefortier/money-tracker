begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates. CHF has a rate from 2025-03-01 only.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2020-01-01', 1.5, 'frankfurter'),
  ('CHF', '2025-03-01', 1.0, 'frankfurter');

-- One of Bruno's, at a merchant of his.
insert into public.categories (id, user_id, name, kind, color) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Loisirs Bruno', 'expense', '#336699');
insert into public.accounts (id, user_id, name, type, currency) values
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.merchants (id, user_id, name) values
  ('b7000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Boutique Bruno');
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, merchant_id) values
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', '2026-03-05', -70, 'CAD', 'b7000000-0000-0000-0000-000000000001');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 70, -70);

-- Alice: three bills at Épicerie Test in March, one of them shared with Sam who repays
-- half with i2, a refund from it as income, a bill without a merchant, and one in CHF
-- before CHF has a rate.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  (public.import_batch($j$
{
  "files": ["accounts.csv", "transactions.csv", "splits.csv", "people.csv"],
  "accounts": [
    {"name": "Chèque", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2024-01-01"},
    {"name": "Franc", "type": "checking", "currency": "CHF", "opening_balance": "0.00", "opened_on": "2024-01-01"}
  ],
  "transactions": [
    {"ref": "e1", "date": "2026-03-02", "account": "Chèque", "kind": "expense", "amount": "-40.00", "currency": "CAD", "merchant": "Épicerie Test"},
    {"ref": "e2", "date": "2026-03-09", "account": "Chèque", "kind": "expense", "amount": "-100.00", "currency": "CAD", "merchant": "Épicerie Test"},
    {"ref": "e3", "date": "2026-03-20", "account": "Chèque", "kind": "expense", "amount": "-10.00", "currency": "CAD", "merchant": "Épicerie Test"},
    {"ref": "i1", "date": "2026-03-21", "account": "Chèque", "kind": "income", "amount": "5.00", "currency": "CAD", "merchant": "Épicerie Test"},
    {"ref": "i2", "date": "2026-03-12", "account": "Chèque", "kind": "income", "amount": "50.00", "currency": "CAD"},
    {"ref": "e4", "date": "2026-03-22", "account": "Chèque", "kind": "expense", "amount": "-25.00", "currency": "CAD"},
    {"ref": "c1", "date": "2025-01-10", "account": "Franc", "kind": "expense", "amount": "-10.00", "currency": "CHF", "merchant": "Café Zurich"}
  ],
  "splits": [
    {"ref": "e1", "category": "Épicerie", "amount": "-40.00"},
    {"ref": "e2", "category": "Épicerie", "amount": "-100.00"},
    {"ref": "e3", "category": "Épicerie", "amount": "-10.00"},
    {"ref": "i1", "category": "Épicerie", "amount": "5.00"},
    {"ref": "i2", "category": "Épicerie", "amount": "50.00"},
    {"ref": "e4", "category": "Épicerie", "amount": "-25.00"},
    {"ref": "c1", "category": "Sorties", "amount": "-10.00"}
  ],
  "people": [
    {"ref": "e2", "role": "owes", "person": "Sam"},
    {"ref": "i2", "role": "from", "person": "Sam", "amount": "50.00", "reimburses": "e2"}
  ],
  "aliases": [], "counterparties": []
}
$j$::jsonb) ->> 'ok')::boolean,
  true, 'the invented history imports'
);

create temporary table bills as
  select b.*, m.name
  from public.merchant_monthly() b
  join public.merchants m on m.id = b.merchant_id;

select is(
  (select count(*)::int from public.merchant_monthly()
   where merchant_id = 'b7000000-0000-0000-0000-000000000001'),
  0, 'another user''s merchants are not returned'
);
select is(
  (select row(visits, display_total)::text from bills where name = 'Épicerie Test'),
  row(3, '100.0000')::text,
  'a month counts each expense once, at my share, positive'
);
select is(
  (select row(display_min, display_max)::text from bills where name = 'Épicerie Test'),
  row('10.0000', '50.0000')::text,
  'the smallest and largest bill of the month, a shared one at my part'
);
select is(
  (select count(*)::int from bills),
  2, 'one row per merchant and month; an expense without a merchant is left out'
);
select is(
  (select row(visits, display_total, display_min)::text from bills where name = 'Café Zurich'),
  row(1, null, null)::text, 'a missing rate gives null, never zero'
);

select * from finish();
rollback;
