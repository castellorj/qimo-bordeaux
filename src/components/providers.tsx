"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Locale, DEFAULT_LOCALE, makeT, type UiOverrides } from "@/lib/i18n";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const SB_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

/* ---------------- Idioma (PT / EN / ES) ---------------- */
const LocaleCtx = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  cfg: (key: string) => string | undefined;
}>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: (k) => k, cfg: () => undefined });

/* ---------------- Favoritos (offline, localStorage) ---------------- */
const FavCtx = createContext<{
  favs: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}>({ favs: [], has: () => false, toggle: () => {}, count: 0 });

const FAV_KEY = "qimo:favs";
const LOCALE_KEY = "qimo:locale";

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [favs, setFavs] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<UiOverrides>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Render base sempre em PT; a tradução PT→EN/ES é feita pelo Google Translate.
    try {
      const f = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      if (Array.isArray(f)) setFavs(f);
    } catch {}
    setReady(true);
    // Rótulos de botões/menus editados no painel (aplicados sem rebuild)
    fetch(`${SB_URL}/rest/v1/bordeaux_settings?select=key,pt,en,es`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        const m: UiOverrides = {};
        rows.forEach((r) => (m[r.key] = { pt: r.pt, en: r.en, es: r.es }));
        setOverrides(m);
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
      document.documentElement.lang = l === "pt" ? "pt-BR" : l;
    } catch {}
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const has = useCallback((id: string) => favs.includes(id), [favs]);
  const t = makeT(locale, overrides);
  const cfg = useCallback((key: string) => overrides[key]?.pt, [overrides]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t, cfg }}>
      <FavCtx.Provider value={{ favs, has, toggle: toggleFav, count: favs.length }}>
        <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
      </FavCtx.Provider>
    </LocaleCtx.Provider>
  );
}

export const useLocale = () => useContext(LocaleCtx);
export const useFavorites = () => useContext(FavCtx);
