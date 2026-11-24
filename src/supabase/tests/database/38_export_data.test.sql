begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'carla@example.test');

insert into public.accounts (id, user_id, name, type, currency) values
  ('b2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Chèque Bruno', 'checking', 'CAD');

-- The export's rows, sorted so two exports compare whatever the order of equal dates. A
-- transfer group is an id the import makes, so it is left out of the comparison.
create function pg_temp.sorted(x jsonb) returns jsonb language sql as $$
  select jsonb_object_agg(e.k, (select jsonb_agg(r - 'transfer_group' order by r::text)
                                from jsonb_array_elements(e.v) r))
  from jsonb_each(x) as e (k, v);
$$;

-- Alice: an invented history with a reimbursement, a guest, a seller who is a person, a
-- receipt in another currency, a transfer, an alias and a holding.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select is(
  (public.import_batch($j$
{
  "files": ["accounts.csv", "transactions.csv", "splits.csv", "people.csv", "aliases.csv", "holdings.csv", "snapshots.csv", "contributions.csv"],
  "accounts": [
    {"name": "Chèque", "type": "checking", "currency": "CAD", "institution": "Banque Test", "opening_balance": "100.50", "opened_on": "2024-01-01"},
    {"name": "Épargne", "type": "savings", "currency": "CAD", "institution": "Banque Test", "opening_balance": "0", "opened_on": "2024-01-01"}
  ],
  "transactions": [
    {"ref": "e1", "date": "2026-03-02", "account": "Chèque", "kind": "expense", "amount": "-40.00", "currency": "CAD", "merchant": "Épicerie Test", "event": "Voyage Test", "note": "Souper, \"maison\""},
    {"ref": "i1", "date": "2026-03-05", "account": "Chèque", "kind": "income", "amount": "20.00", "currency": "CAD"},
    {"ref": "e2", "date": "2026-03-06", "account": "Chèque", "kind": "expense", "amount": "-12.50", "currency": "CAD", "original_amount": "-9.00", "original_currency": "EUR", "merchant": "Julie", "status": "pending"},
    {"ref": "t1", "date": "2026-03-07", "account": "Chèque", "kind": "transfer", "amount": "-100.00", "currency": "CAD", "transfer_group": "g1"},
    {"ref": "t2", "date": "2026-03-07", "account": "Épargne", "kind": "transfer", "amount": "100.00", "currency": "CAD", "transfer_group": "g1"}
  ],
  "splits": [
    {"ref": "e1", "category": "Alimentation > Épicerie", "amount": "-40.00"},
    {"ref": "i1", "category": "Alimentation > Épicerie", "amount": "20.00"},
    {"ref": "e2", "category": "Loisirs", "amount": "-10.00"},
    {"ref": "e2", "category": "Alimentation > Épicerie", "amount": "-2.50"}
  ],
  "people": [
    {"ref": "e1", "role": "owes", "person": "Sam"},
    {"ref": "e1", "role": "with", "person": "Julie"},
    {"ref": "e1", "role": "invited", "head_count": "2"},
    {"ref": "i1", "role": "from", "person": "Sam", "reimburses": "e1"}
  ],
  "aliases": [{"kind": "merchant", "name": "Épicerie Test", "alias": "EPICERIE TST"}],
  "counterparties": [],
  "holdings": [{"holding": "celi", "type": "CA_TFSA", "institution": "Courtier Test", "currency": "CAD", "opened_on": "2024-01-01"}],
  "snapshots": [{"holding": "celi", "date": "2026-03-31", "amount": "1500.25"}],
  "contributions": [{"holding": "celi", "date": "2026-03-15", "amount": "50", "label": "Employeur"}],
  "holding_transfers": []
}
$j$::jsonb) ->> 'ok')::boolean,
  true, 'the invented history imports'
);

create temporary table alice_export as select public.export_data() as x;

select is(
  (select jsonb_array_length(x -> 'accounts') from alice_export),
  2, 'another user''s accounts are not exported'
);
select is(
  (select jsonb_array_length(x -> 'transactions') || ' ' || jsonb_array_length(x -> 'splits') || ' ' ||
          jsonb_array_length(x -> 'people') from alice_export),
  '5 4 4', 'every transaction, split and person line, without the implied Moi'
);
select is(
  (select r ->> 'reimburses' from alice_export, jsonb_array_elements(x -> 'people') r
   where r ->> 'role' = 'from'),
  'e1', 'an income names the expense it repays by its ref'
);
select is(
  (select row(r ->> 'merchant', r ->> 'amount', r ->> 'original_amount', r ->> 'status')::text
   from alice_export, jsonb_array_elements(x -> 'transactions') r where r ->> 'ref' = 'e2'),
  row('Julie', '-12.5', '-9', 'pending')::text,
  'a seller is written as the merchant, amounts without trailing zeros'
);
select is(
  (select r ->> 'holding' from alice_export, jsonb_array_elements(x -> 'snapshots') r),
  'CA_TFSA Courtier Test', 'a holding is keyed by its type and institution'
);

select is(
  (select public.export_counts() ->> 'transactions') || ' ' || (public.export_counts() ->> 'holding_transfers'),
  '5 0', 'the counts are the rows of each file'
);

-- Bruno sees nothing of Alice's.
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select jsonb_array_length(public.export_data() -> 'transactions')),
  0, 'another user exports none of Alice''s transactions'
);

-- Carla imports Alice's export into an empty account and exports the same data.
select set_config('request.jwt.claims',
  '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select (public.import_batch(x || '{"files": [], "counterparties": []}'::jsonb) ->> 'ok')::boolean
   from alice_export),
  true, 'the export imports into an empty account'
);
select is(
  pg_temp.sorted(public.export_data()),
  (select pg_temp.sorted(x) from alice_export),
  'export then import reproduces the data'
);

select * from finish();
rollback;
