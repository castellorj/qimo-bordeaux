-- Reserva do hóspede: trava de conflito de horário.
--
-- Regra: ao CRIAR uma nova reserva para um passeio, se qualquer pessoa do grupo
-- da reserva (party) já tiver reserva ativa em OUTRO passeio no MESMO dia e
-- horário, a reserva é recusada (a pessoa tem que escolher apenas uma opção).
-- No app, antes de chegar aqui, mostramos o aviso "Conflito de horário" com a
-- opção de Substituir (cancela a anterior) ou deixar como está. Esta função é a
-- rede de segurança no servidor (cobre inclusive conflitos criados por outro
-- membro do grupo). Edições da própria reserva (mesmo passeio) não são afetadas.
--
-- Obs.: unaccent vive no schema `extensions`; por isso é qualificado abaixo
-- (o search_path da função é apenas 'public').

CREATE OR REPLACE FUNCTION public.bordeaux_guest_reserve(p_activity uuid, p_guest_name text, p_guest_phone text, p_party jsonb, p_notes text DEFAULT NULL::text)
 RETURNS bordeaux_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_cap int; v_used int; v_seats int;
        v_existing bordeaux_reservations; v_status text; v_row bordeaux_reservations;
        v_day int; v_time text; v_conflict text;
begin
  if p_guest_phone is null or length(btrim(p_guest_phone))=0 then
    raise exception 'Telefone do responsavel e obrigatorio';
  end if;
  v_seats := greatest(1, coalesce(jsonb_array_length(p_party),1));
  select capacity_total, day_number, start_time
    into v_cap, v_day, v_time
    from bordeaux_activities where id=p_activity for update;
  if not found then raise exception 'Passeio inexistente'; end if;

  select * into v_existing from bordeaux_reservations
    where activity_id=p_activity and guest_phone=p_guest_phone and status<>'cancelled'
    order by created_at desc limit 1;

  -- Rede de seguranca: conflito de horario entre pessoas do grupo.
  if v_existing.id is null and v_day is not null and v_time is not null and btrim(v_time) <> '' then
    select a.title into v_conflict
    from bordeaux_reservations r
    join bordeaux_activities a on a.id = r.activity_id
    where r.status <> 'cancelled'
      and r.activity_id <> p_activity
      and a.day_number = v_day
      and a.start_time = v_time
      and exists (
        select 1
        from jsonb_array_elements_text(r.party) ep(n)
        join jsonb_array_elements_text(p_party) np(n2)
          on btrim(regexp_replace(lower(extensions.unaccent(ep.n)), '\s+', ' ', 'g'))
           = btrim(regexp_replace(lower(extensions.unaccent(np.n2)), '\s+', ' ', 'g'))
      )
    order by a.title
    limit 1;
    if v_conflict is not null then
      raise exception 'Conflito de horario: voce ja tem "%" neste mesmo horario. Cancele a outra opcao para escolher esta.', v_conflict
        using errcode = 'P0001';
    end if;
  end if;

  select coalesce(sum(seats),0) into v_used from bordeaux_reservations
    where activity_id=p_activity and status='confirmed'
      and (v_existing.id is null or id<>v_existing.id);

  if v_cap is null or (v_used + v_seats) <= v_cap then v_status:='confirmed';
  else v_status:='waitlist'; end if;

  if v_existing.id is not null then
    update bordeaux_reservations set
      guest_name=p_guest_name, party=p_party, adults=v_seats, children=0,
      status=v_status, source='guest', notes=coalesce(p_notes,notes), updated_at=now()
    where id=v_existing.id returning * into v_row;
  else
    insert into bordeaux_reservations(activity_id, guest_name, guest_phone, party, adults, children, status, source, notes)
    values (p_activity, p_guest_name, p_guest_phone, p_party, v_seats, 0, v_status, 'guest', p_notes)
    returning * into v_row;
  end if;
  perform bordeaux_refresh_status(p_activity);
  return v_row;
end $function$;
