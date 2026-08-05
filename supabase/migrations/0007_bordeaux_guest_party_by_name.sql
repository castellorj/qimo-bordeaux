-- Fallback por NOME para carregar o par/grupo quando o telefone do login não
-- bate com o do cadastro (ex.: número truncado na base de leads). Assim o par
-- aparece na reserva mesmo com telefone divergente entre qimo_guests e
-- bordeaux_participants.

-- Chave de nome normalizada (minúsculo, sem acento, espaços colapsados).
create or replace function public.qimo_name_key(p_value text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(regexp_replace(btrim(translate(coalesce(p_value, ''),
      'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÇçÑñ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNn')),
      '\s+', ' ', 'g')),
    '');
$$;
grant execute on function public.qimo_name_key(text) to anon, authenticated;

create or replace function public.bordeaux_guest_party_by_name(p_name text)
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
  v_key text := public.qimo_name_key(p_name);
  v_owner record;
  v_group text;
begin
  if v_key is null then
    return;
  end if;

  select p.id, p.full_name, p.phone, p.family
    into v_owner
  from public.bordeaux_participants p
  where public.qimo_name_key(p.full_name) = v_key
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
grant execute on function public.bordeaux_guest_party_by_name(text) to anon, authenticated;
