
-- ============================================================
-- ENUMS
-- ============================================================
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.listing_status as enum ('active', 'sold', 'archived');
create type public.accommodation_type as enum ('room', 'apartment', 'shared_flat');

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  nationality text,
  designation text,
  bio text,
  hobbies text[] default '{}'::text[],
  languages text[] default '{}'::text[],
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- ============================================================
-- USER ROLES
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- TIMESTAMP TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- MARKETPLACE
-- ============================================================
create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  description text,
  location text,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.marketplace_listings (status, created_at desc);
create index on public.marketplace_listings (user_id);
create index on public.marketplace_listings (category);

grant select on public.marketplace_listings to anon;
grant select, insert, update, delete on public.marketplace_listings to authenticated;
grant all on public.marketplace_listings to service_role;

alter table public.marketplace_listings enable row level security;

create policy "Active listings are public"
  on public.marketplace_listings for select
  using (status = 'active' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own listings"
  on public.marketplace_listings for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Owners/admins update listings"
  on public.marketplace_listings for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Owners/admins delete listings"
  on public.marketplace_listings for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create trigger marketplace_listings_updated_at before update on public.marketplace_listings
  for each row execute function public.set_updated_at();

create table public.marketplace_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.marketplace_images (listing_id);

grant select on public.marketplace_images to anon;
grant select, insert, update, delete on public.marketplace_images to authenticated;
grant all on public.marketplace_images to service_role;

alter table public.marketplace_images enable row level security;

create policy "Marketplace images viewable by everyone"
  on public.marketplace_images for select using (true);
create policy "Owners/admins manage marketplace images"
  on public.marketplace_images for all to authenticated
  using (
    exists(select 1 from public.marketplace_listings l where l.id = listing_id
           and (l.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  )
  with check (
    exists(select 1 from public.marketplace_listings l where l.id = listing_id
           and (l.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );

-- ============================================================
-- ACCOMMODATIONS
-- ============================================================
create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.accommodation_type not null,
  title text not null,
  rent_cents integer not null default 0,
  deposit_cents integer not null default 0,
  currency text not null default 'EUR',
  available_from date,
  address text,
  description text,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.accommodations (status, created_at desc);
create index on public.accommodations (user_id);
create index on public.accommodations (type);

grant select on public.accommodations to anon;
grant select, insert, update, delete on public.accommodations to authenticated;
grant all on public.accommodations to service_role;

alter table public.accommodations enable row level security;

create policy "Active accommodations are public"
  on public.accommodations for select
  using (status = 'active' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own accommodations"
  on public.accommodations for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Owners/admins update accommodations"
  on public.accommodations for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Owners/admins delete accommodations"
  on public.accommodations for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create trigger accommodations_updated_at before update on public.accommodations
  for each row execute function public.set_updated_at();

create table public.accommodation_images (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.accommodation_images (accommodation_id);

grant select on public.accommodation_images to anon;
grant select, insert, update, delete on public.accommodation_images to authenticated;
grant all on public.accommodation_images to service_role;

alter table public.accommodation_images enable row level security;

create policy "Accommodation images viewable by everyone"
  on public.accommodation_images for select using (true);
create policy "Owners/admins manage accommodation images"
  on public.accommodation_images for all to authenticated
  using (
    exists(select 1 from public.accommodations a where a.id = accommodation_id
           and (a.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  )
  with check (
    exists(select 1 from public.accommodations a where a.id = accommodation_id
           and (a.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  position text not null,
  employment_type text not null default 'full_time',
  salary_text text,
  location text,
  description text,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.jobs (status, created_at desc);
create index on public.jobs (user_id);

grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;

alter table public.jobs enable row level security;

create policy "Active jobs are public"
  on public.jobs for select
  using (status = 'active' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own jobs"
  on public.jobs for insert to authenticated with check (auth.uid() = user_id);
create policy "Owners/admins update jobs"
  on public.jobs for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Owners/admins delete jobs"
  on public.jobs for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

create table public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

grant select, insert, delete on public.saved_jobs to authenticated;
grant all on public.saved_jobs to service_role;

alter table public.saved_jobs enable row level security;

create policy "Users view own saved jobs"
  on public.saved_jobs for select to authenticated using (auth.uid() = user_id);
create policy "Users save jobs"
  on public.saved_jobs for insert to authenticated with check (auth.uid() = user_id);
create policy "Users unsave jobs"
  on public.saved_jobs for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- SLIDER & SITE SETTINGS
-- ============================================================
create table public.slider_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.slider_images to anon, authenticated;
grant all on public.slider_images to service_role;

alter table public.slider_images enable row level security;

create policy "Slider images are public"
  on public.slider_images for select using (true);
create policy "Admins manage slider images"
  on public.slider_images for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.site_settings (
  id integer primary key default 1,
  hero_title text not null default 'Marburg Connect',
  hero_subtitle text not null default 'Your home away from home in Marburg.',
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);
insert into public.site_settings (id) values (1);

grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

alter table public.site_settings enable row level security;

create policy "Site settings are public"
  on public.site_settings for select using (true);
create policy "Admins update site settings"
  on public.site_settings for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('profile-images', 'profile-images', true),
  ('marketplace-images', 'marketplace-images', true),
  ('accommodation-images', 'accommodation-images', true),
  ('slider-images', 'slider-images', true)
on conflict (id) do nothing;

-- Public read for all buckets
create policy "Public read profile-images"
  on storage.objects for select using (bucket_id = 'profile-images');
create policy "Public read marketplace-images"
  on storage.objects for select using (bucket_id = 'marketplace-images');
create policy "Public read accommodation-images"
  on storage.objects for select using (bucket_id = 'accommodation-images');
create policy "Public read slider-images"
  on storage.objects for select using (bucket_id = 'slider-images');

-- Authenticated users upload into folders prefixed by their uid
create policy "Users upload own profile-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own profile-images"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own profile-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users upload own marketplace-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'marketplace-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own marketplace-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'marketplace-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')));

create policy "Users upload own accommodation-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'accommodation-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own accommodation-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'accommodation-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')));

create policy "Admins manage slider-images storage"
  on storage.objects for all to authenticated
  using (bucket_id = 'slider-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'slider-images' and public.has_role(auth.uid(), 'admin'));
