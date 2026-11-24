-- Piatto: controle de uso (limite de gerações por hora). Rode no SQL Editor.
create table if not exists usage_log(
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  acao text not null,
  criado_em timestamptz default now());
create index if not exists usage_idx on usage_log(user_id, acao, criado_em desc);
alter table usage_log enable row level security;
