-- Currencies, exchange rates and the user's currency list (CUR-01..07, ADR-009, spec 10).

-- Reference tables: readable by signed-in users with MFA, written by the rates job with
-- the secret key, which bypasses RLS (security.md, rule 6).

create table public.currencies (
  code        char(3) primary key check (code ~ '^[A-Z]{3}$'),
  name_fr     text not null,
  name_en     text not null,
  symbol      text not null,
  minor_units smallint not null check (minor_units between 0 and 4)
);

alter table public.currencies enable row level security;
revoke all on public.currencies from anon, authenticated;
grant select on public.currencies to authenticated;

create policy "currencies: read"
  on public.currencies for select to authenticated
  using (true);

create policy "currencies: mfa required"
  on public.currencies as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- The currencies in current use per ICU (Node 24, Intl.supportedValuesOf). Names from
-- Intl.DisplayNames, symbol the narrow one, minor units from Intl.NumberFormat. USD keeps
-- the French name from currencies-default.csv.
insert into public.currencies (code, name_fr, name_en, symbol, minor_units) values
  ('AED', 'Dirham des Émirats arabes unis', 'United Arab Emirates Dirham', 'AED', 2),
  ('AFN', 'Afghani afghan', 'Afghan Afghani', '؋', 0),
  ('ALL', 'Lek albanais', 'Albanian Lek', 'ALL', 0),
  ('AMD', 'Dram arménien', 'Armenian Dram', '֏', 2),
  ('ANG', 'Florin antillais', 'Netherlands Antillean Guilder', 'ANG', 2),
  ('AOA', 'Kwanza angolais', 'Angolan Kwanza', 'Kz', 2),
  ('ARS', 'Peso argentin', 'Argentine Peso', '$', 2),
  ('AUD', 'Dollar australien', 'Australian Dollar', '$', 2),
  ('AWG', 'Florin arubais', 'Aruban Florin', 'AWG', 2),
  ('AZN', 'Manat azéri', 'Azerbaijani Manat', '₼', 2),
  ('BAM', 'Mark convertible bosniaque', 'Bosnia-Herzegovina Convertible Mark', 'KM', 2),
  ('BBD', 'Dollar barbadien', 'Barbadian Dollar', '$', 2),
  ('BDT', 'Taka bangladeshi', 'Bangladeshi Taka', '৳', 2),
  ('BGN', 'Lev bulgare', 'Bulgarian Lev', 'BGN', 2),
  ('BHD', 'Dinar bahreïni', 'Bahraini Dinar', 'BHD', 3),
  ('BIF', 'Franc burundais', 'Burundian Franc', 'BIF', 0),
  ('BMD', 'Dollar bermudien', 'Bermudan Dollar', '$', 2),
  ('BND', 'Dollar brunéien', 'Brunei Dollar', '$', 2),
  ('BOB', 'Boliviano bolivien', 'Bolivian Boliviano', 'Bs', 2),
  ('BRL', 'Réal brésilien', 'Brazilian Real', 'R$', 2),
  ('BSD', 'Dollar bahaméen', 'Bahamian Dollar', '$', 2),
  ('BTN', 'Ngultrum bouthanais', 'Bhutanese Ngultrum', 'BTN', 2),
  ('BWP', 'Pula botswanais', 'Botswanan Pula', 'P', 2),
  ('BYN', 'Rouble biélorusse', 'Belarusian Ruble', 'BYN', 2),
  ('BZD', 'Dollar bélizéen', 'Belize Dollar', '$', 2),
  ('CAD', 'Dollar canadien', 'Canadian Dollar', '$', 2),
  ('CDF', 'Franc congolais', 'Congolese Franc', 'CDF', 2),
  ('CHF', 'Franc suisse', 'Swiss Franc', 'CHF', 2),
  ('CLP', 'Peso chilien', 'Chilean Peso', '$', 0),
  ('CNY', 'Yuan renminbi chinois', 'Chinese Yuan', '¥', 2),
  ('COP', 'Peso colombien', 'Colombian Peso', '$', 0),
  ('CRC', 'Colón costaricain', 'Costa Rican Colón', '₡', 2),
  ('CUC', 'Peso cubain convertible', 'Cuban Convertible Peso', '$', 2),
  ('CUP', 'Peso cubain', 'Cuban Peso', '$', 2),
  ('CVE', 'Escudo capverdien', 'Cape Verdean Escudo', 'CVE', 2),
  ('CZK', 'Couronne tchèque', 'Czech Koruna', 'Kč', 2),
  ('DJF', 'Franc djiboutien', 'Djiboutian Franc', 'DJF', 0),
  ('DKK', 'Couronne danoise', 'Danish Krone', 'kr', 2),
  ('DOP', 'Peso dominicain', 'Dominican Peso', '$', 2),
  ('DZD', 'Dinar algérien', 'Algerian Dinar', 'DZD', 2),
  ('EGP', 'Livre égyptienne', 'Egyptian Pound', 'E£', 2),
  ('ERN', 'Nafka érythréen', 'Eritrean Nakfa', 'ERN', 2),
  ('ETB', 'Birr éthiopien', 'Ethiopian Birr', 'ETB', 2),
  ('EUR', 'Euro', 'Euro', '€', 2),
  ('FJD', 'Dollar fidjien', 'Fijian Dollar', '$', 2),
  ('FKP', 'Livre des îles Malouines', 'Falkland Islands Pound', '£', 2),
  ('GBP', 'Livre sterling', 'British Pound', '£', 2),
  ('GEL', 'Lari géorgien', 'Georgian Lari', '₾', 2),
  ('GHS', 'Cédi ghanéen', 'Ghanaian Cedi', 'GH₵', 2),
  ('GIP', 'Livre de Gibraltar', 'Gibraltar Pound', '£', 2),
  ('GMD', 'Dalasi gambien', 'Gambian Dalasi', 'GMD', 2),
  ('GNF', 'Franc guinéen', 'Guinean Franc', 'FG', 0),
  ('GTQ', 'Quetzal guatémaltèque', 'Guatemalan Quetzal', 'Q', 2),
  ('GYD', 'Dollar du Guyana', 'Guyanaese Dollar', '$', 2),
  ('HKD', 'Dollar de Hong Kong', 'Hong Kong Dollar', '$', 2),
  ('HNL', 'Lempira hondurien', 'Honduran Lempira', 'L', 2),
  ('HRK', 'Kuna croate', 'Croatian Kuna', 'kn', 2),
  ('HTG', 'Gourde haïtienne', 'Haitian Gourde', 'HTG', 2),
  ('HUF', 'Forint hongrois', 'Hungarian Forint', 'Ft', 0),
  ('IDR', 'Roupie indonésienne', 'Indonesian Rupiah', 'Rp', 0),
  ('ILS', 'Nouveau shekel israélien', 'Israeli New Shekel', '₪', 2),
  ('INR', 'Roupie indienne', 'Indian Rupee', '₹', 2),
  ('IQD', 'Dinar irakien', 'Iraqi Dinar', 'IQD', 0),
  ('IRR', 'Riyal iranien', 'Iranian Rial', 'IRR', 0),
  ('ISK', 'Couronne islandaise', 'Icelandic Króna', 'kr', 0),
  ('JMD', 'Dollar jamaïcain', 'Jamaican Dollar', '$', 2),
  ('JOD', 'Dinar jordanien', 'Jordanian Dinar', 'JOD', 3),
  ('JPY', 'Yen japonais', 'Japanese Yen', '¥', 0),
  ('KES', 'Shilling kényan', 'Kenyan Shilling', 'KES', 2),
  ('KGS', 'Som kirghize', 'Kyrgyz Som', '⃀', 2),
  ('KHR', 'Riel cambodgien', 'Cambodian Riel', '៛', 2),
  ('KMF', 'Franc comorien', 'Comorian Franc', 'CF', 0),
  ('KPW', 'Won nord-coréen', 'North Korean Won', '₩', 0),
  ('KRW', 'Won sud-coréen', 'South Korean Won', '₩', 0),
  ('KWD', 'Dinar koweïtien', 'Kuwaiti Dinar', 'KWD', 3),
  ('KYD', 'Dollar des îles Caïmans', 'Cayman Islands Dollar', '$', 2),
  ('KZT', 'Tenge kazakh', 'Kazakhstani Tenge', '₸', 2),
  ('LAK', 'Kip laotien', 'Laotian Kip', '₭', 0),
  ('LBP', 'Livre libanaise', 'Lebanese Pound', 'L£', 0),
  ('LKR', 'Roupie srilankaise', 'Sri Lankan Rupee', 'Rs', 2),
  ('LRD', 'Dollar libérien', 'Liberian Dollar', '$', 2),
  ('LSL', 'Loti lesothan', 'Lesotho Loti', 'LSL', 2),
  ('LYD', 'Dinar libyen', 'Libyan Dinar', 'LYD', 3),
  ('MAD', 'Dirham marocain', 'Moroccan Dirham', 'MAD', 2),
  ('MDL', 'Leu moldave', 'Moldovan Leu', 'MDL', 2),
  ('MGA', 'Ariary malgache', 'Malagasy Ariary', 'Ar', 0),
  ('MKD', 'Denar macédonien', 'Macedonian Denar', 'MKD', 2),
  ('MMK', 'Kyat myanmarais', 'Myanmar Kyat', 'K', 0),
  ('MNT', 'Tugrik mongol', 'Mongolian Tugrik', '₮', 2),
  ('MOP', 'Pataca macanaise', 'Macanese Pataca', 'MOP', 2),
  ('MRU', 'Ouguiya mauritanien', 'Mauritanian Ouguiya', 'MRU', 2),
  ('MUR', 'Roupie mauricienne', 'Mauritian Rupee', 'Rs', 2),
  ('MVR', 'Rufiyaa maldivienne', 'Maldivian Rufiyaa', 'MVR', 2),
  ('MWK', 'Kwacha malawite', 'Malawian Kwacha', 'MWK', 2),
  ('MXN', 'Peso mexicain', 'Mexican Peso', '$', 2),
  ('MYR', 'Ringgit malais', 'Malaysian Ringgit', 'RM', 2),
  ('MZN', 'Metical mozambicain', 'Mozambican Metical', 'MZN', 2),
  ('NAD', 'Dollar namibien', 'Namibian Dollar', '$', 2),
  ('NGN', 'Naira nigérian', 'Nigerian Naira', '₦', 2),
  ('NIO', 'Córdoba oro nicaraguayen', 'Nicaraguan Córdoba', 'C$', 2),
  ('NOK', 'Couronne norvégienne', 'Norwegian Krone', 'kr', 2),
  ('NPR', 'Roupie népalaise', 'Nepalese Rupee', 'Rs', 2),
  ('NZD', 'Dollar néo-zélandais', 'New Zealand Dollar', '$', 2),
  ('OMR', 'Riyal omanais', 'Omani Rial', 'OMR', 3),
  ('PAB', 'Balboa panaméen', 'Panamanian Balboa', 'PAB', 2),
  ('PEN', 'Sol péruvien', 'Peruvian Sol', 'PEN', 2),
  ('PGK', 'Kina papouan-néo-guinéen', 'Papua New Guinean Kina', 'PGK', 2),
  ('PHP', 'Peso philippin', 'Philippine Peso', '₱', 2),
  ('PKR', 'Roupie pakistanaise', 'Pakistani Rupee', 'Rs', 0),
  ('PLN', 'Zloty polonais', 'Polish Zloty', 'zł', 2),
  ('PYG', 'Guaraní paraguayen', 'Paraguayan Guarani', '₲', 0),
  ('QAR', 'Riyal qatari', 'Qatari Riyal', 'QAR', 2),
  ('RON', 'Leu roumain', 'Romanian Leu', 'lei', 2),
  ('RSD', 'Dinar serbe', 'Serbian Dinar', 'RSD', 2),
  ('RUB', 'Rouble russe', 'Russian Ruble', '₽', 2),
  ('RWF', 'Franc rwandais', 'Rwandan Franc', 'RF', 0),
  ('SAR', 'Riyal saoudien', 'Saudi Riyal', 'SAR', 2),
  ('SBD', 'Dollar des îles Salomon', 'Solomon Islands Dollar', '$', 2),
  ('SCR', 'Roupie des Seychelles', 'Seychellois Rupee', 'SCR', 2),
  ('SDG', 'Livre soudanaise', 'Sudanese Pound', 'SDG', 2),
  ('SEK', 'Couronne suédoise', 'Swedish Krona', 'kr', 2),
  ('SGD', 'Dollar de Singapour', 'Singapore Dollar', '$', 2),
  ('SHP', 'Livre de Sainte-Hélène', 'St. Helena Pound', '£', 2),
  ('SLE', 'Leone sierra-léonais', 'Sierra Leonean Leone', 'SLE', 2),
  ('SLL', 'Leone sierra-léonais (1964–2022)', 'Sierra Leonean Leone (1964–2022)', 'SLL', 0),
  ('SOS', 'Shilling somalien', 'Somali Shilling', 'SOS', 0),
  ('SRD', 'Dollar surinamais', 'Surinamese Dollar', '$', 2),
  ('SSP', 'Livre sud-soudanaise', 'South Sudanese Pound', '£', 2),
  ('STN', 'Dobra santoméen', 'São Tomé & Príncipe Dobra', 'Db', 2),
  ('SVC', 'Colón salvadorien', 'Salvadoran Colón', 'SVC', 2),
  ('SYP', 'Livre syrienne', 'Syrian Pound', '£', 0),
  ('SZL', 'Lilangeni swazi', 'Swazi Lilangeni', 'SZL', 2),
  ('THB', 'Baht thaïlandais', 'Thai Baht', '฿', 2),
  ('TJS', 'Somoni tadjik', 'Tajikistani Somoni', 'TJS', 2),
  ('TMT', 'Nouveau manat turkmène', 'Turkmenistani Manat', 'TMT', 2),
  ('TND', 'Dinar tunisien', 'Tunisian Dinar', 'TND', 3),
  ('TOP', 'Pa''anga tongan', 'Tongan Paʻanga', 'T$', 2),
  ('TRY', 'Livre turque', 'Turkish Lira', '₺', 2),
  ('TTD', 'Dollar de Trinité-et-Tobago', 'Trinidad & Tobago Dollar', '$', 2),
  ('TWD', 'Nouveau dollar taïwanais', 'New Taiwan Dollar', '$', 2),
  ('TZS', 'Shilling tanzanien', 'Tanzanian Shilling', 'TZS', 2),
  ('UAH', 'Hryvnia ukrainienne', 'Ukrainian Hryvnia', '₴', 2),
  ('UGX', 'Shilling ougandais', 'Ugandan Shilling', 'UGX', 0),
  ('USD', 'Dollar américain', 'US Dollar', '$', 2),
  ('UYU', 'Peso uruguayen', 'Uruguayan Peso', '$', 2),
  ('UZS', 'Sum ouzbek', 'Uzbekistani Som', 'UZS', 2),
  ('VES', 'Bolivar vénézuélien', 'Venezuelan Bolívar', 'VES', 2),
  ('VND', 'Dông vietnamien', 'Vietnamese Dong', '₫', 0),
  ('VUV', 'Vatu vanuatuan', 'Vanuatu Vatu', 'VUV', 0),
  ('WST', 'Tala samoan', 'Samoan Tala', 'WST', 2),
  ('XAF', 'Franc CFA (BEAC)', 'Central African CFA Franc', 'FCFA', 0),
  ('XCD', 'Dollar des Caraïbes orientales', 'East Caribbean Dollar', '$', 2),
  ('XCG', 'Florin caribéen', 'Caribbean guilder', 'Cg.', 2),
  ('XDR', 'Droit de tirage spécial', 'Special Drawing Rights', 'XDR', 2),
  ('XOF', 'Franc CFA (BCEAO)', 'West African CFA Franc', 'F CFA', 0),
  ('XPF', 'Franc CFP', 'CFP Franc', 'CFPF', 0),
  ('XSU', 'XSU', 'Sucre', 'XSU', 2),
  ('YER', 'Riyal yéménite', 'Yemeni Rial', 'YER', 0),
  ('ZAR', 'Rand sud-africain', 'South African Rand', 'R', 2),
  ('ZMW', 'Kwacha zambien', 'Zambian Kwacha', 'ZK', 2),
  ('ZWG', 'Or du Zimbabwe', 'Zimbabwean Gold', 'ZWG', 2),
  ('ZWL', 'Dollar zimbabwéen (2009)', 'Zimbabwean Dollar (2009–2024)', 'ZWL', 2);

