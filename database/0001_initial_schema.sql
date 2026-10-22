-- =============================================================================
-- TheProjectWork — initial schema (0001_initial_schema.sql)
--
-- Run this ONCE in your own Supabase project (SQL Editor), before building the
-- app. It was generated from the running application's actual database, so it
-- matches exactly what the code queries: tables, relationships, indexes,
-- triggers, functions, grants and row-level-security policies, plus the two
-- storage buckets the app uploads to.
--
-- After this file you still need (see DEPLOY_CPANEL.md):
--   1. Auth settings: enable Email; enable Google; add your site URL + redirect
--      URLs (e.g. https://your-domain.com/login).
--   2. Give your first admin account the admin role (a seed at the bottom
--      explains how, once you have signed up).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Roles
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Tables (in dependency order)
-- -----------------------------------------------------------------------------

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id                         uuid primary key default gen_random_uuid(),
  title                      text not null check (char_length(title) between 3 and 150),
  slug                       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  short_description          text not null default '',
  full_description           text not null default '',
  problem_statement          text not null default '',
  features                   text[] not null default '{}',
  technologies               text[] not null default '{}',
  category_id                uuid references public.categories(id) on delete restrict,
  project_type               text not null default 'BOTH' check (project_type in ('DIPLOMA', 'DEGREE', 'BOTH')),
  complexity                 text not null default 'Intermediate' check (complexity in ('Beginner', 'Intermediate', 'Advanced')),
  price_paise                bigint not null check (price_paise > 0),
  original_price_paise       bigint check (original_price_paise is null or original_price_paise > 0),
  thumbnail_path             text,
  gallery_paths              text[] not null default '{}',
  demo_video_url             text,
  live_demo_url              text,
  demo_status                text not null default 'NOT_AVAILABLE' check (demo_status in ('NOT_AVAILABLE', 'VIDEO_AVAILABLE', 'LIVE_DEMO_AVAILABLE', 'TEMPORARILY_UNAVAILABLE')),
  system_requirements        text[] not null default '{}',
  installation_instructions  text[] not null default '{}',
  package_contents           text[] not null default '{}',
  documentation_description  text,
  ppt_included               boolean not null default false,
  documentation_included     boolean not null default false,
  installation_guide_included boolean not null default false,
  source_code_included       boolean not null default true,
  support_description        text,
  is_featured                boolean not null default false,
  publication_status         text not null default 'DRAFT' check (publication_status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  seo_title                  text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description            text check (seo_description is null or char_length(seo_description) <= 170),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  published_at               timestamptz
);

create table if not exists public.project_files (
  id                       uuid primary key default gen_random_uuid(),
  project_id               uuid not null references public.projects(id) on delete cascade,
  file_type                text not null check (file_type in ('SOURCE_CODE_ZIP', 'DOCUMENTATION', 'PPT', 'INSTALLATION_GUIDE', 'DATABASE_FILES', 'OTHER')),
  display_name             text not null check (char_length(display_name) between 1 and 200),
  private_storage_path     text not null unique,
  file_size                bigint not null check (file_size > 0),
  mime_type                text not null,
  is_included_in_package   boolean not null default true,
  created_at               timestamptz not null default now()
);

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,            -- matches auth.users.id (no FK on purpose)
  project_id          uuid not null references public.projects(id) on delete restrict,
  amount_paise        bigint not null check (amount_paise >= 0),
  status              text not null default 'PENDING' check (status in ('PENDING', 'PAYMENT_PROCESSING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED', 'REFUNDED')),
  payment_reference   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz,
  currency            text not null default 'INR' check (currency = 'INR'),
  gateway             text not null default 'razorpay',
  gateway_order_id    text unique,
  gateway_payment_id  text unique,
  failure_reason      text,
  verified_at         timestamptz
);
-- One paid order per customer per project: no double grants, ever.
create unique index if not exists orders_one_paid_per_user_project
  on public.orders (user_id, project_id) where (status = 'PAID'::text);

create table if not exists public.payment_events (
  id                  uuid primary key default gen_random_uuid(),
  gateway_event_id    text not null unique,     -- webhook idempotency
  event_type          text not null,
  order_id            uuid references public.orders(id) on delete set null,
  gateway_order_id    text,
  gateway_payment_id  text,
  amount_paise        bigint,
  outcome             text not null default 'received',
  received_at         timestamptz not null default now()
);

