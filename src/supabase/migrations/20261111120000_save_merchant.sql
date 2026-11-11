-- The merchant and its aliases in one call (MER-02, ADR-012), the way save_person writes a
-- person's: the list is replaced, so the screen sends all of them.
create function public.save_merchant(
  merchant_id uuid,
  name text,
  default_category_id uuid,
  person_id uuid,
  aliases text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid := save_merchant.merchant_id;
begin
  if saved is null then
    insert into public.merchants (name, default_category_id, person_id)
    values (trim(save_merchant.name), save_merchant.default_category_id, save_merchant.person_id)
    returning id into saved;
  else
    -- Gone first, so a name can take back one of its own aliases.
    delete from public.merchant_aliases a where a.merchant_id = saved;
    update public.merchants m set
      name = trim(save_merchant.name),
      default_category_id = save_merchant.default_category_id,
      person_id = save_merchant.person_id
    where m.id = saved;
    if not found then
      raise exception 'merchant_not_found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.merchant_aliases (merchant_id, alias)
  select saved, trim(a) from unnest(save_merchant.aliases) a where trim(a) <> '';

  return saved;
end;
$$;

revoke execute on function public.save_merchant(uuid, text, uuid, uuid, text[]) from public, anon;
grant execute on function public.save_merchant(uuid, text, uuid, uuid, text[]) to authenticated;
