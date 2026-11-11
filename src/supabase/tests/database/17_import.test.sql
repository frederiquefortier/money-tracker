begin;
create extension if not exists pgtap with schema extensions;

select plan(39);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Made as the owner of the tables, so the ids are known.
insert into public.institutions (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Banque Sud');
insert into public.accounts (id, user_id, institution_id, name, type, currency, opening_balance, opened_on) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'Chèque', 'checking', 'CAD', 0, '2026-01-01'),
  ('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'Épargne', 'savings', 'CAD', 0, '2026-01-01');
insert into public.categories (id, user_id, parent_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', null, 'Alimentation', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Épicerie', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', null, 'Animaux', 'expense', '#3322aa'),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', null, 'Frais bancaires', 'expense', '#22aa33');
-- Animaux is archived from 2026-02-01: that day still counts (ADR-035), the next does not.
insert into public.category_status_events (category_id, user_id, status, effective_on) values
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'archived', '2026-02-01');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam');
update public.profiles set transfer_fee_category_id = 'a0000000-0000-0000-0000-000000000004'
  where user_id = '11111111-1111-1111-1111-111111111111';

create temp table pay (name text primary key, p jsonb);
grant all on pay to public;

-- A file that is right: an existing account whose opening balance is set, a new account,
-- an expense in a new category with a new merchant and an event, a split with people, the
-- income that repays it, a transfer with its fee, an adjustment, an archived category on
-- its last day, and a purchase in another currency.
insert into pay values ('good', $j$
{
  "files": ["accounts.csv", "transactions.csv", "splits.csv", "people.csv"],
  "accounts": [
    {"name": "Chèque", "institution": "Banque Sud", "type": "checking", "currency": "CAD", "opening_balance": "100.00", "opened_on": "2025-12-31"},
    {"name": "Historique", "type": "checking", "currency": "CAD", "opening_balance": "-10.00", "opened_on": "2025-01-01"}
  ],
  "transactions": [
    {"ref": "t1", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-30.00", "currency": "CAD", "merchant": "Marché Central", "event": "Voyage test", "note": "Épicerie"},
    {"ref": "t2", "date": "2026-02-05", "account": "Chèque", "kind": "expense", "amount": "-62.00", "currency": "CAD", "merchant": "Bistro du Coin"},
    {"ref": "t3", "date": "2026-02-10", "account": "Chèque", "kind": "income", "amount": "31.00", "currency": "CAD"},
    {"ref": "t4", "date": "2026-02-16", "account": "Chèque", "kind": "transfer", "amount": "-500.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t5", "date": "2026-02-16", "account": "Épargne", "kind": "transfer", "amount": "500.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t6", "date": "2026-02-16", "account": "Chèque", "kind": "expense", "amount": "-2.00", "currency": "CAD", "transfer_group": "tr-1"},
    {"ref": "t7", "date": "2026-02-20", "account": "Épargne", "kind": "adjustment", "amount": "0.50", "currency": "CAD", "note": "Intérêts"},
    {"ref": "t8", "date": "2026-02-01", "account": "Historique", "kind": "expense", "amount": "-12.00", "currency": "CAD"},
    {"ref": "t9", "date": "2026-02-12", "account": "Chèque", "kind": "expense", "amount": "-45.31", "currency": "CAD", "original_amount": "-30.00", "original_currency": "EUR", "event": "Voyage test", "status": "pending"}
  ],
  "splits": [
    {"ref": "t1", "category": "Alimentation > Épicerie", "amount": "-30.00"},
    {"ref": "t2", "category": "Sorties > Restaurants", "amount": "-50.00"},
    {"ref": "t2", "category": "Sorties > Bars", "amount": "-12.00"},
    {"ref": "t3", "category": "Sorties > Restaurants", "amount": "31.00"},
    {"ref": "t8", "category": "Animaux", "amount": "-12.00"},
    {"ref": "t9", "category": "alimentation", "amount": "-45.31"}
  ],
  "people": [
    {"ref": "t2", "role": "invited", "person": "alex"},
    {"ref": "t2", "role": "owes", "person": "Sam"},
    {"ref": "t3", "role": "from", "person": "Sam", "amount": "31.00", "reimburses": "t2"}
  ],
  "aliases": [
    {"kind": "merchant", "name": "Marché Central", "alias": "Marche C."},
    {"kind": "person", "name": "Alex", "alias": "Alexandre"}
  ]
}
$j$::jsonb);

-- A file with a fault of each kind.
insert into pay values ('bad', $j$
{
  "accounts": [],
  "transactions": [
    {"ref": "b1", "date": "2026-02-03", "account": "Nulle part", "kind": "expense", "amount": "-5.00", "currency": "CAD"},
    {"ref": "b2", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "5.00", "currency": "CAD"},
    {"ref": "b3", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-20.00", "currency": "CAD"},
    {"ref": "b4", "date": "2026-02-03", "account": "Chèque", "kind": "transfer", "amount": "-40.00", "currency": "CAD", "transfer_group": "x"},
    {"ref": "b5", "date": "2026-02-02", "account": "Chèque", "kind": "expense", "amount": "-8.00", "currency": "CAD"},
    {"ref": "b6", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-9.00", "currency": "USD"},
    {"ref": "b7", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-10.001", "currency": "CAD"}
  ],
  "splits": [
    {"ref": "b2", "category": "Alimentation", "amount": "5.00"},
    {"ref": "b3", "category": "Alimentation", "amount": "-15.00"},
    {"ref": "b5", "category": "Animaux", "amount": "-8.00"},
    {"ref": "b6", "category": "Alimentation", "amount": "-9.00"},
    {"ref": "b7", "category": "Alimentation", "amount": "-10.001"}
  ],
  "people": [
    {"ref": "b3", "role": "invited", "person": "Alex", "amount": "5.00"}
  ],
  "aliases": [
    {"kind": "merchant", "name": "Nulle part", "alias": "x"},
    {"kind": "person", "name": "Alex", "alias": "Sam"},
    {"kind": "fruit", "name": "a", "alias": "b"},
    {"kind": "person", "name": "Alex", "alias": "alex"}
  ]
}
$j$::jsonb);

-- A later file that names a merchant by an alias the first one taught.
insert into pay values ('alias', $j$
{
  "transactions": [
    {"ref": "z1", "date": "2026-03-01", "account": "Chèque", "kind": "expense", "amount": "-5.00", "currency": "CAD", "merchant": "marche c."}
  ],
  "splits": [{"ref": "z1", "category": "Alimentation > Épicerie", "amount": "-5.00"}]
}
$j$::jsonb);

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- The checks.
create temp table res (name text primary key, r jsonb);
grant all on res to public;
insert into res select 'bad', public.import_batch((select p from pay where name = 'bad'));

select is((select (r ->> 'ok')::boolean from res where name = 'bad'), false, 'a file with faults is refused');
select is(
  (select array_agg(distinct e ->> 'code' order by e ->> 'code')
   from res, jsonb_array_elements(r -> 'errors') e where name = 'bad'),
  array['account_unknown', 'alias_kind_invalid', 'alias_same', 'alias_taken', 'alias_target_unknown',
        'amount_precision', 'amount_sign', 'category_archived', 'category_missing', 'currency_mismatch',
        'people_amount_unsupported', 'split_sum_mismatch', 'transfer_incomplete'],
  'every fault is named'
);
select is(
  (select e ->> 'file' || ':' || (e ->> 'line') from res, jsonb_array_elements(r -> 'errors') e
   where name = 'bad' and e ->> 'code' = 'account_unknown'),
  'transactions.csv:2', 'a fault says its file and line'
);
select is((select count(*)::int from public.transactions), 0, 'a refused file writes nothing');
select is((select count(*)::int from public.import_batches), 0, 'and records no batch');

-- The summary.
insert into res select 'dry', public.import_batch((select p from pay where name = 'good'), true);
select is((select (r ->> 'ok')::boolean from res where name = 'dry'), true, 'a right file passes its check');
select is(
  (select r -> 'will_create' -> 'merchants' from res where name = 'dry'),
  '["Bistro du Coin", "Marché Central"]'::jsonb, 'the summary lists the merchants it would create'
);
select is(
  (select r -> 'will_create' -> 'categories' from res where name = 'dry'),
  '["Sorties", "Sorties > Bars", "Sorties > Restaurants"]'::jsonb, 'and the categories, parents included'
);
select is(
  (select r -> 'will_create' -> 'events' from res where name = 'dry'),
  '["Voyage test"]'::jsonb, 'and the events'
);
select is(
  (select r -> 'will_create' -> 'account_changes' -> 0 ->> 'name' from res where name = 'dry'),
  'Chèque', 'and the opening balance it would set'
);
select is((select count(*)::int from public.transactions), 0, 'a check writes nothing');

-- The import.
insert into res select 'run', public.import_batch((select p from pay where name = 'good'));
select is((select (r ->> 'ok')::boolean from res where name = 'run'), true, 'the file is imported');
select is(
  (select (r -> 'created' ->> 'transactions')::int from res where name = 'run'),
  9, 'its nine transactions are written'
);
select is(
  (select sum(s.amount) from public.transaction_splits s join public.transactions t on t.id = s.transaction_id
   where t.import_ref = 't2'),
  -62.0000, 'the splits add up to their transaction'
);
select is(
  (select count(*)::int from public.categories where import_batch_id is not null),
  3, 'new categories are created, with their parent'
);
select is(
  (select count(*)::int from public.transactions t join public.transaction_splits s on s.transaction_id = t.id
   where t.import_ref = 't9' and s.category_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'a category is found whatever its case'
);
select is(
  (select count(distinct transfer_id)::int from public.transactions where import_ref in ('t4', 't5', 't6')),
  1, 'a transfer and its fee share one id'
);
select is(
  (select s.category_id from public.transaction_splits s join public.transactions t on t.id = s.transaction_id
   where t.import_ref = 't6'),
  'a0000000-0000-0000-0000-000000000004'::uuid, 'the fee is in the fee category'
);
select is(
  (select opening_balance from public.accounts where id = 'a2000000-0000-0000-0000-000000000001'),
  100.0000, 'an account with no transactions takes the file''s opening balance'
);
select is(
  (select p.amount from public.transaction_people p join public.transactions t on t.id = p.transaction_id
   where t.import_ref = 't2' and p.role = 'owes'),
  -31.0000, 'the person who owes is set by the income that repaid them'
);
select is(
  (select count(*)::int from public.transaction_people p join public.transactions t on t.id = p.transaction_id
   where t.import_ref = 't2' and p.role = 'me'),
  1, 'Moi is added to a shared expense'
);
select is((select count(*)::int from public.reimbursements), 1, 'the reimbursement is recorded');
select is(
  (select count(*)::int from public.events e where e.name = 'Voyage test' and e.starts_on is null and e.ends_on is null),
  1, 'an event is created by name, with no dates'
);
select is(
  (select count(*)::int from public.transactions where event_source = 'manual' and event_id is not null),
  2, 'and its rows are linked by hand'
);

-- The other spellings are kept, and a later file finds the merchant by one.
select is(
  (select count(*)::int from public.merchant_aliases a join public.merchants m on m.id = a.merchant_id
   where a.alias = 'Marche C.' and m.name = 'Marché Central'),
  1, 'an alias from the file is kept for its merchant'
);
select is(
  (select count(*)::int from public.person_aliases a join public.people p on p.id = a.person_id
   where a.alias = 'Alexandre' and p.name = 'Alex'),
  1, 'and for its person'
);
select is(
  (select (r -> 'created' ->> 'aliases')::int from res where name = 'run'),
  2, 'the batch says how many it taught'
);
insert into res select 'by alias', public.import_batch((select p from pay where name = 'alias'), true);
select is(
  (select r -> 'will_create' -> 'merchants' from res where name = 'by alias'),
  '[]'::jsonb, 'a merchant named by its alias is not new'
);

-- A second run skips what is already in.
insert into res select 'again', public.import_batch((select p from pay where name = 'good'));
select is(
  (select (r -> 'counts' ->> 'skipped')::int from res where name = 'again'),
  9, 'a second run skips the nine'
);
select is((select count(*)::int from public.transactions), 9, 'and adds none');

-- Bruno sees nothing of Alice's, and cannot undo it.
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is((select count(*)::int from public.import_batches), 0, 'another user sees no batch');
select throws_ok(
  $$ select public.import_undo((select (r ->> 'batch_id')::uuid from res where name = 'run')) $$,
  'P0002', null, 'and cannot undo it'
);
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- Undo.
select is(
  (select (public.import_undo((select (r ->> 'batch_id')::uuid from res where name = 'run')) ->> 'ok')::boolean),
  true, 'an import is undone'
);
select is((select count(*)::int from public.transactions), 0, 'its transactions are gone');
select is(
  (select count(*)::int from public.categories where name in ('Sorties', 'Restaurants', 'Bars')) +
  (select count(*)::int from public.accounts where name = 'Historique') +
  (select count(*)::int from public.merchants) +
  (select count(*)::int from public.events),
  0, 'and what it created with them'
);
select is(
  (select count(*)::int from public.people) + (select count(*)::int from public.categories where name = 'Animaux'),
  3, 'but not what was there before'
);
select is(
  (select opening_balance from public.accounts where id = 'a2000000-0000-0000-0000-000000000001'),
  0.0000, 'the opening balance it replaced comes back'
);
select is(
  (select count(*)::int from public.merchant_aliases) + (select count(*)::int from public.person_aliases),
  0, 'and the spellings it taught'
);
select throws_ok(
  $$ select public.import_undo((select (r ->> 'batch_id')::uuid from res where name = 'run')) $$,
  'P0002', null, 'an import is undone once'
);

select * from finish();
rollback;
