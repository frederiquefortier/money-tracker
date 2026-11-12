begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

-- Alice already has a TFSA at Banque Nord, with no name.
insert into public.institutions (id, user_id, name) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Banque Nord');
insert into public.holdings (id, user_id, type, institution_id, country, currency, opened_on) values
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CA_TFSA',
   'a1000000-0000-0000-0000-000000000001', 'CA', 'CAD', '2023-01-01');

create temp table pay (name text primary key, p jsonb);
grant all on pay to public;

-- The old TFSA closes the day its money moves to the one at Banque Nord, which the app already has.
insert into pay values ('good', $j$
{
  "files": ["holdings.csv", "snapshots.csv", "contributions.csv", "holding_transfers.csv"],
  "holdings": [
    {"holding": "old", "type": "CA_TFSA", "institution": "Banque Test", "currency": "CAD", "opened_on": "2018-08-13", "closed_on": "2023-01-01"},
    {"holding": "nord", "type": "CA_TFSA", "institution": "banque nord", "currency": "CAD", "opened_on": "2023-01-01"},
    {"holding": "rrsp", "type": "CA_RRSP", "institution": "Banque Nord", "currency": "CAD", "opened_on": "2023-01-01"}
  ],
  "snapshots": [
    {"holding": "old", "date": "2022-12-31", "amount": "100.00"},
    {"holding": "old", "date": "2023-01-01", "amount": "0.00"},
    {"holding": "nord", "date": "2023-01-01", "amount": "100.00"},
    {"holding": "rrsp", "date": "2023-02-01", "amount": "50.00"}
  ],
  "contributions": [
    {"holding": "rrsp", "date": "2023-01-31", "amount": "10.00", "label": "Employer"}
  ],
  "holding_transfers": [
    {"from_holding": "old", "to_holding": "nord", "date": "2023-01-01", "amount": "100.00"}
  ]
}
$j$::jsonb);

insert into pay values ('bad', $j$
{
  "holdings": [
    {"holding": "a", "type": "CA_TFSA", "institution": "Banque Test", "currency": "CAD", "opened_on": "2023-01-01", "closed_on": "2023-06-01"},
    {"holding": "b", "type": "NOPE", "currency": "CAD", "opened_on": "2023-01-01"},
    {"holding": "loan", "type": "ANY_LOAN", "currency": "CAD", "country": "CA", "opened_on": "2023-01-01"},
    {"holding": "a", "type": "CA_RRSP", "currency": "CAD", "opened_on": "2023-01-01"}
  ],
  "snapshots": [
    {"holding": "zzz", "date": "2023-01-01", "amount": "1.00"},
    {"holding": "a", "date": "2023-02-01", "amount": "-1.00"},
    {"holding": "a", "date": "2023-02-01", "amount": "1.00"},
    {"holding": "a", "date": "2023-07-01", "amount": "1.005"}
  ],
  "contributions": [{"holding": "a", "date": "2023-02-01", "amount": "0"}],
  "holding_transfers": [
    {"from_holding": "a", "to_holding": "loan", "date": "2023-02-01", "amount": "5.00"},
    {"from_holding": "a", "to_holding": "a", "date": "2023-02-01", "amount": "5.00"}
  ]
}
$j$::jsonb);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

create temp table res (name text primary key, r jsonb);
grant all on res to public;

insert into res select 'bad', public.import_batch((select p from pay where name = 'bad'));
select is((select (r ->> 'ok')::boolean from res where name = 'bad'), false, 'holdings with faults are refused');
select is(
  (select array_agg(distinct e ->> 'code' order by e ->> 'code')
   from res, jsonb_array_elements(r -> 'errors') e where name = 'bad'),
  array['after_holding_closed', 'amount_negative', 'amount_not_positive', 'amount_precision',
        'holding_country_required', 'holding_duplicate', 'holding_transfer_kind', 'holding_type_unknown', 'holding_unknown',
        'snapshot_duplicate', 'transfer_same_holding'],
  'every fault is named'
);
select is((select count(*)::int from public.holdings), 1, 'a refused file writes nothing');

insert into res select 'dry', public.import_batch((select p from pay where name = 'good'), true);
select is((select (r ->> 'ok')::boolean from res where name = 'dry'), true, 'a right file passes its check');
select is(
  (select (r -> 'counts' ->> 'holdings') || '/' || (r -> 'counts' ->> 'holdings_matched') || '/'
     || (r -> 'counts' ->> 'snapshots') from res where name = 'dry'),
  '2/1/4', 'the summary counts the new holdings, the matched one and the values'
);
select is(
  (select r -> 'will_create' -> 'institutions' from res where name = 'dry'),
  '["Banque Test"]'::jsonb, 'and the institution it would create'
);
select is((select count(*)::int from public.holding_snapshots), 0, 'a check writes nothing');

insert into res select 'run', public.import_batch((select p from pay where name = 'good'));
select is((select (r ->> 'ok')::boolean from res where name = 'run'), true, 'the file is imported');
select is(
  (select count(*)::int from public.holdings), 3,
  'two holdings are created and the one in the app is matched, not duplicated'
);
select is(
  (select count(*)::int from public.holding_snapshots where holding_id = 'b1000000-0000-0000-0000-000000000001'),
  1, 'the matched holding takes its value'
);
select is(
  (select placed from public.holding_totals where holding_id = 'b1000000-0000-0000-0000-000000000001'),
  100.0000, 'the transfer counts as placed on the receiving holding'
);
select is(
  (select withdrawn from public.holding_totals t join public.holdings h on h.id = t.holding_id
   where h.name is null and h.type = 'CA_TFSA' and h.closed_on is not null),
  100.0000, 'and as withdrawn on the closed one'
);

-- A second run finds everything in.
insert into res select 'again', public.import_batch((select p from pay where name = 'good'));
select is((select (r ->> 'nothing_to_import')::boolean from res where name = 'again'), true, 'a second run has nothing to import');

select is(
  (select (public.import_undo((select (r ->> 'batch_id')::uuid from res where name = 'run')) ->> 'ok')::boolean),
  true, 'the import is undone'
);
select is(
  (select count(*)::int from public.holdings) + (select count(*)::int from public.holding_snapshots)
  + (select count(*)::int from public.holding_contributions) + (select count(*)::int from public.holding_transfers),
  1, 'what it wrote goes, and the holding that was there stays'
);
select is((select count(*)::int from public.institutions), 1, 'with the institution it created gone');

-- Bruno sees none of it.
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "aal": "aal2"}', true);
select is(
  (select count(*)::int from public.holdings), 0, 'another user sees nothing'
);

select * from finish();
rollback;
