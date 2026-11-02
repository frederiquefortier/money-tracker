-- Every public table, so a new one cannot skip these.
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

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
          and p.cmd = 'ALL'
          and p.qual like '%aal2%'
          and p.with_check like '%aal2%'
      )
  $$,
  'every public table has a restrictive aal2 (MFA) policy on every command'
);

select is_empty(
  $$
    select table_name from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
  $$,
  'anon has no privileges on any public table'
);

select is_empty(
  $$
    select table_name || ': ' || privilege_type from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated'
      and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
  $$,
  'authenticated cannot truncate, reference or add triggers to any public table'
);

select * from finish();
rollback;
