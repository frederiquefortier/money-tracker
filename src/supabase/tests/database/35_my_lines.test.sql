begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Only invented rates. CHF has a rate from 2025-03-01 only.
delete from public.exchange_rates;
insert into public.exchange_rates (quote, rate_date, rate, source) values
  ('CAD', '2020-01-01', 1.5, 'frankfurter'),
  ('CHF', '2025-03-01', 1.0, 'frankfurter');

insert into public.categories (id, user_id, parent_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', null, 'Frais bancaires', 'expense', '#22aa33'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', null, 'Loisirs Bruno', 'expense', '#336699');
update public.profiles set transfer_fee_category_id = 'a0000000-0000-0000-0000-000000000001'
  where user_id = '11111111-1111-1111-1111-111111111111';

-- One of Bruno's, on an event of his.
insert into public.accounts (id, user_id, name, type, currency) values
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');
insert into public.events (id, user_id, name) values
  ('b6000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Fête Bruno');
insert into public.transactions (id, user_id, account_id, kind, occurred_on, amount, currency, event_id) values
  ('b3000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000001',
   'expense', '2026-03-05', -70, 'CAD', 'b6000000-0000-0000-0000-000000000001');
insert into public.transaction_splits (user_id, transaction_id, category_id, input_mode, input_value, amount) values
  ('22222222-2222-2222-2222-222222222222', 'b3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'amount', 70, -70);

-- Alice:
-- e1, a meal split in two categories, half owed by Sam, who repays it with i1.
-- e2, a rent owed by Zoé, who sends back 20 too much with i2.
-- e3, a dinner Léo owes an unknown part of, nothing back yet, pending.
-- A transfer with its fee, an adjustment, and an expense in CHF before CHF has a rate.
-- e1 and e3 are on Voyage; the CHF one is on Zurich.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  (public.import_batch($j$
{
  "files": ["accounts.csv", "transactions.csv", "splits.csv", "people.csv"],
  "accounts": [
    {"name": "Chèque", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2024-01-01"},
    {"name": "Épargne", "type": "savings", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2024-01-01"},
    {"name": "Franc", "type": "checking", "currency": "CHF", "opening_balance": "0.00", "opened_on": "2024-01-01"}
  ],
  "transactions": [
    {"ref": "e1", "date": "2026-03-02", "account": "Chèque", "kind": "expense", "amount": "-100.00", "currency": "CAD", "event": "Voyage"},
    {"ref": "i1", "date": "2026-03-04", "account": "Chèque", "kind": "income", "amount": "50.00", "currency": "CAD"},
    {"ref": "e2", "date": "2026-03-01", "account": "Chèque", "kind": "expense", "amount": "-80.00", "currency": "CAD"},
    {"ref": "i2", "date": "2026-03-03", "account": "Chèque", "kind": "income", "amount": "100.00", "currency": "CAD"},
    {"ref": "e3", "date": "2026-03-06", "account": "Chèque", "kind": "expense", "amount": "-40.00", "currency": "CAD", "event": "Voyage", "status": "pending"},
    {"ref": "t4", "date": "2026-03-10", "account": "Chèque", "kind": "transfer", "amount": "-500.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t5", "date": "2026-03-10", "account": "Épargne", "kind": "transfer", "amount": "500.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t6", "date": "2026-03-10", "account": "Chèque", "kind": "expense", "amount": "-2.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t7", "date": "2026-03-20", "account": "Épargne", "kind": "adjustment", "amount": "0.50", "currency": "CAD"},
    {"ref": "c1", "date": "2025-01-10", "account": "Franc", "kind": "expense", "amount": "-10.00", "currency": "CHF", "event": "Zurich"}
  ],
  "splits": [
    {"ref": "e1", "category": "Sorties > Restaurants", "amount": "-60.00"},
    {"ref": "e1", "category": "Sorties > Bars", "amount": "-40.00"},
    {"ref": "i1", "category": "Sorties > Restaurants", "amount": "50.00"},
    {"ref": "e2", "category": "Loyer", "amount": "-80.00"},
    {"ref": "i2", "category": "Loyer", "amount": "100.00"},
    {"ref": "e3", "category": "Sorties > Restaurants", "amount": "-40.00"},
    {"ref": "c1", "category": "Sorties > Restaurants", "amount": "-10.00"}
  ],
  "people": [
    {"ref": "e1", "role": "owes", "person": "Sam"},
    {"ref": "i1", "role": "from", "person": "Sam", "amount": "50.00", "reimburses": "e1"},
    {"ref": "e2", "role": "owes", "person": "Zoé"},
    {"ref": "i2", "role": "from", "person": "Zoé", "amount": "100.00", "reimburses": "e2"},
    {"ref": "e3", "role": "owes", "person": "Léo"}
  ],
  "aliases": [], "counterparties": []
}
$j$::jsonb) ->> 'ok')::boolean,
  true, 'the invented history imports'
);

create temporary table lines as
  select l.*, t.import_ref, c.name as category
  from public.my_lines() l
  join public.transactions t on t.id = l.transaction_id
  join public.categories c on c.id = l.category_id;

select is(
  (select count(*)::int from public.my_lines() where transaction_id = 'b3000000-0000-0000-0000-000000000001'),
  0, 'another user''s lines are not returned'
);
select is(
  (select count(*)::int from public.event_totals() where event_id = 'b6000000-0000-0000-0000-000000000001'),
  0, 'another user''s event totals are not returned'
);
select is(
  (select array_agg(display_amount order by category) from lines where import_ref = 'e1'),
  array['-20.0000', '-30.0000'],
  'a shared expense counts my half, spread over its splits'
);
select is(
  (select display_amount from lines where import_ref = 'i1'),
  '0.0000', 'a repayment of what was owed counts nothing'
);
select is(
  (select array_agg(display_amount order by import_ref) from lines where import_ref in ('e2', 'i2')),
  array['0.0000', '20.0000'],
  'a repayment above the part leaves only the excess, as income in its category'
);
select is(
  (select row(display_amount, owed_open, pending)::text from lines where import_ref = 'e3'),
  row('-40.0000', true, true)::text,
  'an unknown owed part counts as mine until repaid, marked open and pending'
);
select is(
  (select count(*)::int from lines where import_ref in ('t4', 't5', 't7')),
  0, 'transfer legs and adjustments are left out'
);
select is(
  (select display_amount from lines where import_ref = 't6'),
  '-2.0000', 'a transfer fee is spending'
);
select is(
  (select display_amount from lines where import_ref = 'c1'),
  null, 'a missing rate gives null, never zero'
);
select is(
  (select array_agg(distinct t.import_ref order by t.import_ref)
   from public.my_lines('2026-03-02', '2026-03-04') l
   join public.transactions t on t.id = l.transaction_id),
  array['e1', 'i1', 'i2'], 'the dates bound the lines, both days included'
);
select is(
  (select row(x.display_total, x.transaction_count)::text from public.event_totals() x
   join public.events e on e.id = x.event_id where e.name = 'Voyage'),
  row('-90.0000', 2)::text, 'an event''s total is the sum of its lines'
);
select is(
  (select x.display_total from public.event_totals() x
   join public.events e on e.id = x.event_id where e.name = 'Zurich'),
  null, 'an event with a missing rate has no total'
);
select is(
  (select count(*)::int from public.event_category_totals() where event_id = 'b6000000-0000-0000-0000-000000000001'),
  0, 'another user''s event category totals are not returned'
);
select is(
  (select array_agg(c.name || ' ' || x.display_total order by c.name) from public.event_category_totals() x
   join public.events e on e.id = x.event_id
   join public.categories c on c.id = x.category_id where e.name = 'Voyage'),
  array['Bars -20.0000', 'Restaurants -70.0000'],
  'an event''s totals per category add up to its total'
);
select is(
  (select x.display_total from public.event_category_totals() x
   join public.events e on e.id = x.event_id where e.name = 'Zurich'),
  null, 'a category with a missing rate has no total'
);

select is(
  (select count(*)::int from public.my_monthly() m
   join public.categories c on c.id = m.category_id
   where c.user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'another user''s months are not returned'
);
select is(
  (select m.display_amount from public.my_monthly() m
   join public.categories c on c.id = m.category_id
   where m.month = '2026-03-01' and c.name = 'Restaurants'),
  '-70.0000', 'a month sums its lines per category: my half of e1, e3, and a repayment counting nothing'
);
select is(
  (select m.display_amount from public.my_monthly() m
   join public.categories c on c.id = m.category_id
   where m.month = '2025-01-01' and c.name = 'Restaurants'),
  null, 'a month with a missing rate has no figure'
);

select * from finish();
rollback;
