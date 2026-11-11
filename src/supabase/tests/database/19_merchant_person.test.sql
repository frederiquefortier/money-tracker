begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Maman'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Julie'),
  ('a4000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Maman');

create temp table pay (name text primary key, p jsonb);
grant all on pay to public;
create temp table res (name text primary key, r jsonb);
grant all on res to public;

-- Maman is the merchant of two rows, Julie is it under another spelling, Sam Cha is a shop.
insert into pay values ('file', $j$
{
  "files": ["transactions.csv", "splits.csv", "aliases.csv"],
  "accounts": [
    {"name": "Chèque", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2026-01-01"}
  ],
  "transactions": [
    {"ref": "p1", "date": "2026-02-03", "account": "Chèque", "kind": "expense", "amount": "-24.00", "currency": "CAD", "merchant": "maman"},
    {"ref": "p2", "date": "2026-02-04", "account": "Chèque", "kind": "expense", "amount": "-10.00", "currency": "CAD", "merchant": "Maman"},
    {"ref": "p3", "date": "2026-02-05", "account": "Chèque", "kind": "expense", "amount": "-5.00", "currency": "CAD", "merchant": "Juju"},
    {"ref": "p4", "date": "2026-02-06", "account": "Chèque", "kind": "expense", "amount": "-7.00", "currency": "CAD", "merchant": "Sam Cha"},
    {"ref": "p5", "date": "2026-02-07", "account": "Chèque", "kind": "expense", "amount": "-3.00", "currency": "CAD", "merchant": "Claire"}
  ],
  "splits": [
    {"ref": "p1", "category": "Divers", "amount": "-24.00"},
    {"ref": "p2", "category": "Divers", "amount": "-10.00"},
    {"ref": "p3", "category": "Divers", "amount": "-5.00"},
    {"ref": "p4", "category": "Divers", "amount": "-7.00"},
    {"ref": "p5", "category": "Divers", "amount": "-3.00"}
  ],
  "counterparties": [{"name": "Claire"}, {"name": "Nobody"}],
  "people": [],
  "aliases": [{"kind": "person", "name": "Julie", "alias": "Juju"}]
}
$j$::jsonb);

-- Marked as a person while it is also an alias the file gives: the alias wins, no new person.
insert into pay values ('alias', $j$
{
  "files": ["transactions.csv", "splits.csv", "aliases.csv"],
  "accounts": [
    {"name": "Chèque 2", "type": "checking", "currency": "CAD", "opening_balance": "0.00", "opened_on": "2026-01-01"}
  ],
  "transactions": [
    {"ref": "q1", "date": "2026-03-03", "account": "Chèque 2", "kind": "expense", "amount": "-4.00", "currency": "CAD", "merchant": "Juju"},
    {"ref": "q2", "date": "2026-03-04", "account": "Chèque 2", "kind": "expense", "amount": "-6.00", "currency": "CAD", "merchant": "Sam"}
  ],
  "splits": [
    {"ref": "q1", "category": "Divers", "amount": "-4.00"},
    {"ref": "q2", "category": "Divers", "amount": "-6.00"}
  ],
  "people": [
    {"ref": "q2", "role": "invited", "person": "Sam"},
    {"ref": "q2", "role": "invited", "person": "Julie"}
  ],
  "counterparties": [{"name": "Juju"}],
  "aliases": [{"kind": "person", "name": "Julie", "alias": "Juju"}]
}
$j$::jsonb);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

insert into res select 'dry', public.import_batch((select p from pay where name = 'file'), true);
select is(
  (select r -> 'will_create' -> 'counterparties' from res where name = 'dry'),
  '["Claire", "Julie", "Maman"]'::jsonb, 'a merchant text that is a person is listed as theirs, also when the author said so'
);
select is(
  (select r -> 'will_create' -> 'merchants' from res where name = 'dry'),
  '["Sam Cha"]'::jsonb, 'and is no new merchant; a shop with a name that is no one''s still is'
);

insert into res select 'run', public.import_batch((select p from pay where name = 'file'));
select is((select (r ->> 'ok')::boolean from res where name = 'run'), true, 'the file imports');
select is(
  (select array_agg(m.name order by m.name) from public.merchants m where m.person_id is not null),
  array['Claire', 'Julie', 'Maman'], 'each person gets a merchant, named for them'
);
select is(
  (select count(distinct t.merchant_id)::int from public.transactions t
   join public.merchants m on m.id = t.merchant_id where m.name = 'Maman'),
  1, 'whatever the case, one merchant'
);
select is(
  (select m.name from public.transactions t join public.merchants m on m.id = t.merchant_id where t.import_ref = 'p3'),
  'Julie', 'a person''s alias finds their merchant'
);
select is(
  (select m.person_id from public.merchants m where m.name = 'Sam Cha'), null, 'a shop is linked to no one'
);

-- One merchant per person, and deleting the person keeps the merchant.
select is(
  (select count(*)::int from public.people where name in ('Claire', 'Nobody')), 1,
  'a person the author named is created, only when a row uses the text'
);
select is(
  (select p.name from public.merchants m join public.people p on p.id = m.person_id where m.name = 'Claire'),
  'Claire', 'and has their merchant'
);
select throws_ok(
  $$ insert into public.merchants (name, person_id) values ('Maman bis', 'a4000000-0000-0000-0000-000000000001') $$,
  '23505', null, 'a person has one merchant'
);
delete from public.people where id = 'a4000000-0000-0000-0000-000000000001';
select is(
  (select m.person_id from public.merchants m where m.name = 'Maman'), null,
  'a deleted person leaves the merchant, unlinked'
);

-- A text that is a person with many people lines is still one merchant, and counts once.
insert into res select 'alias', public.import_batch((select p from pay where name = 'alias'));
select is((select (r ->> 'ok')::boolean from res where name = 'alias'), true, 'a counterparty that is a file alias imports');
select is(
  (select count(*)::int from public.transactions where import_ref in ('q1', 'q2')), 2,
  'and no row is doubled by a person who has several lines'
);

select * from finish();
rollback;
