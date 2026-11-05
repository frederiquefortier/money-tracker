-- People and groups (PPL-01, 02, spec 19). Linking them to transactions is spec 20. A
-- person's icon is the first letter of their name and a group's the avatars of its
-- members, so neither table stores one.

create table public.people (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 100),
  archived_on date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, id)
);

create table public.person_groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 100),
  archived_on date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, id)
);

-- Deleting a person or a group removes only its memberships (ADR-005: keys carry user_id).
create table public.person_group_members (
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  group_id  uuid not null,
  person_id uuid not null,
  primary key (group_id, person_id),
  foreign key (user_id, group_id) references public.person_groups (user_id, id) on delete cascade,
  foreign key (user_id, person_id) references public.people (user_id, id) on delete cascade
);

create unique index people_user_name_key on public.people (user_id, public.fold_name(name));
create unique index person_groups_user_name_key on public.person_groups (user_id, public.fold_name(name));
create index person_group_members_user_group_idx on public.person_group_members (user_id, group_id);
create index person_group_members_user_person_idx on public.person_group_members (user_id, person_id);

create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

create trigger person_groups_set_updated_at
  before update on public.person_groups
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;
alter table public.person_groups enable row level security;
alter table public.person_group_members enable row level security;

revoke all on public.people, public.person_groups, public.person_group_members
  from anon, authenticated;
grant select, delete on public.people, public.person_groups to authenticated;
grant insert (name), update (name, archived_on) on public.people, public.person_groups
  to authenticated;
grant select, delete on public.person_group_members to authenticated;
grant insert (group_id, person_id) on public.person_group_members to authenticated;

create policy "people: read own"
  on public.people for select to authenticated
  using (user_id = (select auth.uid()));
create policy "people: insert own"
  on public.people for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "people: update own"
  on public.people for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "people: delete own"
  on public.people for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "people: mfa required"
  on public.people as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "person_groups: read own"
  on public.person_groups for select to authenticated
  using (user_id = (select auth.uid()));
create policy "person_groups: insert own"
  on public.person_groups for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "person_groups: update own"
  on public.person_groups for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "person_groups: delete own"
  on public.person_groups for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "person_groups: mfa required"
  on public.person_groups as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "person_group_members: read own"
  on public.person_group_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy "person_group_members: insert own"
  on public.person_group_members for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "person_group_members: delete own"
  on public.person_group_members for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "person_group_members: mfa required"
  on public.person_group_members as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- A person and their groups are written together (ADR-012); memberships are edited from
-- both forms (spec 19).
create function public.save_person(person_id uuid, name text, group_ids uuid[])
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
    update public.people p set name = trim(save_person.name) where p.id = saved;
    if not found then
      raise exception 'person_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.person_group_members m
  where m.person_id = saved and m.group_id <> all (save_person.group_ids);
  insert into public.person_group_members (group_id, person_id)
  select distinct g, saved from unnest(save_person.group_ids) g
  on conflict do nothing;

  return saved;
end;
$$;

create function public.save_person_group(group_id uuid, name text, person_ids uuid[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_person_group.group_id;
begin
  if saved is null then
    insert into public.person_groups (name) values (trim(save_person_group.name)) returning id into saved;
  else
    update public.person_groups g set name = trim(save_person_group.name) where g.id = saved;
    if not found then
      raise exception 'group_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.person_group_members m
  where m.group_id = saved and m.person_id <> all (save_person_group.person_ids);
  insert into public.person_group_members (group_id, person_id)
  select distinct saved, p from unnest(save_person_group.person_ids) p
  on conflict do nothing;

  return saved;
end;
$$;

revoke execute on function public.save_person(uuid, text, uuid[]) from public, anon;
grant execute on function public.save_person(uuid, text, uuid[]) to authenticated;
revoke execute on function public.save_person_group(uuid, text, uuid[]) from public, anon;
grant execute on function public.save_person_group(uuid, text, uuid[]) to authenticated;
