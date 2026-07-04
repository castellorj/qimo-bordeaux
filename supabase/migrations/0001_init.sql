-- QIMO Bordeaux Experience — schema inicial
-- Rode no SQL Editor do Supabase (ou via supabase db push).

create extension if not exists "pgcrypto";

-- ---------- Viagens ----------
create table if not exists viagens (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  navio text,
  data_inicio date not null,
  data_fim date not null,
  criado_em timestamptz default now()
);

-- ---------- Dias ----------
create table if not exists dias (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  numero int not null,
  data date not null,
  titulo text not null,
  subtitulo text,
  portos text[] default '{}',
  overnight text,
  dress_code text,
  nota text,
  ship jsonb default '[]'
);

-- ---------- Atividades ----------
create table if not exists atividades (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid references dias(id) on delete cascade,
  ordem int default 0,
  horario text,
  titulo text not null,
  tipo text,
  local text,
  capacidade int,
  descricao text,
  dress_code text,
  qimo_select boolean default false,
  vinicola_slug text,
  cidade_slug text
);

-- ---------- Cidades ----------
create table if not exists cidades (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  regiao text,
  tagline text,
  hero_image text,
  historia text,
  curiosidades text[] default '{}',
  o_que_fazer text[] default '{}',
  photo_spots text[] default '{}',
  melhores_horarios text,
  restaurantes text[] default '{}',
  cafes text[] default '{}',
  lojas text[] default '{}',
  vinhos_locais text[] default '{}',
  lat double precision,
  lng double precision,
  dias int[] default '{}'
);

-- ---------- Vinícolas ----------
create table if not exists vinicolas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  apelacao text,
  classificacao text,
  hero_image text,
  familia text,
  historia text,
  terroir text,
  castas text[] default '{}',
  producao text,
  icones text[] default '{}',
  pontuacoes jsonb default '[]',
  preco_medio text,
  o_que_comprar text[] default '{}',
  o_que_provar text[] default '{}',
  curiosidades text[] default '{}',
  horario_visita text,
  dress_code text,
  website text,
  instagram text,
  lat double precision,
  lng double precision,
  qimo_select boolean default false,
  dias int[] default '{}'
);

-- ---------- Vinhos (apelações) ----------
create table if not exists vinhos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  margem text,
  cor text,
  tagline text,
  descricao text,
  castas text[] default '{}',
  perfil text,
  temperatura text,
  harmonizacoes text[] default '{}',
  guarda text,
  produtores text[] default '{}',
  qimo_nota text
);

-- ---------- Experiências ----------
create table if not exists experiencias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  descricao text,
  duracao text,
  local text,
  categoria text,
  hero_image text,
  qimo_select boolean default false,
  dia int
);

-- ---------- Gastronomia ----------
create table if not exists gastronomia (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  categoria text,
  descricao text,
  onde_provar text[] default '{}',
  harmonizacao text,
  hero_image text,
  qimo_select boolean default false
);

-- ---------- Compras ----------
create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  categoria text,
  descricao text,
  onde_comprar text[] default '{}',
  faixa_preco text,
  tax_free boolean default false,
  qimo_select boolean default false
);

-- ---------- Contatos (concierge) ----------
create table if not exists contatos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  tipo text,
  valor text,
  dica text,
  icone text
);

-- ---------- RLS: leitura pública, escrita autenticada ----------
do $$
declare t text;
begin
  foreach t in array array[
    'viagens','dias','atividades','cidades','vinicolas','vinhos',
    'experiencias','gastronomia','compras','contatos'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "leitura publica" on %I;', t);
    execute format('create policy "leitura publica" on %I for select using (true);', t);
    execute format('drop policy if exists "escrita autenticada" on %I;', t);
    execute format('create policy "escrita autenticada" on %I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;