-- EUR is the only base: the ECB publishes against it, and every other pair is a cross
-- rate (database.md). One row per published day; gaps are weekends and holidays.
create table public.exchange_rates (
  base      char(3) not null default 'EUR' references public.currencies check (base = 'EUR'),
  quote     char(3) not null references public.currencies check (quote <> 'EUR'),
  rate_date date not null,
  rate      numeric(24,12) not null check (rate > 0),
  source    text not null check (source in ('frankfurter', 'hexarate')),
  primary key (base, quote, rate_date)
);

create index exchange_rates_quote_idx on public.exchange_rates (quote);

alter table public.exchange_rates enable row level security;
revoke all on public.exchange_rates from anon, authenticated;
grant select on public.exchange_rates to authenticated;

create policy "exchange_rates: read"
  on public.exchange_rates for select to authenticated
  using (true);

create policy "exchange_rates: mfa required"
  on public.exchange_rates as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Units of to_currency for one from_currency on a date (CUR-07). Each leg uses the last
-- rate published on or before the date. Null when a leg has none: callers show the
-- missing-rate error, never zero (ADR-004).
create function public.exchange_rate(from_currency char(3), to_currency char(3), on_date date)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  with legs as (
    select
      case when from_currency = 'EUR' then 1 else (
        select r.rate from public.exchange_rates r
        where r.base = 'EUR' and r.quote = from_currency and r.rate_date <= on_date
        order by r.rate_date desc limit 1
      ) end as eur_from,
      case when to_currency = 'EUR' then 1 else (
        select r.rate from public.exchange_rates r
        where r.base = 'EUR' and r.quote = to_currency and r.rate_date <= on_date
        order by r.rate_date desc limit 1
      ) end as eur_to
  )
  select case
    when from_currency = to_currency then 1
    else round(eur_to / eur_from, 12)
  end
  from legs;
