-- =====================================================================
-- QIMO Travel Platform — CMS + ERP (multi-viagem, reservas, capacidade)
-- Substitui o rascunho 0001 (PT). Nomes canônicos em inglês.
-- Reutilizável para qualquer viagem QIMO (Bordeaux, Croácia, Grécia...).
-- Rode no SQL Editor do Supabase.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin create type publish_status as enum ('draft','preview','published','hidden'); exception when duplicate_object then null; end $$;
do $$ begin create type reservation_status as enum ('confirmed','pending','cancelled','waitlist'); exception when duplicate_object then null; end $$;
do $$ begin create type activity_status as enum ('available','limited','sold_out','hidden'); exception when duplicate_object then null; end $$;
do $$ begin create type user_role as enum ('admin','editor','viewer'); exception when duplicate_object then null; end $$;

-- ---------- Usuários / papéis ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'editor',
  created_at timestamptz default now()
);

create or replace function is_staff() returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- =====================================================================
-- VIAGENS (multi-trip + templates)
-- =====================================================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  destination text,
  year int,
  start_date date,
  end_date date,
  ship text,
  cover_image text,
  is_template boolean default false,
  status publish_status default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- PARTICIPANTES & FAMÍLIAS
-- =====================================================================
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  country text,
  language text default 'pt',
  dietary_restrictions text,
  allergies text,
  companions int default 0,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_participants_trip on participants(trip_id);
create index if not exists idx_participants_family on participants(family_id);

-- =====================================================================
-- PROGRAMAÇÃO (dias + atividades) — atividades = "passeios" com capacidade
-- =====================================================================
create table if not exists activity_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text
);

create table if not exists trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number int not null,
  date date,
  title text,
  subtitle text,
  ports text[] default '{}',
  overnight text,
  dress_code text,
  note text,
  sort int default 0
);
create index if not exists idx_days_trip on trip_days(trip_id);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_id uuid references trip_days(id) on delete cascade,
  category_id uuid references activity_categories(id) on delete set null,
  title text not null,
  description text,
  location text,
  address text,
  lat double precision,
  lng double precision,
  start_time text,
  end_time text,
  duration text,
  dress_code text,
  capacity_total int,                 -- null = sem limite
  responsible text,
  hero_image text,
  booking_url text,
  qimo_select boolean default false,
  status activity_status default 'available',
  publish publish_status default 'draft',
  notes text,
  sort int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_activities_trip on activities(trip_id);
create index if not exists idx_activities_day on activities(day_id);

-- =====================================================================
-- RESERVAS (com controle de estoque / lista de espera)
-- =====================================================================
create table if not exists activity_reservations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  participant_id uuid references participants(id) on delete set null,
  family_id uuid references families(id) on delete set null,
  adults int not null default 1,
  children int not null default 0,
  seats int generated always as (adults + children) stored,
  status reservation_status not null default 'confirmed',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_res_activity on activity_reservations(activity_id);
create index if not exists idx_res_status on activity_reservations(status);

-- Disponibilidade em tempo real (view)
create or replace view activity_availability as
select
  a.id as activity_id,
  a.trip_id,
  a.title,
  a.capacity_total,
  coalesce(sum(r.seats) filter (where r.status in ('confirmed','pending')), 0)::int as reserved,
  coalesce(sum(r.seats) filter (where r.status = 'waitlist'), 0)::int as waitlisted,
  case when a.capacity_total is null then null
       else greatest(a.capacity_total - coalesce(sum(r.seats) filter (where r.status in ('confirmed','pending')), 0), 0)
  end::int as available
from activities a
left join activity_reservations r on r.activity_id = a.id
group by a.id;

-- RESERVA SEGURA (sem overbooking) — trava a atividade, calcula e decide status
create or replace function reserve_activity(
  p_activity uuid,
  p_participant uuid,
  p_family uuid,
  p_adults int default 1,
  p_children int default 0,
  p_notes text default null
) returns activity_reservations
language plpgsql security definer as $$
declare
  v_cap int;
  v_used int;
  v_seats int := p_adults + p_children;
  v_status reservation_status;
  v_row activity_reservations;
begin
  -- trava a linha da atividade para evitar corrida/overbooking
  select capacity_total into v_cap from activities where id = p_activity for update;
  if not found then raise exception 'Atividade inexistente'; end if;

  select coalesce(sum(seats),0) into v_used
    from activity_reservations
   where activity_id = p_activity and status in ('confirmed','pending');

  if v_cap is null or (v_used + v_seats) <= v_cap then
    v_status := 'confirmed';
  else
    v_status := 'waitlist';               -- capacidade cheia → lista de espera
  end if;

  insert into activity_reservations(activity_id, participant_id, family_id, adults, children, status, notes)
  values (p_activity, p_participant, p_family, p_adults, p_children, v_status, p_notes)
  returning * into v_row;

  perform refresh_activity_status(p_activity);
  return v_row;
end $$;

-- Atualiza o status da atividade (available/limited/sold_out) conforme ocupação
create or replace function refresh_activity_status(p_activity uuid)
returns void language plpgsql as $$
declare v_cap int; v_used int;
begin
  select capacity_total into v_cap from activities where id = p_activity;
  if v_cap is null then return; end if;
  select coalesce(sum(seats),0) into v_used
    from activity_reservations where activity_id = p_activity and status in ('confirmed','pending');
  update activities set status =
    case when v_used >= v_cap then 'sold_out'
         when v_used >= v_cap * 0.8 then 'limited'
         else 'available' end
  where id = p_activity and status <> 'hidden';
