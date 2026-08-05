"use client";

import { supabase } from "./client";
import { loadGuestRaw, loadDevice } from "@/lib/guestPersist";

const VISIT_FLAG = "qimo:visit-logged";     // 1 registro por sessão do navegador

// Registra um acesso ao guia (uma vez por sessão). Silencioso: se a migration
// ainda não existir ou falhar a rede, não quebra nada.
// Lê o hóspede/dispositivo pelo MESMO guestPersist do login (chaves :v3 +
// backup em cookie) — senão o registro fica em branco e ninguém aparece.
export async function logVisit(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(VISIT_FLAG)) return;
    const device = loadDevice() || "";
    let name = "";
    let phone = "";
    try {
      const raw = loadGuestRaw();
      if (raw) { const g = JSON.parse(raw); name = g?.name || ""; phone = g?.phone || ""; }
    } catch {}
    if (!device && !phone) return; // ainda sem identidade (antes do portão)
    // marca antes do await para evitar corrida (duplo registro na mesma sessão)
    sessionStorage.setItem(VISIT_FLAG, "1");
    const { error } = await supabase().rpc("bordeaux_log_visit", {
      p_device: device,
      p_name: name,
      p_phone: phone,
    });
    if (error) sessionStorage.removeItem(VISIT_FLAG); // deixa tentar de novo se falhou
  } catch {}
}

export interface VisitSummary {
  name: string;
  phone: string;
  visits: number;
  first_seen: string;
  last_seen: string;
}

export interface VisitTotals {
  total_visits: number;
  unique_guests: number;
  visits_7d: number;
}

export async function fetchVisitsSummary(): Promise<VisitSummary[]> {
  const { data } = await supabase().rpc("bordeaux_visits_summary");
  return (data as VisitSummary[]) || [];
}

export async function fetchVisitsTotals(): Promise<VisitTotals> {
  const { data } = await supabase().rpc("bordeaux_visits_totals");
  const row = (data as VisitTotals[])?.[0];
  return row || { total_visits: 0, unique_guests: 0, visits_7d: 0 };
}

export interface VisitRow { name: string; phone: string; created_at: string }

// Lista crua de acessos (para montar a quebra por dia no painel). Silencioso se
// a migration 0008 ainda não existir.
export async function fetchVisitsAll(days = 30): Promise<VisitRow[]> {
  const { data } = await supabase().rpc("bordeaux_visits_all", { p_days: days });
  return (data as VisitRow[]) || [];
}
