-- The transactions list (spec 14): one month, newest day first, every amount and total
-- converted in SQL to the display currency at each transaction's date (CUR-07). Amounts
-- come back as text, so PostgREST never sends them as JSON numbers (ADR-004).
--
-- With no account, a transfer is one row: its outgoing leg, amount unsigned, pending
-- while either leg is. With an account, each row is that account's own leg, signed.
-- A transfer's fee follows its transfer. Within a day, the last entered comes first.
--
-- Totals repeat on every row. The tiles count splits by their category's kind, so a
-- refund (an income on an expense category) lowers expenses; investments, transfers and
-- adjustments count in neither. The day net is the day's expenses and incomes as listed.
-- A total that includes a missing rate is null, never a partial sum.
create function public.list_transactions(month date, account uuid default null)
returns table (
  id                 uuid,
  transfer_id        uuid,
  kind               text,
  occurred_on        date,
  pending            boolean,
  merchant           text,
  note               text,
  account_name       text,
  from_account       text,
  to_account         text,
  category_count     integer,
  category_name      text,
  category_icon      text,
  category_color     text,
  amount             text,
  currency           text,
  display_amount     text,
  rate               text,
  day_net            text,
  day_converted      boolean,
  expenses           text,
  expenses_converted boolean,
  incomes            text,
  incomes_converted  boolean
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
      legs.from_account,
      legs.to_account,
      s.category_count,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      case when list_transactions.account is null and t.kind = 'transfer' then -t.amount else t.amount end
        as amount,
      t.currency,
      t.currency <> d.code as converted,
      public.exchange_rate(t.currency, d.code, t.occurred_on) as rate,
      d.minor_units,
      coalesce(s.expense_part, 0) as expense_part,
      coalesce(s.income_part, 0) as income_part
    from public.transactions t
    cross join display d
    join public.accounts a on a.id = t.account_id
    left join public.merchants m on m.id = t.merchant_id
    left join lateral (
      select
        count(*)::integer as category_count,
        case when count(*) = 1 then (array_agg(x.category_id))[1] end as category_id,
        sum(x.amount) filter (where k.kind = 'expense') as expense_part,
        sum(x.amount) filter (where k.kind = 'income') as income_part
      from public.transaction_splits x
      join public.categories k on k.id = x.category_id
      where x.transaction_id = t.id
    ) s on true
    left join public.categories c on c.id = s.category_id
    left join lateral (
      select
        max(oa.name) filter (where o.amount < 0) as from_account,
        max(oa.name) filter (where o.amount > 0) as to_account
      from public.transactions o
      join public.accounts oa on oa.id = o.account_id
      where o.transfer_id = t.transfer_id and o.kind = 'transfer'
    ) legs on t.kind = 'transfer'
    where t.occurred_on >= date_trunc('month', list_transactions.month)::date
      and t.occurred_on < (date_trunc('month', list_transactions.month) + interval '1 month')::date
      and case
        when list_transactions.account is null then not (t.kind = 'transfer' and t.amount > 0)
        else t.account_id = list_transactions.account
      end
  ),
  converted as (
    select
      l.*,
      round(l.amount * l.rate, l.minor_units) as display_value,
      round(l.expense_part * l.rate, l.minor_units) as expense_value,
      round(l.income_part * l.rate, l.minor_units) as income_value,
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
    v.from_account,
    v.to_account,
    v.category_count,
    v.category_name,
    v.category_icon,
    v.category_color,
    v.amount::text,
    v.currency::text,
    v.display_value::text,
    v.rate::text,
    case
      when bool_or(v.in_day_net and v.rate is null) over day then null
      else coalesce(sum(v.display_value) filter (where v.in_day_net) over day, 0)::text
    end,
    coalesce(bool_or(v.in_day_net and v.converted) over day, false),
    case
      when bool_or(v.expense_part <> 0 and v.rate is null) over () then null
      else (-sum(v.expense_value) over ())::text
    end,
    coalesce(bool_or(v.expense_part <> 0 and v.converted) over (), false),
    case
      when bool_or(v.income_part <> 0 and v.rate is null) over () then null
      else (sum(v.income_value) over ())::text
    end,
    coalesce(bool_or(v.income_part <> 0 and v.converted) over (), false)
  from converted v
  window day as (partition by v.occurred_on)
  order by v.occurred_on desc, v.entered_at desc, coalesce(v.transfer_id, v.id), v.kind = 'expense', v.id;
$$;

revoke execute on function public.list_transactions(date, uuid) from public, anon;
grant execute on function public.list_transactions(date, uuid) to authenticated;
