-- Amplia o reconhecimento de telefone para numeros internacionais,
-- especialmente celulares franceses (+33 6/7..., 06/07... ou 6/7...).

create or replace function public.qimo_phone_matches(p_saved text, p_input text)
returns boolean
language plpgsql
immutable
as $$
declare
  s text := public.qimo_phone_digits(p_saved);
  i text := public.qimo_phone_digits(p_input);
  s_br text := public.qimo_normalize_br_phone(p_saved);
  i_br text := public.qimo_normalize_br_phone(p_input);
  s_fr text := s;
  i_fr text := i;
begin
  if s = '' or i = '' then
    return false;
  end if;

  if s = i or s_br = i_br then
    return true;
  end if;

  if left(s_fr, 2) = '33' then
    s_fr := substring(s_fr from 3);
  end if;
  if left(i_fr, 2) = '33' then
    i_fr := substring(i_fr from 3);
  end if;
  if left(s_fr, 1) = '0' then
    s_fr := substring(s_fr from 2);
  end if;
  if left(i_fr, 1) = '0' then
    i_fr := substring(i_fr from 2);
  end if;

  return s_fr = i_fr;
end;
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

grant execute on function public.qimo_phone_matches(text, text) to anon, authenticated;
grant execute on function public.bordeaux_guest_party(text) to anon, authenticated;
