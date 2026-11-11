-- EVT-07: an event can opt out of the automatic link by date. With it off, the event holds
-- only the transactions linked by hand, and the automatic links it had are taken back by
-- the next recompute (to another event matching the date, or to none).

alter table public.events
  add column auto_link boolean not null default true;

create or replace function public.matching_event(
  on_date date,
  tx_kind text,
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
    and e.auto_link
    and (e.starts_on is not null or e.ends_on is not null)
    and matching_event.on_date
      between public.event_first_day(e.starts_on, e.ends_on) and public.event_last_day(e.starts_on, e.ends_on)
    and (matching_event.ignore_exclusions or not exists (
      select 1 from public.event_exclusions x
      where x.event_id = e.id and x.transaction_id = matching_event.for_transaction
    ))
  order by case when e.starts_on is null then 1000000
                else coalesce(e.ends_on, e.starts_on) - e.starts_on end,
           e.created_at, e.id
  limit 1;
$$;

drop function public.save_event(uuid, text, uuid, date, date, uuid[]);

create function public.save_event(
  event_id uuid,
  name text,
  type_id uuid,
  starts_on date,
  ends_on date,
  person_ids uuid[],
  auto_link boolean default true
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
    insert into public.events (name, type_id, starts_on, ends_on, auto_link)
    values (trim(save_event.name), save_event.type_id, save_event.starts_on, save_event.ends_on,
            save_event.auto_link)
    returning id into saved;
  else
    select public.event_first_day(e.starts_on, e.ends_on), public.event_last_day(e.starts_on, e.ends_on)
    into old_start, old_end
    from public.events e where e.id = saved;
    update public.events e
    set name = trim(save_event.name), type_id = save_event.type_id,
        starts_on = save_event.starts_on, ends_on = save_event.ends_on,
        auto_link = save_event.auto_link
    where e.id = saved;
    if not found then
      raise exception 'event_not_found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.event_people p where p.event_id = saved;
  insert into public.event_people (event_id, person_id)
  select distinct saved, p from unnest(save_event.person_ids) p;

  perform public.relink_events(
    least(public.event_first_day(save_event.starts_on, save_event.ends_on),
          coalesce(old_start, public.event_first_day(save_event.starts_on, save_event.ends_on))),
    greatest(public.event_last_day(save_event.starts_on, save_event.ends_on),
             coalesce(old_end, public.event_last_day(save_event.starts_on, save_event.ends_on))));
  return saved;
end;
$$;

revoke execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean) from public, anon;
grant execute on function public.save_event(uuid, text, uuid, date, date, uuid[], boolean) to authenticated;

grant insert (auto_link), update (auto_link) on public.events to authenticated;
