-- Registro de acessos ao guia Bordeaux (quem acessou e quantas vezes).
-- Tabela ISOLADA (bordeaux_*) — não mexe na qimo_guests compartilhada.
-- Acesso só via funções security definer abaixo (guia grava; painel lê).

create table if not exists public.bordeaux_visits (
  id uuid primary key default gen_random_uuid(),
  device text,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists bordeaux_visits_created_idx on public.bordeaux_visits (created_at desc);
create index if not exists bordeaux_visits_phone_idx on public.bordeaux_visits (phone);
create index if not exists bordeaux_visits_device_idx on public.bordeaux_visits (device);

alter table public.bordeaux_visits enable row level security;
-- Sem policies de acesso direto: tudo passa pelas funções security definer.

-- Registrar um acesso — chamado pelo guia (anon), 1x por sessão.
create or replace function public.bordeaux_log_visit(p_device text, p_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bordeaux_visits (device, name, phone)
  values (
    nullif(p_device, ''),
    nullif(p_name, ''),
    nullif(public.qimo_normalize_br_phone(p_phone), '')
  );
end;
$$;
grant execute on function public.bordeaux_log_visit(text, text, text) to anon, authenticated;

-- Resumo por hóspede para o painel (admin autenticado): quem acessou e quantas vezes.
create or replace function public.bordeaux_visits_summary()
returns table (
  name text,
  phone text,
  visits bigint,
  first_seen timestamptz,
  last_seen timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(max(nullif(name, '')), '') as name,
    coalesce(phone, device) as phone,
    count(*) as visits,
    min(created_at) as first_seen,
    max(created_at) as last_seen
  from public.bordeaux_visits
  group by coalesce(phone, device)
  order by max(created_at) desc;
$$;
grant execute on function public.bordeaux_visits_summary() to authenticated;

-- Totais gerais (para os cartões do topo do painel).
create or replace function public.bordeaux_visits_totals()
returns table (
  total_visits bigint,
  unique_guests bigint,
  visits_7d bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) as total_visits,
    count(distinct coalesce(phone, device)) as unique_guests,
    count(*) filter (where created_at >= now() - interval '7 days') as visits_7d
  from public.bordeaux_visits;
$$;
grant execute on function public.bordeaux_visits_totals() to authenticated;
