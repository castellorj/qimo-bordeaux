// Leitura de conteúdo do Supabase (bordeaux_content) com fallback para os
// arquivos estáticos. Usada em BUILD TIME (server components do export) — se o
// banco estiver vazio/indisponível, o guia usa o conteúdo dos arquivos.
import {
  cities as fileCities,
  wineries as fileWineries,
  restaurants as fileRestaurants,
  appellations as fileWines,
  gastronomy as fileGastronomy,
  experiences as fileExperiences,
  shopping as fileShopping,
} from "@/content";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

type Row = { slug: string; data: any; sort: number };

async function fetchKind(kind: string): Promise<Row[]> {
  try {
    const res = await fetch(
      `${URL}/rest/v1/bordeaux_content?select=slug,data,sort&kind=eq.${kind}&published=eq.true&order=sort`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    return (await res.json()) as Row[];
  } catch {
    return [];
  }
}

// Mescla: itens do banco sobrepõem os do arquivo (por slug); banco pode adicionar novos.
function merge<T extends { slug: string }>(fileArr: T[], rows: Row[]): T[] {
  if (!rows.length) return fileArr;
  const bySlug = new Map<string, T>();
  fileArr.forEach((f) => bySlug.set(f.slug, f));
  rows.forEach((r) => bySlug.set(r.slug, { ...(bySlug.get(r.slug) || {}), ...r.data } as T));
  // ordena pela ordem do banco quando existir, senão mantém arquivo
  const order = new Map(rows.map((r, i) => [r.slug, i]));
  return [...bySlug.values()].sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

export async function getCities() { return merge(fileCities, await fetchKind("city")); }
export async function getWineries() { return merge(fileWineries, await fetchKind("winery")); }
export async function getRestaurants() { return merge(fileRestaurants, await fetchKind("restaurant")); }
export async function getWines() { return merge(fileWines, await fetchKind("wine")); }
export async function getGastronomy() { return merge(fileGastronomy, await fetchKind("gastronomy")); }
export async function getExperiences() { return merge(fileExperiences, await fetchKind("experience")); }
export async function getShopping() { return merge(fileShopping, await fetchKind("shopping")); }

export async function getCity(slug: string) { return (await getCities()).find((c) => c.slug === slug); }
export async function getWinery(slug: string) { return (await getWineries()).find((w) => w.slug === slug); }
export async function getWine(slug: string) { return (await getWines()).find((w) => w.slug === slug); }
