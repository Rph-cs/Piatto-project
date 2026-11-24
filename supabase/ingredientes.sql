-- Piatto: banco de ingredientes. Rode no Supabase em SQL Editor > New query
create table if not exists ingredients(
  id serial primary key,
  nome text unique not null,
  nome_busca text not null,
  categoria text,
  basico boolean default false,
  kcal_100g numeric, proteina_100g numeric, carbo_100g numeric, gordura_100g numeric, fonte text,
  criado_em timestamptz default now());
create table if not exists ingredient_aliases(
  id serial primary key,
  ingredient_id int not null references ingredients(id) on delete cascade,
  apelido text not null,
  apelido_busca text not null,
  unique(ingredient_id, apelido_busca));
create table if not exists ingredient_requests(
  id serial primary key,
  texto text not null,
  user_id uuid references users(id) on delete set null,
  criado_em timestamptz default now());
create index if not exists ingredients_busca_idx on ingredients(nome_busca text_pattern_ops);
create index if not exists aliases_busca_idx on ingredient_aliases(apelido_busca text_pattern_ops);
alter table ingredients enable row level security;
alter table ingredient_aliases enable row level security;
alter table ingredient_requests enable row level security;
