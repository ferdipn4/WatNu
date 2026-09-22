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

-- Organizer accounts: a Supabase Auth user manages one or more organizers. Rows are created by
-- scripts/create-demo-organizer.ts (service role); there is no self-signup yet. Students never sign in.
create table if not exists organizer_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  organizer_id uuid not null references organizers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, organizer_id)
);

create index if not exists organizer_members_organizer_id_idx on organizer_members (organizer_id);

alter table organizers enable row level security;
alter table events enable row level security;
alter table organizer_members enable row level security;

-- Everyone reads. Signed-in users read too, so their own writes can return the row.
drop policy if exists "organizers are readable by anon" on organizers;
create policy "organizers are readable by anon"
  on organizers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "events are readable by anon" on events;
create policy "events are readable by anon"
  on events
  for select
  to anon, authenticated
  using (true);

drop policy if exists "members read their memberships" on organizer_members;
create policy "members read their memberships"
  on organizer_members
  for select
  to authenticated
  using (user_id = auth.uid());

-- Whether the signed-in user manages the organizer with this slug.
create or replace function is_organizer_member(slug_to_check text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from organizers o
    join organizer_members m on m.organizer_id = o.id
    where o.slug = slug_to_check
      and m.user_id = auth.uid()
  );
$$;

-- Only the organizer's members write: their profile, and events under their slug.
drop policy if exists "members update their organizer" on organizers;
create policy "members update their organizer"
  on organizers
  for update
  to authenticated
  using (is_organizer_member(slug))
  with check (is_organizer_member(slug));

drop policy if exists "members insert their events" on events;
create policy "members insert their events"
  on events
  for insert
  to authenticated
  with check (organizer_slug is not null and is_organizer_member(organizer_slug));

drop policy if exists "members update their events" on events;
create policy "members update their events"
  on events
  for update
  to authenticated
  using (is_organizer_member(organizer_slug))
  with check (organizer_slug is not null and is_organizer_member(organizer_slug));

drop policy if exists "members delete their events" on events;
create policy "members delete their events"
  on events
  for delete
  to authenticated
  using (is_organizer_member(organizer_slug));
