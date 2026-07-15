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

type Row = { slug: string; data: any; sort: number; published?: boolean };
const PHOTO_FIELDS = new Set(["heroImage", "image", "photo", "gallery"]);

function isOldLocalPhoto(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith("/photos/");
}

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

function removeOldPhotoFields<T>(value: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const entries = Object.entries(value).filter(([key, item]) => {
    if (!PHOTO_FIELDS.has(key)) return true;
    if (isOldLocalPhoto(item)) return false;
    if (Array.isArray(item) && item.every(isOldLocalPhoto)) return false;
    return true;
  });
  return Object.fromEntries(entries) as T;
}

function isGuideItemHidden(data: any) {
  const status = String(data?.adminStatus || data?.status || "").trim().toLowerCase();
  return status === "oculto" || status === "hidden" || status === "encerrado";
}

async function fetchKind(kind: string): Promise<Row[]> {
  try {
    const res = await fetch(
      `${URL}/rest/v1/bordeaux_content?select=slug,data,sort,published&kind=eq.${kind}&order=sort`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    return (await res.json()) as Row[];
  } catch {
    return [];
  }
}

// Mescla: itens do banco sobrepõem os do arquivo (por slug); banco pode adicionar novos.
function merge<T extends { slug: string }>(fileArr: T[], rows: Row[], kind?: string): T[] {
  if (!rows.length) return fileArr;
  const bySlug = new Map<string, T>();
  fileArr.forEach((f) => bySlug.set(f.slug, f));
  if (kind === "winery") {
    return rows
      .filter((r) => r.published !== false)
      .map((r) => removeOldLocalPhotos({ ...(bySlug.get(r.slug) || {}), ...removeOldPhotoFields(r.data) } as T))
      .filter((item) => !isGuideItemHidden(item));
  }
  rows.forEach((r) => {
    if (r.published === false) {
      bySlug.delete(r.slug);
      return;
    }
    const item = removeOldLocalPhotos({ ...(bySlug.get(r.slug) || {}), ...removeOldPhotoFields(r.data) } as T);
    if (isGuideItemHidden(item)) {
      bySlug.delete(r.slug);
      return;
    }
    bySlug.set(r.slug, item);
  });
  // ordena pela ordem do banco quando existir, senão mantém arquivo
  const order = new Map(rows.filter((r) => r.published !== false).map((r, i) => [r.slug, i]));
  return [...bySlug.values()]
    .filter((item) => !isGuideItemHidden(item))
    .sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

export async function getCities() { return merge(fileCities, await fetchKind("city"), "city"); }
export async function getWineries() { return merge(fileWineries, await fetchKind("winery"), "winery"); }
export async function getRestaurants() { return merge(fileRestaurants, await fetchKind("restaurant"), "restaurant"); }
export async function getWines() { return merge(fileWines, await fetchKind("wine"), "wine"); }
export async function getGastronomy() { return merge(fileGastronomy, await fetchKind("gastronomy"), "gastronomy"); }
export async function getExperiences() { return merge(fileExperiences, await fetchKind("experience"), "experience"); }
export async function getShopping() { return merge(fileShopping, await fetchKind("shopping"), "shopping"); }

export async function getCity(slug: string) { return (await getCities()).find((c) => c.slug === slug); }
export async function getWinery(slug: string) { return (await getWineries()).find((w) => w.slug === slug); }
export async function getWine(slug: string) { return (await getWines()).find((w) => w.slug === slug); }
export async function getRestaurant(slug: string) { return (await getRestaurants()).find((r) => r.slug === slug); }
export async function getExperience(slug: string) { return (await getExperiences()).find((e) => e.slug === slug); }
export async function getGastronomyItem(slug: string) { return (await getGastronomy()).find((g) => g.slug === slug); }
export async function getShoppingItem(slug: string) { return (await getShopping()).find((s) => s.slug === slug); }
