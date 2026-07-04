"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  cities as fCities, wineries as fWineries, restaurants as fRestaurants,
  appellations as fWines, gastronomy as fGastro, experiences as fExp, shopping as fShop,
} from "@/content";

const FILES: Record<string, any[]> = {
  city: fCities, winery: fWineries, restaurant: fRestaurants,
  wine: fWines, gastronomy: fGastro, experience: fExp, shopping: fShop,
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

type ByKind = Record<string, { slug: string; data: any; sort: number }[]>;
const Ctx = createContext<ByKind | null>(null);

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

export function GuideContentProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ByKind | null>(null);
  useEffect(() => {
    fetch(`${URL}/rest/v1/bordeaux_content?select=kind,slug,data,sort&published=eq.true&order=sort`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        const byKind: ByKind = {};
        rows.forEach((r) => { (byKind[r.kind] ||= []).push(r); });
        setDb(byKind);
      })
      .catch(() => {});
  }, []);
  return <Ctx.Provider value={db}>{children}</Ctx.Provider>;
}

export function useGuideKind<T extends { slug: string }>(kind: string): T[] {
  return merged<T>(kind, useContext(Ctx));
}
export function useGuideItem<T extends { slug: string }>(kind: string, slug: string): T | undefined {
  return merged<T>(kind, useContext(Ctx)).find((x) => x.slug === slug);
}
