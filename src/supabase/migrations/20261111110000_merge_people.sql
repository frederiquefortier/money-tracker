-- Merge two people (PPL-07), the way merchants merge (MER-05): what points at the source
-- points at the target, and the source's name and aliases become aliases of the target
-- (PPL-06), so the next import of that spelling lands on the target.

-- A person's line moves to another person.
grant update (person_id) on public.transaction_people to authenticated;

create function public.merge_people(source uuid, target uuid)
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
    raise exception 'person_merge_into_itself' using errcode = '23514';
  end if;
  if not exists (select 1 from public.people p where p.id = target) then
    raise exception 'person_not_found' using errcode = 'P0002';
  end if;
  select p.name into source_name from public.people p where p.id = source;
  if not found then
    raise exception 'person_not_found' using errcode = 'P0002';
  end if;

  -- Both on one transaction would be two lines for one person, each with its own part.
  if exists (
    select 1
    from public.transaction_people a
    join public.transaction_people b on b.transaction_id = a.transaction_id
    where a.person_id = source and b.person_id = target
  ) then
    raise exception 'people_merge_shared_transaction' using errcode = '23514';
  end if;

  select coalesce(array_agg(a.alias), '{}') into spellings
  from public.person_aliases a where a.person_id = source;

  -- The reimbursements follow the lines, which they name by id.
  update public.transaction_people l set person_id = target where l.person_id = source;

  insert into public.person_group_members (group_id, person_id)
  select m.group_id, target from public.person_group_members m
  where m.person_id = source
  on conflict do nothing;
  insert into public.event_people (event_id, person_id)
  select e.event_id, target from public.event_people e
  where e.person_id = source
  on conflict do nothing;

  -- A person has at most one merchant of their own: the target's wins.
  if not exists (select 1 from public.merchants m where m.person_id = target) then
    update public.merchants m set person_id = target where m.person_id = source;
  end if;

  -- Its memberships, aliases and any merchant link go with it; the spellings are free
  -- again to give to the target.
  delete from public.people p where p.id = source;
  insert into public.person_aliases (person_id, alias)
  select target, x from unnest(array_append(spellings, source_name)) as x;
end;
$$;

revoke execute on function public.merge_people(uuid, uuid) from public, anon;
grant execute on function public.merge_people(uuid, uuid) to authenticated;
