"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Locale, DEFAULT_LOCALE, makeT } from "@/lib/i18n";

/* ---------------- Idioma (PT / EN / ES) ---------------- */
const LocaleCtx = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: (k) => k });

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Render base sempre em PT; a tradução PT→EN/ES é feita pelo Google Translate.
    try {
      const f = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      if (Array.isArray(f)) setFavs(f);
    } catch {}
    setReady(true);
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
  const t = makeT(locale);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t }}>
      <FavCtx.Provider value={{ favs, has, toggle: toggleFav, count: favs.length }}>
        <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
      </FavCtx.Provider>
    </LocaleCtx.Provider>
  );
}

export const useLocale = () => useContext(LocaleCtx);
export const useFavorites = () => useContext(FavCtx);
