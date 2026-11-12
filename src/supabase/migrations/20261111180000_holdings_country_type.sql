-- Holdings by country and type, with an optional name, and no exclusion flag (ADR-048).
-- A holding is in a country; its type is a predefined one or a typed one (type_label), and
-- its kind is stored, set from the type when there is one. The transactions list loses
-- the holding filter and names each row's holding by its parts.

alter table public.holdings
  add column kind text,
  add column type_label text check (length(trim(type_label)) between 1 and 100),
  alter column type drop not null,
  alter column name drop not null;

-- Holdings made before the country was required take their type's country, else Canada.
update public.holdings h
set kind = t.kind,
    country = coalesce(h.country, t.country, 'CA')
from public.holding_types t
where t.code = h.type;

alter table public.holdings
  alter column kind set not null,
  alter column country set not null,
  add constraint holdings_kind_check check (kind in ('investment', 'asset', 'debt')),
  add constraint holdings_type_check check ((type is null) <> (type_label is null)),
  drop column exclude_from_net_worth;

-- Unique among open named holdings; unnamed ones are never in conflict.
drop index public.holdings_user_open_name_key;
create unique index holdings_user_open_name_key
  on public.holdings (user_id, public.fold_name(name))
  where closed_on is null and name is not null;

grant insert (type_label, kind), update (type_label, kind) on public.holdings to authenticated;

-- A predefined type gives the holding its kind.
create function public.set_holding_kind()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.type is not null then
    new.kind := coalesce(
      (select t.kind from public.holding_types t where t.code = new.type), new.kind);
  end if;
  return new;
end;
$$;

revoke execute on function public.set_holding_kind() from public, anon, authenticated;

create trigger holdings_set_kind
  before insert or update of type, kind on public.holdings
  for each row execute function public.set_holding_kind();

drop function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean, uuid[], boolean, uuid[], boolean);

