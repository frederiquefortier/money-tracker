-- The Sauf field is gone (spec 22): an event takes the categories it ticks, a ticked
-- parent covering its sub-categories, or every category when it ticks none. And no date is
-- required: no start leaves the event open on that side, no end makes it one day when it
-- has a start. An event with no dates and no categories has nothing to match on, so it is
-- linked by hand only.

alter table public.events alter column starts_on drop not null;

create function public.event_first_day(starts date, ends date)
returns date
language sql
immutable
set search_path = ''
as $$ select coalesce(event_first_day.starts, '-infinity'::date) $$;

create function public.event_last_day(starts date, ends date)
returns date
language sql
immutable
set search_path = ''
as $$
  select case when event_last_day.starts is null
    then coalesce(event_last_day.ends, 'infinity'::date)
    else coalesce(event_last_day.ends, event_last_day.starts) end
$$;

grant execute on function public.event_first_day(date, date), public.event_last_day(date, date)
  to authenticated;

delete from public.event_categories where excluded;

create or replace function public.event_takes_category(event uuid, category uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive branch as (
    select c.id, c.parent_id from public.categories c where c.id = event_takes_category.category
    union all
    select p.id, p.parent_id from public.categories p join branch b on p.id = b.parent_id
  )
  select not exists (
      select 1 from public.event_categories ec where ec.event_id = event_takes_category.event
    )
    or exists (
      select 1 from public.event_categories ec join branch b on b.id = ec.category_id
      where ec.event_id = event_takes_category.event
    );
$$;

alter table public.event_categories drop column excluded;
revoke insert on public.event_categories from authenticated;
grant insert (event_id, category_id) on public.event_categories to authenticated;

drop function public.save_event(uuid, text, uuid, date, date, uuid[], uuid[], uuid[]);

create function public.save_event(
  event_id uuid,
  name text,
  type_id uuid,
  starts_on date,
  ends_on date,
  person_ids uuid[],
  category_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_event.event_id;
  old_start date;
  old_end date;
begin
  if saved is null then
    insert into public.events (name, type_id, starts_on, ends_on)
    values (trim(save_event.name), save_event.type_id, save_event.starts_on, save_event.ends_on)
    returning id into saved;
  else
    select public.event_first_day(e.starts_on, e.ends_on), public.event_last_day(e.starts_on, e.ends_on)
    into old_start, old_end
    from public.events e where e.id = saved;
    update public.events e
    set name = trim(save_event.name), type_id = save_event.type_id,
        starts_on = save_event.starts_on, ends_on = save_event.ends_on
    where e.id = saved;
    if not found then
      raise exception 'event_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_people p where p.event_id = saved;
  insert into public.event_people (event_id, person_id)
  select distinct saved, p from unnest(save_event.person_ids) p;

  delete from public.event_categories c where c.event_id = saved;
  insert into public.event_categories (event_id, category_id)
  select distinct saved, c from unnest(save_event.category_ids) c;

  perform public.relink_events(
    least(public.event_first_day(save_event.starts_on, save_event.ends_on),
          coalesce(old_start, public.event_first_day(save_event.starts_on, save_event.ends_on))),
    greatest(public.event_last_day(save_event.starts_on, save_event.ends_on),
             coalesce(old_end, public.event_last_day(save_event.starts_on, save_event.ends_on))));
  return saved;
end;
$$;

revoke execute on function public.save_event(uuid, text, uuid, date, date, uuid[], uuid[]) from public, anon;
grant execute on function public.save_event(uuid, text, uuid, date, date, uuid[], uuid[]) to authenticated;

create or replace function public.matching_event(
  on_date date,
  tx_kind text,
  category_ids uuid[],
  for_transaction uuid default null,
  ignore_exclusions boolean default false
)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id
  from public.events e
  where matching_event.tx_kind in ('expense', 'income')
    and matching_event.on_date
      between public.event_first_day(e.starts_on, e.ends_on) and public.event_last_day(e.starts_on, e.ends_on)
    and (e.starts_on is not null or e.ends_on is not null or exists (
      select 1 from public.event_categories ec where ec.event_id = e.id
    ))
    and (matching_event.ignore_exclusions or not exists (
      select 1 from public.event_exclusions x
      where x.event_id = e.id and x.transaction_id = matching_event.for_transaction
    ))
    and exists (
      select 1 from unnest(matching_event.category_ids) c
      where public.event_takes_category(e.id, c)
    )
  order by case when e.starts_on is null then 1000000
                else coalesce(e.ends_on, e.starts_on) - e.starts_on end,
           e.created_at, e.id
  limit 1;
$$;

create or replace function public.delete_event(event_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  first_day date;
  last_day date;
begin
  select public.event_first_day(e.starts_on, e.ends_on), public.event_last_day(e.starts_on, e.ends_on)
  into first_day, last_day
  from public.events e where e.id = delete_event.event_id;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  update public.transactions t set event_id = null, event_source = null
  where t.event_id = delete_event.event_id;
  delete from public.events e where e.id = delete_event.event_id;
  perform public.relink_events(first_day, last_day);
end;
$$;
