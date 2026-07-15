"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  cities as fCities, wineries as fWineries, restaurants as fRestaurants,
  appellations as fWines, gastronomy as fGastro, experiences as fExp, shopping as fShop,
  conciergeContacts as fConcierge, itinerary as fItinerary, chefExperiences as fChef,
  infoFacts as fInfoFacts, etiquetteTips as fEtiquetteTips, conciergeSections as fConciergeSections,
  frenchPhrases as fFrenchPhrases, ship as fShip, documentCategories as fDocumentCategories,
  partnerOffers as fPartnerOffers,
} from "@/content";

const FILES: Record<string, any[]> = {
  city: fCities, winery: fWineries, restaurant: fRestaurants,
  wine: fWines, gastronomy: fGastro, experience: fExp, shopping: fShop,
  concierge: fConcierge, chef: fChef,
  info_fact: fInfoFacts, etiquette_tip: fEtiquetteTips,
  french_phrase: fFrenchPhrases,
  document_category: fDocumentCategories,
  partner_offer: fPartnerOffers,
  concierge_section: fConciergeSections, // seções do acordeão do Concierge
  ship: [{ slug: "ss-bon-voyage", ...fShip }], // página do navio (editável no painel)
  day: fItinerary, // roteiro dia a dia (editável no painel; slug "dia-N")
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

type ByKind = Record<string, { slug: string; data: any; sort: number; published?: boolean }[]>;
type ContentState = ByKind | null | undefined;
const Ctx = createContext<ContentState>(undefined);
const CONTENT_CACHE_KEY = "qimo:content-cache:v3";
const CONTENT_CACHE_MAX_AGE = 5 * 60 * 1000;

// Contexto de edição inline (ativo quando o guia roda dentro do preview do painel).
const EditCtx = createContext<{ editMode: boolean }>({ editMode: false });
export function useEditMode() { return useContext(EditCtx).editMode; }

function isOldLocalPhoto(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith("/photos/");
}

const PHOTO_FIELDS = new Set(["heroImage", "image", "photo", "gallery"]);

function removeOldLocalPhotos<T>(value: T): T {
  if (isOldLocalPhoto(value)) return "" as T;
  if (Array.isArray(value)) {
    return value.map((item) => removeOldLocalPhotos(item)).filter((item) => item !== "") as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).flatMap(([key, item]) => {
      const cleaned = removeOldLocalPhotos(item);
      const shouldDropPhotoField =
        PHOTO_FIELDS.has(key) &&
        (cleaned === "" || (Array.isArray(cleaned) && cleaned.length === 0));
      return shouldDropPhotoField ? [] : [[key, cleaned]];
    });
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function readContentCache(): ByKind | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const raw = sessionStorage.getItem(CONTENT_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return undefined;
    if ("data" in parsed && "ts" in parsed) {
      return Date.now() - Number(parsed.ts) < CONTENT_CACHE_MAX_AGE ? parsed.data : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function writeContentCache(db: ByKind) {
  try {
    const raw = JSON.stringify({ ts: Date.now(), data: db });
    sessionStorage.setItem(CONTENT_CACHE_KEY, raw);
    localStorage.removeItem(CONTENT_CACHE_KEY);
  } catch {}
}

function mergeActivitiesById(fileActivities: any[] = [], dbActivities: any[] = []) {
  const fileById = new Map<string, any>();
  fileActivities.forEach((activity) => {
    if (activity?.id) fileById.set(activity.id, activity);
  });
  return dbActivities.map((activity) => {
    const base = fileById.get(activity?.id) || {};
    return removeOldLocalPhotos({ ...base, ...activity });
  });
}

function mergeDayRows<T>(db: ContentState): T[] {
  const file = (FILES.day || []) as any[];
  if (db === undefined) return [];
  const rows = db?.day;
  if (!rows || !rows.length) return removeOldLocalPhotos(file) as T[];
  const fileBySlug = new Map(file.map((day) => [day.slug, day]));
  return rows.map((row) => {
    const base = fileBySlug.get(row.slug) || {};
    const data = { ...base, ...row.data };
    if (Array.isArray(base.activities) && Array.isArray(row.data?.activities)) {
      data.activities = mergeActivitiesById(base.activities, row.data.activities);
    }
    return removeOldLocalPhotos(data) as T;
  });
}

// Mescla conteúdo do banco (ao vivo) sobre os arquivos (base instantânea/offline).
function merged<T extends { slug: string }>(kind: string, db: ContentState): T[] {
  const file = (FILES[kind] || []) as T[];
  if (db === undefined) return [];
  const rows = db?.[kind];
  if (!rows || !rows.length) return removeOldLocalPhotos(file);
  const bySlug = new Map<string, T>();
  file.forEach((f) => bySlug.set(f.slug, f));
  rows.forEach((r) => {
    if (r.published === false) {
      bySlug.delete(r.slug);
      return;
    }
    bySlug.set(r.slug, removeOldLocalPhotos({ ...(bySlug.get(r.slug) || {}), ...r.data } as T));
  });
  const order = new Map(rows.filter((r) => r.published !== false).map((r, i) => [r.slug, i]));
  return [...bySlug.values()].sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

async function fetchContent(): Promise<ByKind> {
  const r = await fetch(`${URL}/rest/v1/bordeaux_content?select=kind,slug,data,sort,published&order=sort`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    cache: "no-store",
  });
  const rows: any[] = r.ok ? await r.json() : [];
  const byKind: ByKind = {};
  rows.forEach((row) => {
    (byKind[row.kind] ||= []).push({ ...row, data: removeOldLocalPhotos(row.data) });
  });
  return byKind;
}

export function GuideContentProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ContentState>(() => readContentCache());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const refresh = () => fetchContent().then((next) => {
      setDb(next);
      writeContentCache(next);
    }).catch(() => setDb((current) => current === undefined ? null : current));
    refresh();

    // Modo edição: ativado via query (?qimoedit=1) quando dentro do preview do painel.
    const inFrame = typeof window !== "undefined" && window.self !== window.top;
    const flagged = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qimoedit");
    if (inFrame && flagged) setEditMode(true);

    // Refresh ao vivo quando o painel avisa que salvou algo.
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === "qimo-admin" && e.data?.type === "qimo-refresh") refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("message", onMsg);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
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
function guideList<T>(kind: string, db: ContentState): T[] {
  if (db === undefined) return [];
  if (kind === "day") return mergeDayRows<T>(db);
  const rows = db?.[kind];
  if (rows && rows.length) return rows.filter((r) => r.published !== false).map((r) => removeOldLocalPhotos(r.data as T)); // banco = fonte da verdade (publicados, ordenados)
  return removeOldLocalPhotos((FILES[kind] || []) as T[]);
}
export function useGuideList<T>(kind: string): T[] {
  return guideList<T>(kind, useContext(Ctx));
}
export function useGuideItem<T extends { slug: string }>(kind: string, slug: string): T | undefined {
  return merged<T>(kind, useContext(Ctx)).find((x) => x.slug === slug);
}
export function useGuideLoading() {
  return useContext(Ctx) === undefined;
}
