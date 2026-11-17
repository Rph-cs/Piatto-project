-- Piatto: rode no Supabase em SQL Editor > New query
create table if not exists users(
  id uuid primary key default gen_random_uuid(),
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  password_hash text not null,
  criado_em timestamptz default now());
create table if not exists favorites(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  titulo text, categoria text, receita jsonb not null,
  criado_em timestamptz default now());
create index if not exists favorites_user_idx on favorites(user_id, criado_em desc);
create table if not exists daily_recipes(
  user_id uuid references users(id) on delete cascade, dia date, receita jsonb not null,
  primary key(user_id, dia));
-- Só o servidor (service_role) acessa. Sem políticas = ninguém acessa pelo navegador.
alter table users enable row level security;
alter table favorites enable row level security;
alter table daily_recipes enable row level security;