end $$;

-- Ao CANCELAR, promove a próxima reserva da lista de espera se couber
create or replace function promote_waitlist() returns trigger
language plpgsql as $$
declare v_cap int; v_used int; w record;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    select capacity_total into v_cap from activities where id = new.activity_id for update;
    if v_cap is not null then
      for w in
        select * from activity_reservations
         where activity_id = new.activity_id and status = 'waitlist'
         order by created_at asc
      loop
        select coalesce(sum(seats),0) into v_used
          from activity_reservations where activity_id = new.activity_id and status in ('confirmed','pending');
        exit when (v_used + w.seats) > v_cap;
        update activity_reservations set status = 'confirmed', updated_at = now() where id = w.id;
      end loop;
    end if;
    perform refresh_activity_status(new.activity_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_promote_waitlist on activity_reservations;
create trigger trg_promote_waitlist after update on activity_reservations
  for each row execute function promote_waitlist();

-- =====================================================================
-- CONTEÚDO (core + details jsonb para flexibilidade entre destinos)
-- =====================================================================
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text not null,                 -- 'winery'|'restaurant'|'hotel'|'experience'|'wine'|'gastronomy'|'shopping'
  slug text not null,
  name text not null,
  subtitle text,
  hero_image text,
  gallery text[] default '{}',
  address text,
  lat double precision,
  lng double precision,
  website text,
  booking_url text,
  instagram text,
  phone text,
  email text,
  qimo_select boolean default false,
  status publish_status default 'draft',
  details jsonb default '{}',         -- campos específicos (castas, chef, faixa de preço...)
  sort int default 0,
  updated_at timestamptz default now(),
  unique (trip_id, kind, slug)
);
create index if not exists idx_content_trip_kind on content_items(trip_id, kind);

-- =====================================================================
-- MÍDIA · DOCUMENTOS · LINKS · MAPA · CONCIERGE · NOTIFICAÇÕES
-- =====================================================================
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  url text not null,
  alt text,
  width int, height int, bytes int,
  used_in jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  category text,                       -- passaporte|seguro|passagem|voucher|qr|mapa|guia
  name text not null,
  file_url text not null,
  created_at timestamptz default now()
);

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  entity_kind text, entity_id uuid,
  kind text,                           -- booking|maps|site|instagram|whatsapp|phone|menu|email
  url text not null,
  status text default 'unchecked',     -- ok|broken|unchecked
  last_checked timestamptz
);

create table if not exists map_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  category text,
  lat double precision, lng double precision,
  icon text, description text
);

create table if not exists concierge_contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  label text not null,
  type text,                           -- whatsapp|call|emergency|maps|info|link
  value text,
  hint text, icon text, sort int default 0
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',            -- info|reminder|change|alert
  scheduled_at timestamptz,
  status text default 'draft',         -- draft|scheduled|sent
  created_at timestamptz default now()
);

-- =====================================================================
-- AUDITORIA (histórico + restauração de versões)
-- =====================================================================
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  trip_id uuid,
  user_id uuid,
  table_name text,
  record_id uuid,
  action text,                         -- insert|update|delete
  old_row jsonb,
  new_row jsonb,
  created_at timestamptz default now()
);

create or replace function log_audit() returns trigger
language plpgsql security definer as $$
declare v_trip uuid;
begin
  v_trip := coalesce((to_jsonb(new)->>'trip_id')::uuid, (to_jsonb(old)->>'trip_id')::uuid);
  insert into audit_logs(trip_id, user_id, table_name, record_id, action, old_row, new_row)
  values (
    v_trip, auth.uid(), tg_table_name,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    lower(tg_op),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- anexa auditoria às tabelas editáveis
do $$ declare t text;
begin
  foreach t in array array['trips','trip_days','activities','activity_reservations','participants','families','content_items','concierge_contacts','map_points','links','notifications']
  loop
    execute format('drop trigger if exists trg_audit on %I;', t);
    execute format('create trigger trg_audit after insert or update or delete on %I for each row execute function log_audit();', t);
  end loop;
end $$;

-- =====================================================================
-- RLS — leitura pública só do publicado; escrita apenas para equipe
-- =====================================================================
do $$
declare t text;
begin
  -- tabelas com conteúdo público (guia)
  foreach t in array array['trips','trip_days','activities','content_items','map_points','concierge_contacts']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists pub_read on %I;', t);
    execute format($f$create policy pub_read on %I for select using (
        coalesce((to_jsonb(%I.*)->>'status'),'published') in ('published') or is_staff()
      );$f$, t, t);
    execute format('drop policy if exists staff_all on %I;', t);
    execute format('create policy staff_all on %I for all to authenticated using (is_staff()) with check (is_staff());', t);
  end loop;

  -- tabelas internas (sem leitura pública)
  foreach t in array array['participants','families','activity_reservations','documents','media','links','notifications','audit_logs','profiles']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists staff_all on %I;', t);
    execute format('create policy staff_all on %I for all to authenticated using (is_staff()) with check (is_staff());', t);
  end loop;
end $$;

grant execute on function reserve_activity(uuid,uuid,uuid,int,int,text) to authenticated;
