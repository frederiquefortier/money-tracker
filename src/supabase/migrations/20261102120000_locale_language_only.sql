-- French and English only (ADR-019). Expand step: the constraint accepts the new values
-- and, until the contract migration, the old regional ones, so the app and this migration
-- can deploy in either order (ADR-017).

alter table public.profiles drop constraint profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check
  check (locale in ('fr', 'en', 'fr-CA', 'fr-CH', 'fr-FR', 'en-CA', 'en-US', 'en-GB'));

update public.profiles set locale = split_part(locale, '-', 1) where locale like '%-%';

alter table public.profiles alter column locale set default 'fr';

-- Same function, new normalisation: any fr-* or en-* tag in the invitation becomes its
-- language. Replacing keeps the revoked execute privileges.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := lower(split_part(coalesce(new.raw_user_meta_data ->> 'locale', ''), '-', 1));
begin
  insert into public.profiles (user_id, locale)
  values (new.id, case when requested in ('fr', 'en') then requested else 'fr' end);
  return new;
end;
$$;
