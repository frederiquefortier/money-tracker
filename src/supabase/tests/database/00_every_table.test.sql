-- Guards that apply to every table in public, so a new table cannot skip them.
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'RLS is enabled on every public table'
);

select is_empty(
  $$
    select t.tablename
    from pg_tables t
    where t.schemaname = 'public'
      and not exists (
        select 1 from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = t.tablename
          and p.permissive = 'RESTRICTIVE'
          and p.qual like '%aal2%'
      )
  $$,
  'every public table has a restrictive aal2 (MFA) policy'
);

select is_empty(
  $$
    select table_name from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
  $$,
  'anon has no privileges on any public table'
);

select * from finish();
rollback;
