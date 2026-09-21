create extension if not exists "pgcrypto";

create table if not exists organizers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text,
  category text,
  description text,
  instagram_handle text,
  address text,
  logo_file text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer_slug text references organizers (slug) on update cascade on delete set null,
  start timestamptz not null,
  location_name text,
  address text,
  category text,
  price_eur numeric(10, 2) not null default 0,
  description text,
  source_url text,
  newcomer_friendly boolean not null default false,
  image_file text,
  created_at timestamptz not null default now()
);

create index if not exists events_start_idx on events (start);
create index if not exists events_organizer_slug_idx on events (organizer_slug);

alter table organizers enable row level security;
alter table events enable row level security;

drop policy if exists "organizers are readable by anon" on organizers;
create policy "organizers are readable by anon"
  on organizers
  for select
  to anon
  using (true);

drop policy if exists "events are readable by anon" on events;
create policy "events are readable by anon"
  on events
  for select
  to anon
  using (true);
