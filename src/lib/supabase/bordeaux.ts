"use client";

import { supabase } from "./client";

export interface BxActivity {
  id: string;
  day_number: number | null;
  date: string | null;
  title: string;
  location: string | null;
  start_time: string | null;
  capacity_total: number | null;
  status: string;
  qimo_select: boolean;
  sort: number;
}
export interface BxAvailability {
  activity_id: string;
  reserved: number;
  waitlisted: number;
  available: number | null;
}
export type BxActivityFull = BxActivity & { reserved: number; waitlisted: number; available: number | null };

export interface BxParticipant {
  id: string;
  full_name: string;
  family: string | null;
  phone: string | null;
  email: string | null;
  companions: number;
  dietary: string | null;
  notes: string | null;
}

export interface BxReservation {
  id: string;
  activity_id: string;
  participant_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  party: string[] | null; // nomes (responsável + acompanhantes), quando a reserva vem do guia
  source: string; // 'guest' (reservou pelo app) | 'admin' (equipe cadastrou)
  adults: number;
  children: number;
  seats: number;
  status: string;
  notes: string | null;
  created_at: string;
  activity?: { title: string; day_number: number | null; start_time: string | null };
  participant?: { full_name: string } | null;
}

export async function fetchActivities(): Promise<BxActivityFull[]> {
  const sb = supabase();
  const [{ data: acts }, { data: avail }] = await Promise.all([
    sb.from("bordeaux_activities").select("*").order("sort"),
    sb.from("bordeaux_activity_availability").select("*"),
  ]);
  const map = new Map<string, BxAvailability>();
  (avail || []).forEach((a: any) => map.set(a.activity_id, a));
  return (acts || []).map((a: any) => {
    const av = map.get(a.id);
    return { ...a, reserved: av?.reserved ?? 0, waitlisted: av?.waitlisted ?? 0, available: av?.available ?? a.capacity_total };
  });
}

export async function updateCapacity(id: string, capacity_total: number) {
  return supabase().from("bordeaux_activities").update({ capacity_total }).eq("id", id);
}
export async function setHidden(id: string, hidden: boolean) {
  return supabase().from("bordeaux_activities").update({ status: hidden ? "hidden" : "available" }).eq("id", id);
}

export async function fetchParticipants(): Promise<BxParticipant[]> {
  const { data } = await supabase().from("bordeaux_participants").select("*").order("full_name");
  return (data as BxParticipant[]) || [];
}
export async function addParticipant(p: Partial<BxParticipant>) {
  return supabase().from("bordeaux_participants").insert(p).select().single();
}
export async function upsertParticipantByPhone(p: Partial<BxParticipant>) {
  const phone = p.phone?.trim();
  if (!phone) return addParticipant(p);
  const sb = supabase();
  const { data: existing } = await sb.from("bordeaux_participants").select("id").eq("phone", phone).maybeSingle();
  if (existing?.id) {
    return sb.from("bordeaux_participants").update(p).eq("id", existing.id).select().single();
  }
  return sb.from("bordeaux_participants").insert(p).select().single();
}
export async function deleteParticipant(id: string) {
  return supabase().from("bordeaux_participants").delete().eq("id", id);
}

export async function fetchReservations(): Promise<BxReservation[]> {
  const { data } = await supabase()
    .from("bordeaux_reservations")
    .select("*, activity:bordeaux_activities(title,day_number,start_time), participant:bordeaux_participants(full_name)")
    .order("created_at", { ascending: false });
  return (data as BxReservation[]) || [];
}
export async function reserve(
  activityId: string,
  participantId: string | null,
  guestName: string | null,
  adults: number,
  children: number,
  notes: string | null
) {
  return supabase().rpc("bordeaux_reserve", {
    p_activity: activityId,
    p_participant: participantId,
    p_guest: guestName,
    p_adults: adults,
    p_children: children,
    p_notes: notes,
  });
}
export async function cancelReservation(id: string) {
  return supabase().from("bordeaux_reservations").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id);
}
