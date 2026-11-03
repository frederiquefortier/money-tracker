-- Open account names are unique per institution, ignoring case (spec 11): "Chèque" can
-- exist at two banks. Accounts with no institution form one group, hence nulls not distinct.
drop index public.accounts_user_open_name_key;

create unique index accounts_user_institution_open_name_key
  on public.accounts (user_id, institution_id, lower(name)) nulls not distinct
  where closed_on is null;
