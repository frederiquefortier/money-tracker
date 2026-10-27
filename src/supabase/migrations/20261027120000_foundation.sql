-- Foundation: the security pattern every user table follows, applied to profiles.
-- See docs/01_building/security.md and database.md.

-- Shared trigger for updated_at.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  user_id    uuid primary key references auth.users on delete cascade,
  locale     text not null default 'fr-CA'
             check (locale in ('fr-CA', 'fr-CH', 'fr-FR', 'en-CA', 'en-US', 'en-GB')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS in the same migration as the table (security.md, rule 1).
alter table public.profiles enable row level security;

-- Nothing in the app runs as anon; the browser never queries data (ADR-006).
revoke all on public.profiles from anon;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Inserts come from the sign-up trigger only; deletes cascade from auth.users.

-- A session that has not passed the second factor sees and changes nothing (rule 3).
create policy "profiles: mfa required"
  on public.profiles as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Profile row on sign-up. The locale comes from the invitation metadata when valid.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (user_id, locale)
  values (
    new.id,
    case
      when requested in ('fr-CA', 'fr-CH', 'fr-FR', 'en-CA', 'en-US', 'en-GB') then requested
      else 'fr-CA'
    end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
