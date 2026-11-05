-- The list after trying it (spec 14, decided 2026-11-05): no tiles, any period (all, the
-- last 30 days, a year, a month), loaded a page at a time, the institution beside every
-- account, and every category of a split.
--
-- Rows are those between from_date and to_date (either open), before the `before` day
-- when set. A page holds about max_rows rows and always whole days, so a day net is never
-- cut; `more` says older rows remain, and the next page starts before the page's last day.
-- The rest is as before: converted to the display currency at each date, a transfer once
-- (or the account's own leg when filtered), the last entered first within a day, and a
-- day net that is null when it includes a missing rate.
drop function public.list_transactions(date, uuid);

create function public.list_transactions(
  from_date date default null,
  to_date date default null,
  account uuid default null,
  before date default null,
  max_rows integer default 150
)
returns table (
  id               uuid,
  transfer_id      uuid,
  kind             text,
  occurred_on      date,
  pending          boolean,
  merchant         text,
  note             text,
  account_name     text,
  institution      text,
  from_account     text,
  from_institution text,
  to_account       text,
  to_institution   text,
  categories       jsonb,
  amount           text,
  currency         text,
  display_amount   text,
  rate             text,
  day_net          text,
  more             boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with display as (
    select p.display_currency as code, c.minor_units
    from public.profiles p
    join public.currencies c on c.code = p.display_currency
    where p.user_id = (select auth.uid())
  ),
  scope as (
    select t.*
    from public.transactions t
    where (list_transactions.from_date is null or t.occurred_on >= list_transactions.from_date)
      and (list_transactions.to_date is null or t.occurred_on <= list_transactions.to_date)
      and (list_transactions.before is null or t.occurred_on < list_transactions.before)
      and case
        when list_transactions.account is null then not (t.kind = 'transfer' and t.amount > 0)
        else t.account_id = list_transactions.account
      end
  ),
  cutoff as (
    select s.occurred_on from scope s
    order by s.occurred_on desc
    offset greatest(list_transactions.max_rows, 1) - 1 limit 1
  ),
  page as (
    select s.* from scope s
    where s.occurred_on >= coalesce((select c.occurred_on from cutoff c), '-infinity'::date)
  ),
  listed as (
    select
      t.id,
      t.transfer_id,
      t.kind,
      t.occurred_on,
      min(t.created_at) over (partition by coalesce(t.transfer_id, t.id)) as entered_at,
      t.status = 'pending' or (list_transactions.account is null and t.kind = 'transfer' and exists (
        select 1 from public.transactions o
        where o.transfer_id = t.transfer_id and o.status = 'pending'
      )) as pending,
      m.name as merchant,
      t.note,
      a.name as account_name,
      i.name as institution,
      legs.from_account,
      legs.from_institution,
      legs.to_account,
      legs.to_institution,
      coalesce(s.categories, '[]'::jsonb) as categories,
      case when list_transactions.account is null and t.kind = 'transfer' then -t.amount else t.amount end
        as amount,
      t.currency,
      public.exchange_rate(t.currency, d.code, t.occurred_on) as rate,
      d.minor_units
    from page t
    cross join display d
    join public.accounts a on a.id = t.account_id
    left join public.institutions i on i.id = a.institution_id
    left join public.merchants m on m.id = t.merchant_id
    -- The largest share first, as the row stacks the icons.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'icon', k.icon, 'color', k.color)
        order by abs(x.amount) desc, k.name
      ) as categories
      from public.transaction_splits x
      join public.categories k on k.id = x.category_id
      where x.transaction_id = t.id
    ) s on true
    left join lateral (
      select
        max(oa.name) filter (where o.amount < 0) as from_account,
        max(oi.name) filter (where o.amount < 0) as from_institution,
        max(oa.name) filter (where o.amount > 0) as to_account,
        max(oi.name) filter (where o.amount > 0) as to_institution
      from public.transactions o
      join public.accounts oa on oa.id = o.account_id
      left join public.institutions oi on oi.id = oa.institution_id
      where o.transfer_id = t.transfer_id and o.kind = 'transfer'
    ) legs on t.kind = 'transfer'
  ),
  converted as (
    select
      l.*,
      round(l.amount * l.rate, l.minor_units) as display_value,
      l.kind in ('expense', 'income') as in_day_net
    from listed l
  )
  select
    v.id,
    v.transfer_id,
    v.kind,
    v.occurred_on,
    v.pending,
    v.merchant,
    v.note,
    v.account_name,
    v.institution,
    v.from_account,
    v.from_institution,
    v.to_account,
    v.to_institution,
    v.categories,
    v.amount::text,
    v.currency::text,
    v.display_value::text,
    v.rate::text,
    case
      when bool_or(v.in_day_net and v.rate is null) over day then null
      else coalesce(sum(v.display_value) filter (where v.in_day_net) over day, 0)::text
    end,
    exists (
      select 1 from scope s
      where s.occurred_on < (select c.occurred_on from cutoff c)
    )
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;

revoke execute on function public.list_transactions(date, date, uuid, date, integer) from public, anon;
grant execute on function public.list_transactions(date, date, uuid, date, integer) to authenticated;
