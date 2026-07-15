"use client";

import { supabase } from "./client";
import { normalizePhone, phoneVariants } from "@/lib/phone";

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

function groupNumber(value?: string | null) {
  return (value || "").match(/\d+/)?.[0] || "";
}

function groupVariants(value?: string | null) {
  const family = (value || "").trim();
  const number = groupNumber(family);
  const padded = number ? number.padStart(3, "0") : "";
  return Array.from(new Set([
    family,
    number,
    padded,
    number ? `Grupo Bordeaux ${number}` : "",
    padded ? `Grupo Bordeaux ${padded}` : "",
  ].filter(Boolean)));
}

function sameGroup(a?: string | null, b?: string | null) {
  const na = groupNumber(a);
  const nb = groupNumber(b);
  if (na && nb) return Number(na) === Number(nb);
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}

function mapPassenger(p: any): GuestPassenger {
  return {
    id: p.id,
    fullName: p.full_name ?? p.fullName ?? "",
    phone: p.phone ?? null,
    family: p.family ?? null,
  };
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
  const { data, error } = await supabase().rpc("bordeaux_guest_my", { p_phone: normalizePhone(phone) });
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
    p_guest_phone: normalizePhone(phone),
    p_party: party,
    p_notes: null,
  });
}

export async function guestCancel(activityId: string, phone: string) {
  return supabase().rpc("bordeaux_guest_cancel", { p_activity: activityId, p_phone: normalizePhone(phone) });
}

export async function fetchGuestParty(phone: string): Promise<GuestPassenger[]> {
  const clean = normalizePhone(phone);
  if (!clean) return [];
  const sb = supabase();

  const { data: rpcParty } = await sb.rpc("bordeaux_guest_party", { p_phone: clean });
  if (Array.isArray(rpcParty) && rpcParty.length) {
    return rpcParty.map(mapPassenger).filter((p) => p.fullName);
  }

  const { data: owners } = await sb
    .from("bordeaux_participants")
    .select("id,full_name,phone,family")
    .in("phone", phoneVariants(clean))
    .limit(1);
  const owner = owners?.[0];

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
    .in("family", groupVariants(owner.family))
    .order("full_name");

  let party = (data?.length ? data : [owner]) as any[];
  if (party.length <= 1) {
    const { data: all } = await sb
      .from("bordeaux_participants")
      .select("id,full_name,phone,family")
      .not("family", "is", null)
      .order("full_name");
    const byGroup = (all || []).filter((p: any) => sameGroup(p.family, owner.family));
    if (byGroup.length) party = byGroup;
  }

  return party.map(mapPassenger);
}
