-- Lista crua de acessos (nome, telefone/device, data) para o painel montar a
-- quebra POR DIA. Só admin autenticado. Complementa a 0005.

create or replace function public.bordeaux_visits_all(p_days int default 30)
returns table (name text, phone text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(nullif(name, ''), '') as name,
    coalesce(phone, device) as phone,
    created_at
  from public.bordeaux_visits
  where created_at >= now() - make_interval(days => p_days)
  order by created_at desc;
$$;
grant execute on function public.bordeaux_visits_all(int) to authenticated;
