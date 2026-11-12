-- An invited person can have a part of 0 (PPL-03, ADR-052). "Invited" says I paid for them;
-- a gift or a bought item for them is the whole amount on Moi with their part at 0. The
-- check wanted a part above zero for every line but Moi and With.
alter table public.transaction_people drop constraint transaction_people_value_check;
alter table public.transaction_people
  add constraint transaction_people_value_check
    check (role in ('me', 'with', 'invited') or amount_unknown or input_value > 0);
