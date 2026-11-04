-- What the transaction form's pickers rank by (spec 13, spec 15), and the rate it
-- previews with.

-- Merchants by use: the picker lists the most used first while empty (TRX-05).
create view public.merchant_usage
with (security_invoker = true)
as
select t.merchant_id, count(*)::integer as transaction_count
from public.transactions t
where t.merchant_id is not null
group by t.merchant_id;

-- CAT-06: per kind, the five categories with the most splits over the last 90 days; ties
-- go to the one used last. Transfer fees do not count.
create view public.frequent_categories
with (security_invoker = true)
as
select ranked.kind, ranked.category_id, ranked.rank
from (
  select
    t.kind,
    s.category_id,
    row_number() over (
      partition by t.user_id, t.kind
      order by count(*) desc, max(t.occurred_on) desc
    )::integer as rank
  from public.transaction_splits s
  join public.transactions t on t.id = s.transaction_id
  where t.kind in ('expense', 'income')
    and t.transfer_id is null
    and t.occurred_on > current_date - 90
    and t.occurred_on <= current_date
  group by t.user_id, t.kind, s.category_id
) ranked
where ranked.rank <= 5;

revoke all on public.merchant_usage, public.frequent_categories from anon, authenticated;
grant select on public.merchant_usage, public.frequent_categories to authenticated;

-- PostgREST sends a numeric result as a JSON number, which the browser reads as a float;
-- as text the rate stays exact for the previews (ADR-004).
create function public.exchange_rate_text(from_currency char(3), to_currency char(3), on_date date)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select public.exchange_rate(from_currency, to_currency, on_date)::text;
$$;

revoke execute on function public.exchange_rate_text(char, char, date) from public, anon;
grant execute on function public.exchange_rate_text(char, char, date) to authenticated;
