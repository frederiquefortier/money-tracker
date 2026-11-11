-- A merchant that is a person (TRX-05, PPL-01): "I bought something from Maman". The
-- merchant keeps working everywhere a merchant does (list, filters, search); this links it
-- to the person, who has it as their own. A person has at most one such merchant, and
-- deleting the person leaves the merchant as it was.
alter table public.merchants add column person_id uuid;

alter table public.merchants
  add foreign key (user_id, person_id) references public.people (user_id, id)
    on delete set null (person_id);

create unique index merchants_user_person_key on public.merchants (user_id, person_id)
  where person_id is not null;

grant insert (person_id), update (person_id) on public.merchants to authenticated;
