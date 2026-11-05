begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@example.test');

insert into public.categories (id, user_id, name, color, necessity) values
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Loisirs Bruno', '#336699', 'want');

-- Alice's tree: Santé a need, Massothérapie a want under it, Pharmacie following it.
insert into public.categories (id, user_id, name, color, necessity) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Santé', '#aa3322', 'need');
insert into public.categories (id, user_id, parent_id, name, color, necessity) values
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Massothérapie', '#bb4433', 'want'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Pharmacie', '#cc5544', null);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}', true);

select throws_ok(
  $$ insert into public.categories (name, color, necessity) values ('Nouveau', '#000000', 'luxury') $$,
  '23514', null, 'a mark is need or want'
);
select throws_ok(
  $$ insert into public.categories (name, kind, color, necessity) values ('Salaire', 'income', '#000000', 'need') $$,
  '23514', null, 'an income category takes no mark'
);
select lives_ok(
  $$ update public.categories set necessity = 'want'
     where id = 'a0000000-0000-0000-0000-000000000003' $$,
  'a sub-category sets its own mark'
);
update public.categories set kind = 'investment' where id = 'a0000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.categories where necessity is not null),
  0, 'moving a branch out of expense clears its marks'
);

-- Isolation
select is(
  (select count(*)::int from public.categories where user_id <> auth.uid()),
  0, 'a user sees none of another user''s categories'
);
update public.categories set necessity = 'need' where id = 'b0000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select necessity from public.categories where id = 'b0000000-0000-0000-0000-000000000001'),
  'want', 'a user cannot change another user''s mark'
);
select is(
  (select kind from public.categories where id = 'a0000000-0000-0000-0000-000000000002'),
  'investment', 'the branch moved with its parent'
);

select * from finish();
rollback;
