-- MER-08: the category a merchant's own transactions use most, offered as its default
-- category in the merchants list. Ties go to the one used last.
create view public.merchant_suggested_category
with (security_invoker = true)
as
select ranked.merchant_id, ranked.category_id
from (
  select
    t.merchant_id,
    s.category_id,
    row_number() over (
      partition by t.merchant_id
      order by count(distinct t.id) desc, max(t.occurred_on) desc
    ) as rank
  from public.transaction_splits s
  join public.transactions t on t.id = s.transaction_id
  where t.merchant_id is not null
  group by t.merchant_id, s.category_id
) ranked
where ranked.rank = 1;

revoke all on public.merchant_suggested_category from anon, authenticated;
grant select on public.merchant_suggested_category to authenticated;
