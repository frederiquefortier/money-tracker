-- relink_events in one pass. It called matching_event once per transaction (about 20 ms
-- each), so a full recompute, which saving the default excluded categories runs, took 87 s
-- and hit the 8 s statement timeout. Same rules as matching_event (ADR-055, ADR-056): the
-- event must link automatically and cover the date, the link must not have been removed by
-- hand, and a transaction whose splits are all in the event's skipped categories is left
-- out. The narrower range wins, then the earlier created. matching_event stays for one
-- transaction (the form, save_transaction).

create or replace function public.relink_events(from_date date, to_date date)
returns void
language sql
security invoker
set search_path = ''
as $$
  with recursive chosen as (
    select s.event_id, s.category_id
    from public.event_skips s
    join public.events e on e.id = s.event_id
    where e.skips_own
    union all
    select e.id, d.category_id
    from public.events e
    cross join public.event_default_skips d
    where not e.skips_own
  ),
  skipped as (
    select event_id, category_id from chosen
    union
    select k.event_id, c.id from public.categories c join skipped k on c.parent_id = k.category_id
  ),
  targets as (
    select x.id, x.occurred_on
    from public.transactions x
    where x.kind in ('expense', 'income')
      and x.occurred_on between relink_events.from_date and relink_events.to_date
      and (x.event_source is distinct from 'manual' or x.event_id is null)
  ),
  best as (
    select distinct on (t.id) t.id, e.id as event
    from targets t
    join public.events e
      on e.auto_link
     and (e.starts_on is not null or e.ends_on is not null)
     and t.occurred_on
       between public.event_first_day(e.starts_on, e.ends_on) and public.event_last_day(e.starts_on, e.ends_on)
    where not exists (
        select 1 from public.event_exclusions x
        where x.event_id = e.id and x.transaction_id = t.id
      )
      and not (
        exists (select 1 from public.transaction_splits s where s.transaction_id = t.id)
        and not exists (
          select 1 from public.transaction_splits s
          where s.transaction_id = t.id
            and not exists (
              select 1 from skipped k where k.event_id = e.id and k.category_id = s.category_id
            )
        )
      )
    order by t.id,
             case when e.starts_on is null then 1000000
                  else coalesce(e.ends_on, e.starts_on) - e.starts_on end,
             e.created_at, e.id
  )
  update public.transactions tr
  set event_id = m.event,
      event_source = case when m.event is null then null else 'auto' end
  from (select t.id, b.event from targets t left join best b on b.id = t.id) m
  where tr.id = m.id and tr.event_id is distinct from m.event;
$$;
