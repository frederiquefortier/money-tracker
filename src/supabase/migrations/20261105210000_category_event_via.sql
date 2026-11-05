-- CAT-03: an event a category got through another one (a parent archiving its branch, a
-- sub-category bringing back its parents) names that category, so the history can say
-- so. Null for an event of its own. Deleting that category leaves the event, unnamed.
alter table public.category_status_events
  add column via_category_id uuid,
  add foreign key (user_id, via_category_id)
    references public.categories (user_id, id) on delete set null (via_category_id);

create index category_status_events_via_idx
  on public.category_status_events (user_id, via_category_id);

grant insert (via_category_id) on public.category_status_events to authenticated;

create or replace function public.archive_category(category uuid, archive_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  archived integer;
begin
  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'archived', archive_from);

  with recursive branch (id) as (
    select c.id from public.categories c where c.parent_id = category
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  )
  insert into public.category_status_events (category_id, status, effective_on, via_category_id)
  select b.id, 'archived', archive_from, category from branch b
  where public.category_status(b.id) = 'active';

  get diagnostics archived = row_count;
  return archived;
end;
$$;

create or replace function public.add_category_pause(category uuid, archive_from date, active_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent uuid;
  paused integer;
begin
  if archive_from >= active_from then
    raise exception 'category_pause_order' using errcode = '23514';
  end if;
  if active_from > current_date then
    raise exception 'category_pause_future' using errcode = '23514';
  end if;
  select c.parent_id into parent from public.categories c where c.id = category;
  if not found then
    raise exception 'category_not_found' using errcode = 'P0002';
  end if;
  if not public.category_active_through(category, archive_from, active_from) then
    raise exception 'category_pause_overlaps' using errcode = '23514';
  end if;
  if parent is not null
     and not public.category_active_through(parent, active_from, active_from) then
    raise exception 'category_parent_archived' using errcode = '23514';
  end if;

  perform set_config('money.category_pause', 'on', true);

  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'archived', archive_from), (category, 'active', active_from);

  with recursive branch (id) as (
    select c.id from public.categories c where c.parent_id = category
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  ),
  fits as (
    select b.id from branch b
    where public.category_active_through(b.id, archive_from, active_from)
  ),
  added as (
    insert into public.category_status_events (category_id, status, effective_on, via_category_id)
    select f.id, s.status, s.effective_on, category
    from fits f
    cross join (values ('archived', archive_from), ('active', active_from)) s (status, effective_on)
    returning category_id
  )
  select count(distinct a.category_id) into paused from added a;

  perform set_config('money.category_pause', '', true);
  return paused;
end;
$$;

create or replace function public.reactivate_category(category uuid, active_from date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ancestor uuid;
  reactivated integer := 0;
begin
  -- Top-down, so the trigger finds each parent active before its child.
  for ancestor in
    with recursive up (id, depth) as (
      select c.parent_id, 1 from public.categories c
      where c.id = category and c.parent_id is not null
      union all
      select c.parent_id, u.depth + 1 from public.categories c
      join up u on c.id = u.id
      where c.parent_id is not null
    )
    select u.id from up u
    where public.category_status(u.id) = 'archived'
    order by u.depth desc
  loop
    insert into public.category_status_events (category_id, status, effective_on, via_category_id)
    values (ancestor, 'active', active_from, category);
    reactivated := reactivated + 1;
  end loop;

  insert into public.category_status_events (category_id, status, effective_on)
  values (category, 'active', active_from);
  return reactivated;
end;
$$;
