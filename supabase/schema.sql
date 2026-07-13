create extension if not exists pgcrypto;

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  case_id text not null,
  action_type text not null,
  message text default '',
  amount numeric default 0,
  status text not null default 'nouveau',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_requests_created_at_idx
  on public.client_requests (created_at desc);

create index if not exists client_requests_status_idx
  on public.client_requests (status);

alter table public.client_requests enable row level security;

drop policy if exists "Service role manages client requests" on public.client_requests;

create policy "Service role manages client requests"
  on public.client_requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
