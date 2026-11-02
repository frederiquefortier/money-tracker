-- French and English only (ADR-019). Contract step: the app has written only fr or en
-- since the expand migration, so the regional values go. The update catches any row
-- written by an older deploy in between.

update public.profiles set locale = split_part(locale, '-', 1) where locale like '%-%';

alter table public.profiles drop constraint profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check
  check (locale in ('fr', 'en'));