$$;

revoke execute on function public.exchange_rate(char, char, date) from public, anon;
grant execute on function public.exchange_rate(char, char, date) to authenticated;

-- The user's currency list (CUR-01..04). Removing sets removed_at so adding back can skip
-- the HexaRate check; rows are never deleted by the user.
create table public.user_currencies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  code         char(3) not null references public.currencies,
  is_favourite boolean not null default false,
  removed_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, code)
);

create index user_currencies_code_idx on public.user_currencies (code);

create trigger user_currencies_set_updated_at
  before update on public.user_currencies
  for each row execute function public.set_updated_at();

alter table public.user_currencies enable row level security;
revoke all on public.user_currencies from anon, authenticated;
grant select on public.user_currencies to authenticated;
grant insert (code) on public.user_currencies to authenticated;
grant update (is_favourite, removed_at) on public.user_currencies to authenticated;

create policy "user_currencies: read own"
  on public.user_currencies for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_currencies: insert own"
  on public.user_currencies for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_currencies: update own"
  on public.user_currencies for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_currencies: mfa required"
  on public.user_currencies as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Existing users get the five starting currencies before the profile columns point at them.
insert into public.user_currencies (user_id, code)
select p.user_id, c.code
from public.profiles p
cross join (values ('CAD'), ('CHF'), ('EUR'), ('GBP'), ('USD')) as c (code)
on conflict (user_id, code) do nothing;