create or replace function public.list_transactions(
  from_date date default null,
  to_date date default null,
  account_ids uuid[] default null,
  category_ids uuid[] default null,
  merchant_ids uuid[] default null,
  search text default null,
  before date default null,
  pending_only boolean default false,
  max_rows integer default 150,
  person_ids uuid[] default null,
  owed_only boolean default false,
  event_ids uuid[] default null,
  without_event boolean default false
)
returns table (
  id                uuid,
  transfer_id       uuid,
  kind              text,
  occurred_on       date,
  pending           boolean,
  merchant          text,
  note              text,
  account_name      text,
  institution       text,
  from_account      text,
  from_institution  text,
  to_account        text,
  to_institution    text,
  categories        jsonb,
  people            jsonb,
  reimburses        jsonb,
  event             jsonb,
  holding           jsonb,
  amount            text,
  currency          text,
  display_amount    text,
  rate              text,
  day_net           text,
  fee_amount        text,
  fee_category      text,
  received_amount   text,
  received_currency text,
  received_value    text,
  conversion_cost   text,
  more              boolean,
  total             bigint,
  pending_count     bigint,
  owed_count        bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive branch as (
    select c.id from public.categories c where c.id = any(list_transactions.category_ids)
    union
    select c.id from public.categories c join branch b on c.parent_id = b.id
  ),
  display as (
    select p.display_currency as code, c.minor_units
    from public.profiles p
    join public.currencies c on c.code = p.display_currency
    where p.user_id = (select auth.uid())
  ),
  -- Everything the filters and the search match, at any date.
  matched as (
    select
      t.*,
      t.status = 'pending' or (coalesce(cardinality(list_transactions.account_ids), 0) = 0
        and t.kind = 'transfer' and exists (
        select 1 from public.transactions o
        where o.transfer_id = t.transfer_id and o.status = 'pending'
      )) as is_pending,
      exists (
        select 1 from public.owed_lines o
        where o.transaction_id = t.id and o.open
      ) as is_owed
    from public.transactions t
    left join public.merchants sm on sm.id = t.merchant_id
    join public.accounts sa on sa.id = t.account_id
    left join public.institutions si on si.id = sa.institution_id
    cross join lateral (
      select public.fold_name(trim(coalesce(list_transactions.search, ''))) as text
    ) q
    where (coalesce(cardinality(list_transactions.merchant_ids), 0) = 0
        or t.merchant_id = any(list_transactions.merchant_ids))
      and (coalesce(cardinality(list_transactions.person_ids), 0) = 0
        or t.seller_person_id = any(list_transactions.person_ids)
        or exists (
        select 1 from public.transaction_people x
        where x.transaction_id = t.id and x.person_id = any(list_transactions.person_ids)
      ))
      and ((coalesce(cardinality(list_transactions.event_ids), 0) = 0 and not list_transactions.without_event)
        or t.event_id = any(list_transactions.event_ids)
        or (list_transactions.without_event and t.event_id is null))
      and (coalesce(cardinality(list_transactions.category_ids), 0) = 0 or exists (
        select 1 from public.transaction_splits x
        where x.transaction_id = t.id and x.category_id in (select b.id from branch b)
      ))
      -- A fee shows on its transfer, unless categories are filtered.
      and (coalesce(cardinality(list_transactions.category_ids), 0) > 0
        or not (t.kind = 'expense' and t.transfer_id is not null))
      and (q.text = ''
        or exists (
          select 1 from unnest(array[sm.name, (select sp.name from public.people sp where sp.id = t.seller_person_id), t.note, sa.name, si.name]) as v (value)
          where strpos(public.fold_name(coalesce(v.value, '')), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_splits x
          join public.categories k on k.id = x.category_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or exists (
          select 1 from public.transaction_people x
          join public.people k on k.id = x.person_id
          where x.transaction_id = t.id and strpos(public.fold_name(k.name), q.text) > 0
        )
        or (t.transfer_id is not null and exists (
          select 1 from public.transactions o
          join public.accounts oa on oa.id = o.account_id
          left join public.institutions oi on oi.id = oa.institution_id
          where o.transfer_id = t.transfer_id
            and (strpos(public.fold_name(oa.name), q.text) > 0
              or strpos(public.fold_name(coalesce(oi.name, '')), q.text) > 0)
        )))
      and case
        when coalesce(cardinality(list_transactions.account_ids), 0) = 0
          then not (t.kind = 'transfer' and t.amount > 0)
        else t.account_id = any(list_transactions.account_ids)
      end
  ),
  scope as (
    select m.* from matched m
    where (list_transactions.from_date is null or m.occurred_on >= list_transactions.from_date)
      and (list_transactions.to_date is null or m.occurred_on <= list_transactions.to_date)
      and (list_transactions.before is null or m.occurred_on < list_transactions.before)
      and (not list_transactions.pending_only or m.is_pending)
      and (not list_transactions.owed_only or m.is_owed)
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
      t.is_pending as pending,
      case when m.name is not null and sl.name is not null then m.name || ' · ' || sl.name
           else coalesce(m.name, sl.name) end as merchant,
      t.note,
      a.name as account_name,
      i.name as institution,
      legs.from_account,
      legs.from_institution,
      legs.to_account,
      legs.to_institution,
      coalesce(s.categories, '[]'::jsonb) as categories,
      coalesce(pp.people, '[]'::jsonb) as people,
      coalesce(rb.reimburses, '[]'::jsonb) as reimburses,
      ev.event,
      hd.holding,
      case when coalesce(cardinality(list_transactions.account_ids), 0) = 0 and t.kind = 'transfer'
        then -t.amount else t.amount end
        as amount,
      t.currency,
      public.exchange_rate(t.currency, d.code, t.occurred_on) as rate,
      d.minor_units,
      fee.amount as fee_amount,
      fee.category as fee_category,
      arrival.amount as received_amount,
      arrival.currency as received_currency,
      arrival.value as received_value,
      arrival.market,
      fx.market as fx_market
    from page t
    cross join display d
    join public.accounts a on a.id = t.account_id
    left join public.institutions i on i.id = a.institution_id
    left join public.merchants m on m.id = t.merchant_id
    left join public.people sl on sl.id = t.seller_person_id
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
    -- Everyone but Moi, in the order of their lines: the row's avatars (a line without a
    -- name with its count) and its colour when someone owes me.
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('name', k.name, 'count', x.head_count, 'role', x.role,
                           'open', coalesce(o.open, false))
        order by x.position
      ) as people
      from public.transaction_people x
      left join public.people k on k.id = x.person_id
      left join public.owed_lines o on o.id = x.id
      where x.transaction_id = t.id and x.role <> 'me'
    ) pp on true
    -- What an income pays back: each expense's merchant, or its largest category, and date.
    left join lateral (
      select jsonb_agg(distinct jsonb_build_object(
        'label', coalesce(o.merchant, o.category), 'date', o.occurred_on)) as reimburses
      from public.reimbursements r
      join public.owed_lines o on o.id = r.owed_line_id
      where r.income_id = t.id
    ) rb on t.kind = 'income'
    -- The event as a tag: its name, and its type's icon and colour when it has one.
    left join lateral (
      select jsonb_build_object('id', e.id, 'name', e.name, 'color', ty.color,
                                'source', t.event_source) as event
      from public.events e
      left join public.event_types ty on ty.id = e.type_id
      where e.id = t.event_id
    ) ev on true
    -- The holding as parts, so the client names it (a holding may have no name).
    left join lateral (
      select jsonb_build_object('name', h.name,
                                'typeFr', coalesce(h.type_label, ht.label_fr),
                                'typeEn', coalesce(h.type_label, ht.label_en),
                                'institution', hi.name,
                                'currency', h.currency) as holding
      from public.holdings h
      left join public.holding_types ht on ht.code = h.type
      left join public.institutions hi on hi.id = h.institution_id
      where h.id = t.holding_id
    ) hd on true
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
    ) legs on t.transfer_id is not null
    -- Only the departure row carries the fee and the arrival.
    left join lateral (
      select -f.amount as amount, k.name as category
      from public.transactions f
      left join public.transaction_splits x on x.transaction_id = f.id
      left join public.categories k on k.id = x.category_id
      where f.transfer_id = t.transfer_id and f.kind = 'expense'
      limit 1
    ) fee on t.kind = 'transfer' and t.amount < 0
      and coalesce(cardinality(list_transactions.category_ids), 0) = 0
    left join lateral (
      select
        o.amount,
        o.currency,
        round(o.amount / r.rate, c.minor_units) as value,
        round(-t.amount * r.rate, oc.minor_units) as market
      from public.transactions o
      join public.currencies c on c.code = t.currency
      join public.currencies oc on oc.code = o.currency
      cross join lateral (select public.exchange_rate(t.currency, o.currency, t.occurred_on) as rate) r
      where o.transfer_id = t.transfer_id and o.kind = 'transfer' and o.amount > 0
        and o.currency <> t.currency
    ) arrival on t.kind = 'transfer' and t.amount < 0
    -- Paid in another currency: the market value of the original amount, in the account's.
    left join lateral (
      select round(abs(t.original_amount)
        * public.exchange_rate(t.original_currency, t.currency, t.occurred_on), c.minor_units) as market
      from public.currencies c
      where c.code = t.currency
    ) fx on t.original_currency is not null
  ),
  converted as (
    select
      l.*,
      round(l.amount * l.rate, l.minor_units) as display_value,
      round(-l.fee_amount * l.rate, l.minor_units) as fee_display,
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
    v.people,
    v.reimburses,
    v.event,
    v.holding,
    v.amount::text,
    v.currency::text,
    v.display_value::text,
    v.rate::text,
    case
      when bool_or((v.in_day_net or v.fee_amount is not null) and v.rate is null) over day then null
      else (coalesce(sum(v.display_value) filter (where v.in_day_net) over day, 0)
        + coalesce(sum(v.fee_display) over day, 0))::text
    end,
    v.fee_amount::text,
    v.fee_category,
    v.received_amount::text,
    v.received_currency::text,
    v.received_value::text,
    -- At the market value exactly, rounding the way back would show a cent of cost.
    case
      when v.received_amount = v.market then '0'
      when v.received_amount is not null then (abs(v.amount) - v.received_value)::text
      when v.kind = 'income' then (v.fx_market - abs(v.amount))::text
      else (abs(v.amount) - v.fx_market)::text
    end,
    exists (
      select 1 from scope s
      where s.occurred_on < (select c.occurred_on from cutoff c)
    ),
    (select count(*) from scope),
    (select count(*) from matched m where m.is_pending),
    (select count(*) from matched m where m.is_owed)
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;

revoke execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean, uuid[], boolean) from public, anon;
grant execute on function public.list_transactions(date, date, uuid[], uuid[], uuid[], text, date, boolean, integer, uuid[], boolean, uuid[], boolean) to authenticated;
