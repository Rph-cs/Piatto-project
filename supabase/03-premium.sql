-- Piatto: Premium (plano, dietas e contas de demonstração). Rode no SQL Editor.
alter table users add column if not exists plano text not null default 'gratis' check (plano in ('gratis','premium'));
create table if not exists diets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  perfil jsonb not null, meta_kcal int, plano jsonb not null,
  criado_em timestamptz default now());
create index if not exists diets_user_idx on diets(user_id, criado_em desc);
alter table diets enable row level security;
-- Contas de demonstração (senha das duas: demo1234). Apague antes de abrir o site ao público.
insert into users(username, password_hash, plano) values
  ('demo_premium', '$2a$10$P9LUGgDwtXlzAZzdJ.Re4.XbG2EOfoecATELgWLnYvbARnoct0oea', 'premium'),
  ('demo_gratis',  '$2a$10$KSq.oXBQ.EEgqMy5VCm0C.xzvRUIQqHkUsFEfeOFTdPTn.V0XyBVq', 'gratis')
on conflict (username) do update set password_hash = excluded.password_hash, plano = excluded.plano;
-- Para tornar alguém premium: update users set plano = 'premium' where username = 'fulano';