create table if not exists public.download_logs (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  user_id          uuid not null,
  project_file_id  uuid references public.project_files(id) on delete set null,
  file_name        text not null,
  created_at       timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.app_role not null,
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.assistant_settings (
  id                     integer primary key default 1 check (id = 1),
  enabled                boolean not null default true,
  daily_limit_per_visitor integer not null default 30 check (daily_limit_per_visitor between 1 and 1000),
  max_message_chars      integer not null default 1000 check (max_message_chars between 50 and 4000),
  support_contact        text not null default 'the Contact Us page',
  updated_at             timestamptz not null default now()
);

create table if not exists public.assistant_usage (
  visitor_hash  text not null,
  day           date not null default current_date,
  messages      integer not null default 0,
  errors        integer not null default 0,
  primary key (visitor_hash, day)
);

-- -----------------------------------------------------------------------------
-- Secondary indexes
-- -----------------------------------------------------------------------------
create index if not exists projects_category_idx    on public.projects (category_id);
create index if not exists projects_status_idx      on public.projects (publication_status);
create index if not exists projects_updated_idx     on public.projects (updated_at desc);
create index if not exists project_files_project_idx on public.project_files (project_id);
create index if not exists orders_user_idx          on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx        on public.orders (status, created_at desc);
create index if not exists download_logs_order_idx  on public.download_logs (order_id, created_at desc);
create index if not exists audit_logs_created_idx   on public.audit_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- Functions (bodies match the running application byte for byte)
-- -----------------------------------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.validate_project_publication()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.publication_status = 'PUBLISHED' then
    if new.category_id is null or char_length(trim(new.short_description)) < 10 or char_length(trim(new.full_description)) < 30
       or cardinality(new.technologies) = 0 or cardinality(new.features) = 0 then
      raise exception 'Cannot publish: category, short description, full description, technologies and features are required';
    end if;
    if new.demo_status = 'VIDEO_AVAILABLE' and coalesce(new.demo_video_url, '') = '' then
      raise exception 'Cannot publish: demo status says video available but no video URL is set';
    end if;
    if new.demo_status = 'LIVE_DEMO_AVAILABLE' and coalesce(new.live_demo_url, '') = '' then
      raise exception 'Cannot publish: demo status says live demo available but no live demo URL is set';
    end if;
    if tg_op = 'INSERT' or old.publication_status <> 'PUBLISHED' then
      new.published_at = coalesce(new.published_at, now());
    end if;
  end if;
  return new;
end $$;

create or replace function public.audit_projects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'project.created', 'project', new.id, jsonb_build_object('title', new.title, 'status', new.publication_status, 'price_paise', new.price_paise));
  elsif tg_op = 'UPDATE' then
    if new.publication_status is distinct from old.publication_status then
      insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'project.status_changed', 'project', new.id, jsonb_build_object('from', old.publication_status, 'to', new.publication_status));
    end if;
    if new.price_paise is distinct from old.price_paise or new.original_price_paise is distinct from old.original_price_paise then
      insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'project.price_changed', 'project', new.id, jsonb_build_object('from', old.price_paise, 'to', new.price_paise));
    end if;
  elsif tg_op = 'DELETE' then
    insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'project.deleted', 'project', old.id, jsonb_build_object('title', old.title));
    return old;
  end if;
  return new;
end $$;

create or replace function public.audit_project_files()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'file.added', 'project_file', new.id, jsonb_build_object('project_id', new.project_id, 'type', new.file_type, 'name', new.display_name));
    return new;
  end if;
  insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'file.removed', 'project_file', old.id, jsonb_build_object('project_id', old.project_id, 'type', old.file_type, 'name', old.display_name));
  return old;
end $$;

