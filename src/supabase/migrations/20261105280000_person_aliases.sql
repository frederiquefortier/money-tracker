-- Person aliases (PPL-06, spec 19): other spellings of a person's name, so the import
-- finds them by name or alias. A name or an alias points to one person only, so a match
-- is never ambiguous: an alias cannot repeat any person's name or another alias, and a
-- name cannot repeat an alias.

create table public.person_aliases (
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  person_id uuid not null,
  alias     text not null check (length(trim(alias)) between 1 and 100),
  primary key (person_id, alias),
  foreign key (user_id, person_id) references public.people (user_id, id) on delete cascade
);

create unique index person_aliases_user_alias_key
  on public.person_aliases (user_id, public.fold_name(alias));
create index person_aliases_user_person_idx on public.person_aliases (user_id, person_id);

alter table public.person_aliases enable row level security;
revoke all on public.person_aliases from anon, authenticated;
grant select, delete on public.person_aliases to authenticated;
grant insert (person_id, alias) on public.person_aliases to authenticated;

create policy "person_aliases: read own"
  on public.person_aliases for select to authenticated
  using (user_id = (select auth.uid()));
create policy "person_aliases: insert own"
  on public.person_aliases for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "person_aliases: delete own"
  on public.person_aliases for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "person_aliases: mfa required"
  on public.person_aliases as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Raised before the unique index, so the screen can tell an alias apart from a name.
create function public.check_person_alias()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.people p
    where p.user_id = new.user_id and public.fold_name(p.name) = public.fold_name(new.alias)
  ) or exists (
    select 1 from public.person_aliases a
    where a.user_id = new.user_id and public.fold_name(a.alias) = public.fold_name(new.alias)
  ) then
    raise exception 'alias_taken' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger person_aliases_check
  before insert on public.person_aliases
  for each row execute function public.check_person_alias();

create function public.check_person_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.person_aliases a
    where a.user_id = new.user_id and public.fold_name(a.alias) = public.fold_name(new.name)
  ) then
    raise exception 'name_is_alias' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger people_name_check
  before insert or update of name on public.people
  for each row execute function public.check_person_name();

-- The aliases are written with the person and their groups (ADR-012): the list given
-- replaces the stored one.
drop function public.save_person(uuid, text, uuid[]);

create function public.save_person(
  person_id uuid,
  name text,
  group_ids uuid[],
  aliases text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_person.person_id;
begin
  if saved is null then
    insert into public.people (name) values (trim(save_person.name)) returning id into saved;
  else
    -- Gone first, so a name can take back one of its own aliases.
    delete from public.person_aliases a where a.person_id = saved;
    update public.people p set name = trim(save_person.name) where p.id = saved;
    if not found then
      raise exception 'person_not_found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.person_aliases (person_id, alias)
  select saved, trim(a) from unnest(save_person.aliases) a where trim(a) <> '';

  delete from public.person_group_members m
  where m.person_id = saved and m.group_id <> all (save_person.group_ids);
  insert into public.person_group_members (group_id, person_id)
  select distinct g, saved from unnest(save_person.group_ids) g
  on conflict do nothing;

  return saved;
end;
$$;

revoke execute on function public.save_person(uuid, text, uuid[], text[]) from public, anon;
grant execute on function public.save_person(uuid, text, uuid[], text[]) to authenticated;
revoke execute on function public.check_person_alias() from public, anon, authenticated;
revoke execute on function public.check_person_name() from public, anon, authenticated;
