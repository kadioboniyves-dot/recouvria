create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('super_admin', 'admin_recouvrement', 'agent', 'client')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  segment text default 'B2B',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id text primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  client_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  amount numeric not null default 0,
  paid numeric not null default 0,
  delay_days integer not null default 0,
  risk text not null default 'medium',
  status text not null default 'Nouveau',
  next_action text default '',
  next_date text default '',
  promise text default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  case_id text references public.cases(id) on delete cascade,
  order_ref text,
  product text not null,
  packaging text default 'Unité',
  quantity numeric not null default 0,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'Non payée',
  issued_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id text references public.cases(id) on delete cascade,
  amount numeric not null,
  method text,
  proof_url text,
  status text not null default 'en_attente',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  case_id text references public.cases(id) on delete cascade,
  type text not null default 'Relance',
  subject text not null,
  content text not null,
  pdf_url text,
  status text not null default 'Brouillon',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  case_id text references public.cases(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cases_client_token_idx on public.cases(client_token);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists invoices_case_id_idx on public.invoices(case_id);
create index if not exists payments_case_id_idx on public.payments(case_id);
create index if not exists audit_events_case_id_idx on public.audit_events(case_id);
create index if not exists audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.letters enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Service role manages organizations" on public.organizations;
drop policy if exists "Service role manages profiles" on public.profiles;
drop policy if exists "Service role manages clients" on public.clients;
drop policy if exists "Service role manages cases" on public.cases;
drop policy if exists "Service role manages invoices" on public.invoices;
drop policy if exists "Service role manages payments" on public.payments;
drop policy if exists "Service role manages letters" on public.letters;
drop policy if exists "Service role manages audit events" on public.audit_events;

create policy "Service role manages organizations" on public.organizations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages profiles" on public.profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages clients" on public.clients for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages cases" on public.cases for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages invoices" on public.invoices for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages payments" on public.payments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages letters" on public.letters for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages audit events" on public.audit_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