create or replace function public.assistant_take_quota(_visitor text, _limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  insert into public.assistant_usage (visitor_hash, day, messages) values (_visitor, current_date, 1)
  on conflict (visitor_hash, day) do update set messages = assistant_usage.messages + 1
  returning messages into n;
  return n <= _limit;
end $$;

-- Only the server (service_role) may call the quota function.
revoke execute on function public.assistant_take_quota(text, integer) from public, anon, authenticated;
grant execute on function public.assistant_take_quota(text, integer) to service_role;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists projects_validate on public.projects;
create trigger projects_validate before insert or update on public.projects
  for each row execute function public.validate_project_publication();

drop trigger if exists projects_audit on public.projects;
create trigger projects_audit after insert or update or delete on public.projects
  for each row execute function public.audit_projects();

drop trigger if exists project_files_audit on public.project_files;
create trigger project_files_audit after insert or delete on public.project_files
  for each row execute function public.audit_project_files();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Grants (the Data API cannot reach a table without them) + Row Level Security
-- -----------------------------------------------------------------------------

alter table public.categories          enable row level security;
alter table public.projects            enable row level security;
alter table public.project_files       enable row level security;
alter table public.orders              enable row level security;
alter table public.payment_events      enable row level security;
alter table public.download_logs       enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.user_roles          enable row level security;
alter table public.assistant_settings  enable row level security;
alter table public.assistant_usage     enable row level security;

-- categories
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
create policy "Public reads active categories" on public.categories
  for select to anon, authenticated
  using (is_active or has_role(auth.uid(), 'admin'));
create policy "Admins insert categories" on public.categories
  for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins update categories" on public.categories
  for update to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "Admins delete categories" on public.categories
  for delete to authenticated
  using (has_role(auth.uid(), 'admin'));

-- projects
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
create policy "Public reads published projects" on public.projects
  for select to anon, authenticated
  using (publication_status = 'PUBLISHED' or has_role(auth.uid(), 'admin'));
create policy "Admins insert projects" on public.projects
  for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins update projects" on public.projects
  for update to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "Admins delete projects" on public.projects
  for delete to authenticated
  using (has_role(auth.uid(), 'admin'));

-- project_files (admin-only)
grant all on public.project_files to authenticated;
grant all on public.project_files to service_role;
create policy "Admins manage project files" on public.project_files
  for all to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- orders (customers read own; only the server writes)
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
create policy "Customers read own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all orders" on public.orders
  for select to authenticated using (has_role(auth.uid(), 'admin'));

-- payment_events (admin read; server writes)
grant select on public.payment_events to authenticated;
grant all on public.payment_events to service_role;
create policy "Admins read payment events" on public.payment_events
  for select to authenticated using (has_role(auth.uid(), 'admin'));

-- download_logs
grant select on public.download_logs to authenticated;
grant all on public.download_logs to service_role;
create policy "Customers read own downloads" on public.download_logs
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins read downloads" on public.download_logs
  for select to authenticated using (has_role(auth.uid(), 'admin'));

-- audit_logs (admin read; server/definer writes)
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
create policy "Admins read audit logs" on public.audit_logs
  for select to authenticated using (has_role(auth.uid(), 'admin'));

-- user_roles
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
create policy "Users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- assistant_settings (admin read/update)
grant select, update on public.assistant_settings to authenticated;
grant all on public.assistant_settings to service_role;
create policy "Admins read assistant settings" on public.assistant_settings
  for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins update assistant settings" on public.assistant_settings
  for update to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- assistant_usage (admin read; quota function writes as definer)
grant select on public.assistant_usage to authenticated;
grant all on public.assistant_usage to service_role;
create policy "Admins read assistant usage" on public.assistant_usage
  for select to authenticated using (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- Storage buckets + policies (bucket rows included; sizes match the app: 5 MB
-- images, 200 MB deliverables). The image-extensions check lives in the upload
-- policy, not the bucket, exactly like the running project.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('project-images', 'project-images', false, 5242880),
  ('project-deliverables', 'project-deliverables', false, 209715200)
on conflict (id) do nothing;

create policy "Anyone can read project images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'project-images');

create policy "Admins upload project images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and has_role(auth.uid(), 'admin')
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

create policy "Admins update project images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-images'
    and has_role(auth.uid(), 'admin')
  )
  with check (
    bucket_id = 'project-images'
    and has_role(auth.uid(), 'admin')
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

create policy "Admins delete project images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and has_role(auth.uid(), 'admin'));

create policy "Admins upload deliverables" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-deliverables' and has_role(auth.uid(), 'admin'));

create policy "Admins read deliverables" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-deliverables' and has_role(auth.uid(), 'admin'));

create policy "Admins delete deliverables" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-deliverables' and has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Computer Engineering', 'computer-engineering'),
  ('Information Technology', 'information-technology'),
  ('Artificial Intelligence & Machine Learning', 'ai-ml'),
  ('Cybersecurity', 'cybersecurity'),
  ('Software Engineering', 'software-engineering')
on conflict (slug) do nothing;

insert into public.assistant_settings (id) values (1) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Give the first admin the admin role — AFTER you sign up once on the site:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict (user_id, role) do nothing;
-- -----------------------------------------------------------------------------
