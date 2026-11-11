begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('a2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chèque', 'checking', 'CAD', 0);
insert into public.categories (id, user_id, name, kind, color) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Restaurants', 'expense', '#aa3322'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cadeaux reçus', 'income', '#338855');
insert into public.people (id, user_id, name) values
  ('a4000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alex'),
  ('a4000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Maman'),
  ('b4000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ines');
insert into public.merchants (id, user_id, name) values
  ('a6000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Amazon');

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

-- PPL-08: Alex came to dinner and I paid nothing for him; Maman was there too
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-03', 60,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 60}]',
       people => '[{"role": "me", "input_mode": "share", "input_value": 1},
                   {"role": "invited", "person_id": "a4000000-0000-0000-0000-000000000002", "input_mode": "share", "input_value": 1},
                   {"role": "with", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 0}]');
     select pg_temp.check_now() $$,
  'a person can be with me on an expense shared with someone else'
);
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p order by p.position $$,
  $$ values ('me'::text, -30::numeric), ('invited', -30), ('with', 0) $$,
  'the parts ignore them: the cost is split between the others only'
);

-- With alone: Moi is implied and keeps it all
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-04', 25,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 25}]',
       people => '[{"role": "with", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 0}]');
     select pg_temp.check_now() $$,
  'someone with me, and nobody else, saves'
);
select results_eq(
  $$ select p.role, p.amount from public.transaction_people p
     join public.transactions t on t.id = p.transaction_id
     where t.occurred_on = '2026-11-04' order by p.position $$,
  $$ values ('me'::text, -25::numeric), ('with', 0) $$,
  'and Moi has the whole amount'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-05', 10,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 10}]',
       people => '[{"role": "with", "person_id": "a4000000-0000-0000-0000-000000000001", "input_mode": "share", "input_value": 0}]');
     select pg_temp.check_now() $$,
  '23514', 'people_role_invalid', 'an income has no one with me'
);

-- Seller: bought from Maman, through Amazon
select lives_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-06', 15,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 15}]',
       merchant_id => 'a6000000-0000-0000-0000-000000000001',
       seller_id => 'a4000000-0000-0000-0000-000000000002') $$,
  'an expense saves with a seller'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'income', '2026-11-07', 15,
       '[{"category_id": "a0000000-0000-0000-0000-000000000002", "input_mode": "amount", "input_value": 15}]',
       seller_id => 'a4000000-0000-0000-0000-000000000002') $$,
  '23514', 'seller_kind_invalid', 'an income has no seller'
);
select throws_ok(
  $$ select public.save_transaction(null, 'a2000000-0000-0000-0000-000000000001', 'expense', '2026-11-08', 15,
       '[{"category_id": "a0000000-0000-0000-0000-000000000001", "input_mode": "amount", "input_value": 15}]',
       seller_id => 'b4000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'another user''s person cannot be a seller'
);
select results_eq(
  $$ select l.merchant from public.list_transactions(person_ids => array['a4000000-0000-0000-0000-000000000002'::uuid])
     l where l.occurred_on = '2026-11-06' $$,
  $$ values ('Amazon · Maman') $$,
  'the Proches filter finds what was bought from them, named with the shop'
);
select is(
  (select count(*)::int from public.list_transactions(person_ids => array['a4000000-0000-0000-0000-000000000001'::uuid])),
  2, 'and what they were with me on'
);

-- Deleting the person keeps the transaction, without a seller
delete from public.people where id = 'a4000000-0000-0000-0000-000000000002';
select is(
  (select count(*)::int from public.transactions where occurred_on = '2026-11-06' and seller_person_id is null),
  1, 'a deleted person leaves the transaction without a seller'
);

select * from finish();
rollback;
