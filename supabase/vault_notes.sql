create table if not exists public.vault_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.vault_notes enable row level security;

revoke all on table public.vault_notes from anon, authenticated;

create table if not exists public.vault_announcements (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.vault_announcements enable row level security;

revoke all on table public.vault_announcements from anon, authenticated;

create table if not exists public.vault_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  device_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (owner_id, device_id)
);

alter table public.vault_devices enable row level security;

revoke all on table public.vault_devices from anon, authenticated;
