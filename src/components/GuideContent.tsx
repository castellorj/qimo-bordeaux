"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  cities as fCities, wineries as fWineries, restaurants as fRestaurants,
  appellations as fWines, gastronomy as fGastro, experiences as fExp, shopping as fShop,
  conciergeContacts as fConcierge, itinerary as fItinerary, chefExperiences as fChef,
  infoFacts as fInfoFacts, etiquetteTips as fEtiquetteTips, conciergeSections as fConciergeSections,
  frenchPhrases as fFrenchPhrases, ship as fShip, documentCategories as fDocumentCategories,
} from "@/content";

const FILES: Record<string, any[]> = {
  city: fCities, winery: fWineries, restaurant: fRestaurants,
  wine: fWines, gastronomy: fGastro, experience: fExp, shopping: fShop,
  concierge: fConcierge, chef: fChef,
  info_fact: fInfoFacts, etiquette_tip: fEtiquetteTips,
  french_phrase: fFrenchPhrases,
  document_category: fDocumentCategories,
  concierge_section: fConciergeSections, // seções do acordeão do Concierge
  ship: [{ slug: "ss-bon-voyage", ...fShip }], // página do navio (editável no painel)
  day: fItinerary, // roteiro dia a dia (editável no painel; slug "dia-N")
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

type ByKind = Record<string, { slug: string; data: any; sort: number }[]>;
const Ctx = createContext<ByKind | null>(null);

// Contexto de edição inline (ativo quando o guia roda dentro do preview do painel).
const EditCtx = createContext<{ editMode: boolean }>({ editMode: false });
export function useEditMode() { return useContext(EditCtx).editMode; }

// Mescla conteúdo do banco (ao vivo) sobre os arquivos (base instantânea/offline).
function merged<T extends { slug: string }>(kind: string, db: ByKind | null): T[] {
  const file = (FILES[kind] || []) as T[];
  const rows = db?.[kind];
  if (!rows || !rows.length) return file;
  const bySlug = new Map<string, T>();
  file.forEach((f) => bySlug.set(f.slug, f));
  rows.forEach((r) => bySlug.set(r.slug, { ...(bySlug.get(r.slug) || {}), ...r.data } as T));
  const order = new Map(rows.map((r, i) => [r.slug, i]));
  return [...bySlug.values()].sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

async function fetchContent(): Promise<ByKind> {
  const r = await fetch(`${URL}/rest/v1/bordeaux_content?select=kind,slug,data,sort&published=eq.true&order=sort`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    cache: "no-store",
  });
  const rows: any[] = r.ok ? await r.json() : [];
  const byKind: ByKind = {};
  rows.forEach((row) => { (byKind[row.kind] ||= []).push(row); });
  return byKind;
}

export function GuideContentProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ByKind | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const refresh = () => fetchContent().then(setDb).catch(() => {});
    refresh();

    // Modo edição: ativado via query (?qimoedit=1) quando dentro do preview do painel.
    const inFrame = typeof window !== "undefined" && window.self !== window.top;
    const flagged = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qimoedit");
    if (inFrame && flagged) setEditMode(true);

    // Refresh ao vivo quando o painel avisa que salvou algo.
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === "qimo-admin" && e.data?.type === "qimo-refresh") refresh();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <Ctx.Provider value={db}>
      <EditCtx.Provider value={{ editMode }}>{children}</EditCtx.Provider>
    </Ctx.Provider>
  );
}

export function useGuideKind<T extends { slug: string }>(kind: string): T[] {
  return merged<T>(kind, useContext(Ctx));
}

// Lista 100% gerida pelo banco (add/editar/ocultar/excluir/ordenar no painel).
// Enquanto não houver nenhum registro no banco, usa o arquivo como semente.
// Ideal para listas onde a equipe controla tudo (ex.: Concierge).
function guideList<T>(kind: string, db: ByKind | null): T[] {
  const rows = db?.[kind];
  if (rows && rows.length) return rows.map((r) => r.data as T); // banco = fonte da verdade (publicados, ordenados)
  return (FILES[kind] || []) as T[];
}
export function useGuideList<T>(kind: string): T[] {
  return guideList<T>(kind, useContext(Ctx));
}
export function useGuideItem<T extends { slug: string }>(kind: string, slug: string): T | undefined {
  return merged<T>(kind, useContext(Ctx)).find((x) => x.slug === slug);
}