-- Default (CUR-05) and display (CUR-06) currencies, both from the user's own list.
alter table public.profiles
  add column default_currency char(3) not null default 'CAD',
  add column display_currency char(3) not null default 'CAD',
  add constraint profiles_default_currency_fkey
    foreign key (user_id, default_currency) references public.user_currencies (user_id, code),
  add constraint profiles_display_currency_fkey
    foreign key (user_id, display_currency) references public.user_currencies (user_id, code);

grant update (default_currency, display_currency) on public.profiles to authenticated;

-- A foreign key cannot see removed_at, so the triggers keep both currencies in the active
-- list. Errors carry a stable message the server functions map to copy.
create function public.check_profile_currencies()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.user_currencies uc
    where uc.user_id = new.user_id
      and uc.code in (new.default_currency, new.display_currency)
      and uc.removed_at is not null
  ) then
    raise exception 'currency_removed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_profile_currencies() from public, anon, authenticated;

create trigger profiles_check_currencies
  before update of default_currency, display_currency on public.profiles
  for each row execute function public.check_profile_currencies();

-- The default cannot be removed; removing the display currency switches the display to
-- the default (spec 10). Open accounts will also block removal once accounts exist.
create function public.on_user_currency_removed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.user_id = new.user_id and p.default_currency = new.code
  ) then
    raise exception 'default_currency_cannot_be_removed' using errcode = '23514';
  end if;

  update public.profiles p
  set display_currency = p.default_currency
  where p.user_id = new.user_id and p.display_currency = new.code;

  return new;
end;
$$;

revoke execute on function public.on_user_currency_removed() from public, anon, authenticated;

create trigger user_currencies_on_removed
  before update of removed_at on public.user_currencies
  for each row
  when (old.removed_at is null and new.removed_at is not null)
  execute function public.on_user_currency_removed();

-- Sign-up: the five starting currencies (keep in sync with currencies-default.csv), then the
-- profile, whose currency columns reference them. Replacing keeps the revoked privileges.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := lower(split_part(coalesce(new.raw_user_meta_data ->> 'locale', ''), '-', 1));
begin
  insert into public.user_currencies (user_id, code)
  select new.id, c.code
  from (values ('CAD'), ('CHF'), ('EUR'), ('GBP'), ('USD')) as c (code);

  insert into public.profiles (user_id, locale)
  values (new.id, case when requested in ('fr', 'en') then requested else 'fr' end);
  return new;
end;
$$;
