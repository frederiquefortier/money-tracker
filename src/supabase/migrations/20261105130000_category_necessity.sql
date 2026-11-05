-- Need or want on expense categories (CAT-10, spec 12). Null follows the nearest marked
-- parent; income has no mark and investments count as savings, so only expense takes one.
alter table public.categories
  add column necessity text check (necessity in ('need', 'want')),
  add constraint categories_necessity_expense_only
    check (necessity is null or kind = 'expense');

grant insert (necessity), update (necessity) on public.categories to authenticated;

-- A branch moved out of expense drops its marks. Runs before the check, and again on each
-- child that cascade_category_kind updates.
create function public.clear_category_necessity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.necessity := null;
  return new;
end;
$$;

revoke execute on function public.clear_category_necessity() from public, anon, authenticated;

create trigger categories_clear_necessity
  before update of kind on public.categories
  for each row when (new.kind <> 'expense' and new.necessity is not null)
  execute function public.clear_category_necessity();
