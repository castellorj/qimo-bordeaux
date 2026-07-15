-- Reconhecimento de passageiros e pares pelo telefone pessoal.
-- Aceita telefone com DDD, com/sem +55 e com caracteres como espacos ou tracos.

create or replace function public.qimo_phone_digits(p_value text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_value, ''), '\D', '', 'g');
$$;

create or replace function public.qimo_normalize_br_phone(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_digits text := public.qimo_phone_digits(p_value);
begin
  if length(v_digits) in (12, 13) and left(v_digits, 2) = '55' then
    return substring(v_digits from 3);
  end if;
  return v_digits;
end;
$$;

create or replace function public.qimo_group_number(p_value text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(p_value, ''), '\D', '', 'g'), '');
$$;

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
  v_phone text := public.qimo_normalize_br_phone(p_phone);
  v_owner record;
  v_group text;
begin
  select p.id, p.full_name, p.phone, p.family
    into v_owner
  from public.bordeaux_participants p
  where public.qimo_normalize_br_phone(p.phone) = v_phone
  order by p.full_name
  limit 1;

  if not found then
    return;
  end if;

  v_group := public.qimo_group_number(v_owner.family);

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
    where public.qimo_group_number(p.family) = v_group
    order by
      case when p.id = v_owner.id then 0 else 1 end,
      p.full_name;
end;
$$;

grant execute on function public.bordeaux_guest_party(text) to anon, authenticated;
