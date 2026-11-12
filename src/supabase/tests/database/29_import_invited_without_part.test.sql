begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test');
insert into public.accounts (id, user_id, name, type, currency, opening_balance, opened_on) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0, '2026-01-01');
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Restaurants', 'expense', '#aa3322');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam');

create temp table res (name text primary key, r jsonb);
grant all on res to public;

-- Alice with MFA passed
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

-- ADR-052: an expense with an invited person only (the bulk path), and one with an invited
-- person and someone with me (through save_transaction)
insert into res select 'run', public.import_batch($j${
  "files": ["transactions.csv", "splits.csv", "people.csv"],
  "transactions": [
    {"ref": "i1", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-40.00", "currency": "CAD"},
    {"ref": "i2", "date": "2026-02-04", "account": "Chèque", "kind": "expense", "amount": "-60.00", "currency": "CAD"}
  ],
  "splits": [
    {"ref": "i1", "category": "Restaurants", "amount": "-40.00"},
    {"ref": "i2", "category": "Restaurants", "amount": "-60.00"}
  ],
  "people": [
    {"ref": "i1", "role": "invited", "person": "Alex"},
    {"ref": "i2", "role": "invited", "person": "Alex"},
    {"ref": "i2", "role": "with", "person": "Sam"}
  ]
}$j$::jsonb);

select is((select (r ->> 'ok')::boolean from res where name = 'run'), true, 'the file is imported');
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p join public.transactions t on t.id = p.transaction_id
     where t.import_ref = 'i1' order by p.position $$,
  $$ values ('me'::text, -40::numeric), ('invited', 0) $$,
  'an invited person alone has no part: Moi has the whole amount'
);
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p join public.transactions t on t.id = p.transaction_id
     where t.import_ref = 'i2' order by p.position $$,
  $$ values ('me'::text, -60::numeric), ('invited', 0), ('with', 0) $$,
  'and so it does beside someone with me'
);
select is(
  (select count(*)::int from public.transaction_people p join public.transactions t on t.id = p.transaction_id
   where t.import_ref in ('i1', 'i2') and p.role = 'me'),
  2, 'each expense has one Moi'
);

select * from finish();
rollback;
