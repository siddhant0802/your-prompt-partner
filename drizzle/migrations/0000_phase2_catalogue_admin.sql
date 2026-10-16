create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public reads active categories" on public.categories for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert categories" on public.categories for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update categories" on public.categories for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete categories" on public.categories for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();

insert into public.categories (name, slug) values
  ('Computer Engineering', 'computer-engineering'),
  ('Information Technology', 'information-technology'),
  ('Artificial Intelligence & Machine Learning', 'ai-ml'),
  ('Cybersecurity', 'cybersecurity'),
  ('Software Engineering', 'software-engineering');

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  short_description text not null default '',
  full_description text not null default '',
  problem_statement text not null default '',
  features text[] not null default '{}',
  technologies text[] not null default '{}',
  category_id uuid references public.categories(id) on delete restrict,
  project_type text not null default 'BOTH' check (project_type in ('DIPLOMA','DEGREE','BOTH')),
  complexity text not null default 'Intermediate' check (complexity in ('Beginner','Intermediate','Advanced')),
  price_paise bigint not null check (price_paise > 0),
  original_price_paise bigint check (original_price_paise is null or original_price_paise > 0),
  thumbnail_path text,
  gallery_paths text[] not null default '{}',
  demo_video_url text,
  live_demo_url text,
  demo_status text not null default 'NOT_AVAILABLE' check (demo_status in ('NOT_AVAILABLE','VIDEO_AVAILABLE','LIVE_DEMO_AVAILABLE','TEMPORARILY_UNAVAILABLE')),
  system_requirements text[] not null default '{}',
  installation_instructions text[] not null default '{}',
  package_contents text[] not null default '{}',
  documentation_description text,
  ppt_included boolean not null default false,
  documentation_included boolean not null default false,
  installation_guide_included boolean not null default false,
  source_code_included boolean not null default true,
  support_description text,
  is_featured boolean not null default false,
  publication_status text not null default 'DRAFT' check (publication_status in ('DRAFT','PUBLISHED','ARCHIVED')),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index projects_status_idx on public.projects (publication_status);
create index projects_category_idx on public.projects (category_id);
create index projects_updated_idx on public.projects (updated_at desc);
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Public reads published projects" on public.projects for select to anon, authenticated using (publication_status = 'PUBLISHED' or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert projects" on public.projects for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update projects" on public.projects for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete projects" on public.projects for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();

create or replace function public.validate_project_publication() returns trigger language plpgsql set search_path = public as $$
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
create trigger projects_validate before insert or update on public.projects for each row execute function public.validate_project_publication();

-- Private file metadata
create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_type text not null check (file_type in ('SOURCE_CODE_ZIP','DOCUMENTATION','PPT','INSTALLATION_GUIDE','DATABASE_FILES','OTHER')),
  display_name text not null check (char_length(display_name) between 1 and 200),
  private_storage_path text not null unique,
  file_size bigint not null check (file_size > 0),
  mime_type text not null,
  is_included_in_package boolean not null default true,
  created_at timestamptz not null default now()
);
create index project_files_project_idx on public.project_files (project_id);
grant select, insert, update, delete on public.project_files to authenticated;
grant all on public.project_files to service_role;
alter table public.project_files enable row level security;
create policy "Admins manage project files" on public.project_files for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Audit log
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admins read audit logs" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.audit_projects() returns trigger language plpgsql security definer set search_path = public as $$
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
create trigger projects_audit after insert or update or delete on public.projects for each row execute function public.audit_projects();

create or replace function public.audit_project_files() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'file.added', 'project_file', new.id, jsonb_build_object('project_id', new.project_id, 'type', new.file_type, 'name', new.display_name));
    return new;
  end if;
  insert into audit_logs(actor_id, action, entity_type, entity_id, details) values (auth.uid(), 'file.removed', 'project_file', old.id, jsonb_build_object('project_id', old.project_id, 'type', old.file_type, 'name', old.display_name));
  return old;
end $$;
create trigger project_files_audit after insert or delete on public.project_files for each row execute function public.audit_project_files();

revoke execute on function public.audit_projects() from public, anon, authenticated;
revoke execute on function public.audit_project_files() from public, anon, authenticated;