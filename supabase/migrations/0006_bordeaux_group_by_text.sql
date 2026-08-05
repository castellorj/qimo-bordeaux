-- Agrupamento de "Família/grupo" por TEXTO (sobrenome) além de número.
-- Antes, bordeaux_guest_party agrupava só por dígitos: um valor como
-- "Maidantchik" (só letras) virava vazio e o par não aparecia na reserva.
-- Agora: se o valor tiver dígitos, agrupa pelos dígitos (compatível com o
-- que já existia); senão, agrupa pelo texto normalizado (minúsculo, sem
-- espaços extras). Assim "Maidantchik" nos dois passageiros os vincula.

create or replace function public.qimo_group_key(p_value text)
returns text
language sql
immutable
as $$
  select case
    when p_value is null or btrim(p_value) = '' then null
    when public.qimo_group_number(p_value) is not null then public.qimo_group_number(p_value)
    else lower(regexp_replace(btrim(p_value), '\s+', ' ', 'g'))
  end;
$$;
grant execute on function public.qimo_group_key(text) to anon, authenticated;

create or replace function public.bordeaux_guest_party(p_phone text)
returns table (
  id uuid,
  full_name text,
  phone text,
  family text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner record;
  v_group text;
begin
  select p.id, p.full_name, p.phone, p.family
    into v_owner
  from public.bordeaux_participants p
  where public.qimo_phone_matches(p.phone, p_phone)
  order by p.full_name
  limit 1;

  if not found then
    return;
  end if;

  v_group := public.qimo_group_key(v_owner.family);

  if v_group is null then
    return query
      select p.id, p.full_name, p.phone, p.family
      from public.bordeaux_participants p
      where p.id = v_owner.id;
    return;
  end if;

  return query
    select p.id, p.full_name, p.phone, p.family
    from public.bordeaux_participants p
    where public.qimo_group_key(p.family) = v_group
    order by
      case when p.id = v_owner.id then 0 else 1 end,
      p.full_name;
end;
$$;
grant execute on function public.bordeaux_guest_party(text) to anon, authenticated;
