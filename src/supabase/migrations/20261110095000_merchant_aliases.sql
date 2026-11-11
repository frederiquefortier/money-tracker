-- Merchant aliases (MER-02, MER-05): other spellings of a merchant's name, so the import finds
-- a merchant by name or alias and a merge leaves a trace. As for people (PPL-06), a name or
-- an alias points to one merchant only, so a match is never ambiguous: an alias cannot
-- repeat any merchant's name or another alias, and a name cannot repeat an alias.

create table public.merchant_aliases (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  merchant_id uuid not null,
  alias       text not null check (length(trim(alias)) between 1 and 100),
  primary key (merchant_id, alias),
  foreign key (user_id, merchant_id) references public.merchants (user_id, id) on delete cascade
);

create unique index merchant_aliases_user_alias_key
  on public.merchant_aliases (user_id, public.fold_name(alias));
create index merchant_aliases_user_merchant_idx on public.merchant_aliases (user_id, merchant_id);

alter table public.merchant_aliases enable row level security;
revoke all on public.merchant_aliases from anon, authenticated;
grant select, delete on public.merchant_aliases to authenticated;
grant insert (merchant_id, alias) on public.merchant_aliases to authenticated;

create policy "merchant_aliases: read own"
  on public.merchant_aliases for select to authenticated
  using (user_id = (select auth.uid()));
create policy "merchant_aliases: insert own"
  on public.merchant_aliases for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "merchant_aliases: delete own"
  on public.merchant_aliases for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "merchant_aliases: mfa required"
  on public.merchant_aliases as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Raised before the unique index, so the screen can tell an alias apart from a name.
create function public.check_merchant_alias()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.merchants m
    where m.user_id = new.user_id and public.fold_name(m.name) = public.fold_name(new.alias)
  ) or exists (
    select 1 from public.merchant_aliases a
    where a.user_id = new.user_id and public.fold_name(a.alias) = public.fold_name(new.alias)
  ) then
    raise exception 'alias_taken' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_merchant_alias() from public, anon, authenticated;

create trigger merchant_aliases_check
  before insert on public.merchant_aliases
  for each row execute function public.check_merchant_alias();

create function public.check_merchant_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.merchant_aliases a
    where a.user_id = new.user_id and public.fold_name(a.alias) = public.fold_name(new.name)
  ) then
    raise exception 'name_is_alias' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_merchant_name() from public, anon, authenticated;

create trigger merchants_name_check
  before insert or update of name on public.merchants
  for each row execute function public.check_merchant_name();

-- A merge keeps a trace (MER-05): the source's aliases move to the target, and its name
-- becomes one, so the next import of that spelling lands on the target.
create or replace function public.merge_merchants(source uuid, target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_name text;
  spellings text[];
begin
  if source = target then
    raise exception 'merchant_merge_into_itself' using errcode = '23514';
  end if;
  if not exists (select 1 from public.merchants m where m.id = target) then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;
  select m.name into source_name from public.merchants m where m.id = source;
  if not found then
    raise exception 'merchant_not_found' using errcode = 'P0002';
  end if;
  select coalesce(array_agg(a.alias), '{}') into spellings
  from public.merchant_aliases a where a.merchant_id = source;

  update public.transactions t set merchant_id = target where t.merchant_id = source;
  -- Its aliases go with it; the spellings are free again to give to the target.
  delete from public.merchants m where m.id = source;
  insert into public.merchant_aliases (merchant_id, alias)
  select target, x from unnest(array_append(spellings, source_name)) as x;
end;
$$;
