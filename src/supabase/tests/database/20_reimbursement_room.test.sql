begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'alice@example.test');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Inès'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Arnaud');

create temp table pay (p jsonb);
grant all on pay to public;
create temp table res (r jsonb);
grant all on res to public;

-- A rent of 2000, owed by two people who send back 1500 and 510.25: 10.25 too much, a gift.
insert into pay values ($j$
{
  "files": ["transactions.csv", "splits.csv", "people.csv"],
  "accounts": [{"name": "Chèque", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2026-01-01"}],
  "transactions": [
    {"ref": "e1", "date": "2026-08-25", "account": "Chèque", "kind": "expense", "amount": "-2000.00", "currency": "CAD"},
    {"ref": "i1", "date": "2026-08-26", "account": "Chèque", "kind": "income", "amount": "1500.00", "currency": "CAD"},
    {"ref": "i2", "date": "2026-08-26", "account": "Chèque", "kind": "income", "amount": "510.25", "currency": "CAD"}
  ],
  "splits": [
    {"ref": "e1", "category": "Loyer", "amount": "-2000.00"},
    {"ref": "i1", "category": "Loyer", "amount": "1500.00"},
    {"ref": "i2", "category": "Loyer", "amount": "510.25"}
  ],
  "people": [
    {"ref": "e1", "role": "owes", "person": "Inès"},
    {"ref": "e1", "role": "owes", "person": "Arnaud"},
    {"ref": "i1", "role": "from", "person": "Inès", "amount": "1500.00", "reimburses": "e1"},
    {"ref": "i2", "role": "from", "person": "Arnaud", "amount": "510.25", "reimburses": "e1"}
  ],
  "aliases": [], "counterparties": []
}
$j$::jsonb);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

insert into res select public.import_batch((select p from pay));
select is((select (r ->> 'ok')::boolean from res), true, 'repayments above the expense import');

-- The people check the database runs at commit, run now.
select lives_ok(
  $$ select public.check_transaction_people(t.id) from public.transactions t where t.import_ref = 'e1' $$,
  'the parts still add up to the expense'
);
select is(
  (select p.amount from public.transaction_people p join public.transactions t on t.id = p.transaction_id
   where t.import_ref = 'e1' and p.role = 'me'),
  0.0000, 'Moi is left nothing, not a negative part'
);
select is(
  (select p.amount from public.transaction_people p join public.transactions t on t.id = p.transaction_id
   join public.people q on q.id = p.person_id where t.import_ref = 'e1' and q.name = 'Arnaud'),
  -500.0000, 'the second repayment is cut at what the first left'
);
select is(
  (select sum(r.amount) from public.reimbursements r), 2000.0000, 'the gift stays out of the reimbursements'
);

select is(
  (select sum(s.amount) from public.transaction_splits s join public.categories c on c.id = s.category_id where c.name = 'Loyer'),
  10.2500, 'the repayments keep their category, so its total goes below zero rather than the extra being dropped'
);

-- An expense shared only with guests is written in bulk: Moi first, the last line takes the rounding.
insert into res select public.import_batch($j$
{
  "files": ["transactions.csv", "splits.csv", "people.csv"],
  "accounts": [{"name": "Chèque 2", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2026-01-01"}],
  "transactions": [{"ref": "g1", "date": "2026-09-01", "account": "Chèque 2", "kind": "expense", "amount": "-10.00", "currency": "CAD"}],
  "splits": [{"ref": "g1", "category": "Loyer", "amount": "-10.00"}],
  "people": [
    {"ref": "g1", "role": "invited", "person": "Inès"},
    {"ref": "g1", "role": "invited", "head_count": "1"}
  ],
  "aliases": [], "counterparties": []
}
$j$::jsonb);
select is(
  (select array_agg(p.amount order by p.position) from public.transaction_people p
   join public.transactions t on t.id = p.transaction_id where t.import_ref = 'g1'),
  array[-3.3300, -3.3300, -3.3400], 'guests share an expense with Moi, the last line taking the rounding'
);
select is(
  (select array_agg(p.role order by p.position) from public.transaction_people p
   join public.transactions t on t.id = p.transaction_id where t.import_ref = 'g1'),
  array['me', 'invited', 'invited'], 'Moi is the first line'
);
select lives_ok(
  $$ select public.check_transaction_people(t.id) from public.transactions t where t.import_ref = 'g1' $$,
  'and the database accepts the parts'
);

select * from finish();
rollback;
