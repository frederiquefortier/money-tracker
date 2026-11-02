-- Supabase grants the API roles everything on public tables, TRUNCATE included, which
-- skips RLS (security.md, rule 8).
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public
  revoke truncate, references, trigger on tables from authenticated;

-- Inserts come from the sign-up trigger, deletes cascade from auth.users.
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (locale) on public.profiles to authenticated;
