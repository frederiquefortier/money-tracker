-- Merchants (MER-01, MER-05, spec 13). The country (MER-03) comes in phase 5, aliases
-- (MER-02) with the import wizard.

create extension if not exists unaccent with schema extensions;

-- unaccent is only stable, so an index needs this immutable wrapper with the dictionary
-- named explicitly.
create function public.fold_name(name text)
returns text
language sql
immutable
parallel safe
security invoker
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, name));
$$;

revoke execute on function public.fold_name(text) from public, anon;
grant execute on function public.fold_name(text) to authenticated;

-- The default category is cleared when that category is deleted; set null touches only
-- that column, since user_id is part of the key (ADR-005).
create table public.merchants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users on delete cascade,
  name                text not null check (length(trim(name)) between 1 and 100),
  default_category_id uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, default_category_id) references public.categories (user_id, id)
    on delete set null (default_category_id)
);

-- "Café Olimpico" and "cafe olimpico" are the same merchant.
create unique index merchants_user_name_key on public.merchants (user_id, public.fold_name(name));
create index merchants_user_default_category_idx on public.merchants (user_id, default_category_id);

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

alter table public.merchants enable row level security;
revoke all on public.merchants from anon, authenticated;
grant select, delete on public.merchants to authenticated;
grant insert (name, default_category_id), update (name, default_category_id)
  on public.merchants to authenticated;

create policy "merchants: read own"
  on public.merchants for select to authenticated
  using (user_id = (select auth.uid()));

create policy "merchants: insert own"
  on public.merchants for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "merchants: update own"
  on public.merchants for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "merchants: delete own"
  on public.merchants for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "merchants: mfa required"
  on public.merchants as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- MER-05: the target keeps its name and default category, the source is deleted. The
-- transactions migration adds moving the source's transactions first (ADR-012).
create function public.merge_merchants(source uuid, target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if source = target then
    raise exception 'merchant_merge_into_itself' using errcode = '23514';
  end if;
  if not exists (select 1 from public.merchants m where m.id = target) then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;

  delete from public.merchants m where m.id = source;
  if not found then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.merge_merchants(uuid, uuid) from public, anon;
grant execute on function public.merge_merchants(uuid, uuid) to authenticated;
