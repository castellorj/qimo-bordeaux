-- Reservas: expõe a fila de espera no RPC e preserva o estado "closed".
--
-- Contexto:
--  * bordeaux_reservable() passa a devolver `waitlisted` (lugares já na lista de
--    espera). O frontend trata a atividade como esgotada quando há fila, mesmo
--    que sobre 1 "vaga" solitária (ex.: só casais na espera, que não cabem em
--    1 lugar) — evita oferecer a vaga presa a novos hóspedes.
--  * status = 'closed' = reservas encerradas pela organização (Chef, Golf).
--    bordeaux_refresh_status() não deve reverter 'closed' (nem 'hidden') ao
--    recalcular a lotação.

-- 1) RPC de disponibilidade agora inclui a coluna `waitlisted`.
DROP FUNCTION IF EXISTS public.bordeaux_reservable();

CREATE OR REPLACE FUNCTION public.bordeaux_reservable()
 RETURNS TABLE(activity_id uuid, content_key text, day_number integer, date date, start_time text, title text, capacity_total integer, reserved integer, available integer, waitlisted integer, qimo_select boolean, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.id, a.content_key, a.day_number, a.date, a.start_time, a.title, a.capacity_total,
         coalesce(sum(r.seats) filter (where r.status='confirmed'),0)::int,
         case when a.capacity_total is null then null
              else greatest(a.capacity_total - coalesce(sum(r.seats) filter (where r.status='confirmed'),0),0) end::int,
         coalesce(sum(r.seats) filter (where r.status='waitlist'),0)::int,
         a.qimo_select, a.status
  from bordeaux_activities a
  left join bordeaux_reservations r on r.activity_id=a.id and r.status in ('confirmed','waitlist')
  where coalesce(a.status,'available') <> 'hidden'
  group by a.id;
$function$;

-- 2) Recalculo de lotação preserva os estados manuais 'hidden' e 'closed'.
CREATE OR REPLACE FUNCTION public.bordeaux_refresh_status(p_activity uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare v_cap int; v_used int;
begin
  select capacity_total into v_cap from bordeaux_activities where id = p_activity;
  if v_cap is null then return; end if;
  select coalesce(sum(seats),0) into v_used from bordeaux_reservations
   where activity_id = p_activity and status = 'confirmed';
  update bordeaux_activities set status =
    case when v_used >= v_cap then 'sold_out'
         when v_used >= v_cap * 0.8 then 'limited'
         else 'available' end
   where id = p_activity and status not in ('hidden','closed');
end $function$;
