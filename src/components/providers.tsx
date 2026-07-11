"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { type Locale, DEFAULT_LOCALE, makeT, type UiOverrides } from "@/lib/i18n";
import {
  fetchReservable, fetchMyReservations, guestReserve, guestCancel,
  type Reservable, type MyReservation,
} from "@/lib/supabase/reservations";

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

/* ---------------- Reservas (atividades, via Supabase) ---------------- */
export interface Guest { name?: string | null; phone?: string | null }

interface ReservationsValue {
  ready: boolean;
  guest: Guest | null;
  setGuestPhone: (phone: string) => void;
  reservableByKey: Map<string, Reservable>;
  mine: Map<string, MyReservation>; // por activityId
  count: number;
  refresh: () => Promise<void>;
  reserve: (activityId: string, party: string[]) => Promise<{ ok: boolean; status?: string; error?: string }>;
  cancel: (activityId: string) => Promise<void>;
}
const ReservationsCtx = createContext<ReservationsValue>({
  ready: false, guest: null, setGuestPhone: () => {}, reservableByKey: new Map(), mine: new Map(),
  count: 0, refresh: async () => {}, reserve: async () => ({ ok: false }), cancel: async () => {},
});

const GUEST_LS = "qimo:guest";
const LOCALE_KEY = "qimo:locale";

function readGuest(): Guest | null {
  try {
    const raw = localStorage.getItem(GUEST_LS);
    if (!raw) return null;
    const g = JSON.parse(raw);
    return typeof g === "object" && g ? g : null;
  } catch { return null; }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [overrides, setOverrides] = useState<UiOverrides>({});
  const [ready, setReady] = useState(false);

  // reservas
  const [guest, setGuest] = useState<Guest | null>(null);
  const [reservable, setReservable] = useState<Reservable[]>([]);
  const [mineArr, setMineArr] = useState<MyReservation[]>([]);
  const started = useRef(false);

  const loadMine = useCallback(async (phone?: string | null) => {
    if (!phone) { setMineArr([]); return; }
    setMineArr(await fetchMyReservations(phone));
  }, []);

  const refresh = useCallback(async () => {
    const g = readGuest();
    setGuest(g);
    const [rv] = await Promise.all([fetchReservable(), loadMine(g?.phone)]);
    setReservable(rv);
  }, [loadMine]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setReady(true);
    setGuest(readGuest());
    // Passeios reserváveis + minhas reservas
    refresh();
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
  }, [refresh]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
      document.documentElement.lang = l === "pt" ? "pt-BR" : l;
    } catch {}
  }, []);

  const setGuestPhone = useCallback((phone: string) => {
    const next = { ...(readGuest() || {}), phone };
    try { localStorage.setItem(GUEST_LS, JSON.stringify(next)); } catch {}
    setGuest(next);
    loadMine(phone);
  }, [loadMine]);

  const reserve = useCallback<ReservationsValue["reserve"]>(async (activityId, party) => {
    const g = readGuest();
    const phone = g?.phone;
    const name = g?.name || party[0] || "Convidado";
    if (!phone) return { ok: false, error: "phone" };
    const { data, error } = await guestReserve(activityId, name, phone, party);
    if (error) return { ok: false, error: error.message };
    await loadMine(phone);
    return { ok: true, status: (data as any)?.status };
  }, [loadMine]);

  const cancel = useCallback(async (activityId: string) => {
    const g = readGuest();
    if (!g?.phone) return;
    await guestCancel(activityId, g.phone);
    await loadMine(g.phone);
  }, [loadMine]);

  const reservableByKey = new Map<string, Reservable>(); // por content_key
  reservable.forEach((r) => { if (r.contentKey) reservableByKey.set(r.contentKey, r); });
  const mine = new Map<string, MyReservation>();
  mineArr.forEach((r) => mine.set(r.activityId, r));

  const t = makeT(locale, overrides);
  const cfg = useCallback((key: string) => overrides[key]?.pt, [overrides]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t, cfg }}>
      <ReservationsCtx.Provider
        value={{ ready, guest, setGuestPhone, reservableByKey, mine, count: mineArr.length, refresh, reserve, cancel }}
      >
        {/* Renderiza o HTML já pronto (SSR/estático) na hora — sem esconder até hidratar.
            Os overrides do painel (labels/fotos) chegam async e trocam suavemente. */}
        {children}
      </ReservationsCtx.Provider>
    </LocaleCtx.Provider>
  );
}

export const useLocale = () => useContext(LocaleCtx);
export const useReservations = () => useContext(ReservationsCtx);
