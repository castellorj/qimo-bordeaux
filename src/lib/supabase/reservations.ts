"use client";

import { supabase } from "./client";

// Passeio reservável (vem do RPC bordeaux_reservable)
export interface Reservable {
  activityId: string;
  contentKey: string | null; // chave estável da atividade no conteúdo (ex.: "d2-oysters")
  dayNumber: number | null;
  startTime: string | null;
  title: string;
  capacityTotal: number | null;
  reserved: number;
  available: number | null; // null = sem limite
  qimoSelect: boolean;
  status: string;
}

// Reserva do próprio convidado (vem do RPC bordeaux_guest_my)
export interface MyReservation {
  reservationId: string;
  activityId: string;
  contentKey: string | null;
  dayNumber: number | null;
  startTime: string | null;
  title: string;
  party: string[]; // nomes (o responsável + acompanhantes)
  seats: number;
  status: string; // confirmed | waitlist
}

export interface GuestPassenger {
  id: string;
  fullName: string;
  phone: string | null;
  family: string | null;
}

export async function fetchReservable(): Promise<Reservable[]> {
  const { data, error } = await supabase().rpc("bordeaux_reservable");
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    activityId: r.activity_id,
    contentKey: r.content_key,
    dayNumber: r.day_number,
    startTime: r.start_time,
    title: r.title,
    capacityTotal: r.capacity_total,
    reserved: r.reserved,
    available: r.available,
    qimoSelect: r.qimo_select,
    status: r.status,
  }));
}

export async function fetchMyReservations(phone: string): Promise<MyReservation[]> {
  const { data, error } = await supabase().rpc("bordeaux_guest_my", { p_phone: phone });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    reservationId: r.reservation_id,
    activityId: r.activity_id,
    contentKey: r.content_key,
    dayNumber: r.day_number,
    startTime: r.start_time,
    title: r.title,
    party: Array.isArray(r.party) ? r.party : [],
    seats: r.seats,
    status: r.status,
  }));
}

export async function guestReserve(activityId: string, name: string, phone: string, party: string[]) {
  return supabase().rpc("bordeaux_guest_reserve", {
    p_activity: activityId,
    p_guest_name: name,
    p_guest_phone: phone,
    p_party: party,
    p_notes: null,
  });
}

export async function guestCancel(activityId: string, phone: string) {
  return supabase().rpc("bordeaux_guest_cancel", { p_activity: activityId, p_phone: phone });
}

export async function fetchGuestParty(phone: string): Promise<GuestPassenger[]> {
  const clean = phone.trim();
  if (!clean) return [];
  const sb = supabase();
  const { data: owner } = await sb
    .from("bordeaux_participants")
    .select("id,full_name,phone,family")
    .eq("phone", clean)
    .maybeSingle();

  if (!owner) return [];
  if (!owner.family) {
    return [{
      id: owner.id,
      fullName: owner.full_name,
      phone: owner.phone,
      family: owner.family,
    }];
  }

  const { data } = await sb
    .from("bordeaux_participants")
    .select("id,full_name,phone,family")
    .eq("family", owner.family)
    .order("full_name");

  return ((data?.length ? data : [owner]) as any[]).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    phone: p.phone,
    family: p.family,
  }));
}
