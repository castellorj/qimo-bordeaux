"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { itinerary } from "@/content";
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
export interface Guest { name?: string | null; phone?: string | null; room?: string | null }

interface ReservationsValue {
  ready: boolean;
  guest: Guest | null;
  setGuestRoom: (room: string) => void;
  reservableByKey: Map<string, Reservable>;
  mine: Map<string, MyReservation>; // por activityId
  count: number;
  refresh: () => Promise<void>;
  reserve: (activityId: string, party: string[]) => Promise<{ ok: boolean; status?: string; error?: string }>;
  cancel: (activityId: string) => Promise<void>;
}
const ReservationsCtx = createContext<ReservationsValue>({
  ready: false, guest: null, setGuestRoom: () => {}, reservableByKey: new Map(), mine: new Map(),
  count: 0, refresh: async () => {}, reserve: async () => ({ ok: false }), cancel: async () => {},
});

const GUEST_LS = "qimo:guest";
const LOCALE_KEY = "qimo:locale";
const LOCAL_RES_LS = "qimo:local-reservations";
const LOCAL_ACTIVITY_PREFIX = "local:";

function readGuest(): Guest | null {
  try {
    const raw = localStorage.getItem(GUEST_LS);
    if (!raw) return null;
    const g = JSON.parse(raw);
    if (typeof g !== "object" || !g) return null;
    if (!g.room && typeof g.phone === "string" && /^\d{1,5}$/.test(g.phone.trim())) {
      const migrated = { ...g, phone: null, room: g.phone.trim() };
      try { localStorage.setItem(GUEST_LS, JSON.stringify(migrated)); } catch {}
      return migrated;
    }
    return g;
  } catch { return null; }
}

function startTime(time?: string | null) {
  return time?.split(/[–—-]/)[0]?.trim() || null;
}

function localActivityId(contentKey: string) {
  return `${LOCAL_ACTIVITY_PREFIX}${contentKey}`;
}

function fallbackReservables(remote: Reservable[]): Reservable[] {
  const remoteKeys = new Set(remote.map((r) => r.contentKey).filter(Boolean));
  const fallback: Reservable[] = [];
  itinerary.forEach((day) => {
    day.activities.forEach((activity) => {
      if (activity.type === "transfer" || !activity.location?.trim() || remoteKeys.has(activity.id)) return;
      fallback.push({
        activityId: localActivityId(activity.id),
        contentKey: activity.id,
        dayNumber: day.n,
        startTime: startTime(activity.time),
        title: activity.title,
        capacityTotal: activity.capacity ?? null,
        reserved: 0,
        available: activity.capacity ?? null,
        qimoSelect: !!activity.qimoSelect,
        status: "local",
      });
    });
  });
  return fallback;
}

function reservationOwner(guest?: Guest | null) {
  return guest?.room?.trim() || guest?.phone?.trim() || null;
}

function readLocalReservations(owner?: string | null): MyReservation[] {
  if (!owner) return [];
  try {
    const raw = localStorage.getItem(LOCAL_RES_LS);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows.filter((r) => r.owner === owner || r.phone === owner).map(({ owner: _owner, phone: _phone, ...rest }) => rest) : [];
  } catch { return []; }
}

function upsertLocalReservation(owner: string, rv: Reservable, party: string[]) {
  const raw = localStorage.getItem(LOCAL_RES_LS);
  const rows = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(rows) ? rows : [];
  const next = list.filter((r) => !((r.owner === owner || r.phone === owner) && r.activityId === rv.activityId));
  next.push({
    owner,
    reservationId: `local-${rv.activityId}-${owner}`,
    activityId: rv.activityId,
    contentKey: rv.contentKey,
    dayNumber: rv.dayNumber,
    startTime: rv.startTime,
    title: rv.title,
    party,
    seats: party.length,
    status: "confirmed",
  });
  localStorage.setItem(LOCAL_RES_LS, JSON.stringify(next));
}

function removeLocalReservation(owner: string, activityId: string) {
  const raw = localStorage.getItem(LOCAL_RES_LS);
  const rows = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(rows) ? rows : [];
  localStorage.setItem(LOCAL_RES_LS, JSON.stringify(list.filter((r) => !((r.owner === owner || r.phone === owner) && r.activityId === activityId))));
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

  const loadMine = useCallback(async (owner?: string | null) => {
    if (!owner) { setMineArr([]); return; }
    const remote = await fetchMyReservations(owner);
    setMineArr([...remote, ...readLocalReservations(owner)]);
  }, []);

  const refresh = useCallback(async () => {
    const g = readGuest();
    setGuest(g);
    const [rv] = await Promise.all([fetchReservable(), loadMine(reservationOwner(g))]);
    setReservable(rv);
  }, [loadMine]);

  const refreshSettings = useCallback(async () => {
    fetch(`${SB_URL}/rest/v1/bordeaux_settings?select=key,pt,en,es`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        const m: UiOverrides = {};
        rows.forEach((r) => (m[r.key] = { pt: r.pt, en: r.en, es: r.es }));
        setOverrides(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setReady(true);
    setGuest(readGuest());
    // Passeios reserváveis + minhas reservas
    refresh();
    // Rótulos de botões/menus editados no painel (aplicados sem rebuild)
    refreshSettings();

    const refreshLiveData = () => {
      refresh();
      refreshSettings();
    };
    const refreshReservationStock = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const stockTimer = window.setInterval(refreshReservationStock, 12000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshLiveData();
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === "qimo-admin" && e.data?.type === "qimo-refresh") refreshLiveData();
    };
    window.addEventListener("focus", refreshLiveData);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("message", onMsg);
    return () => {
      window.clearInterval(stockTimer);
      window.removeEventListener("focus", refreshLiveData);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("message", onMsg);
    };
  }, [refresh, refreshSettings]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
      document.documentElement.lang = l === "pt" ? "pt-BR" : l;
    } catch {}
  }, []);

  const setGuestRoom = useCallback((room: string) => {
    const next = { ...(readGuest() || {}), room };
    try { localStorage.setItem(GUEST_LS, JSON.stringify(next)); } catch {}
    setGuest(next);
    loadMine(reservationOwner(next));
  }, [loadMine]);

  const reserve = useCallback<ReservationsValue["reserve"]>(async (activityId, party) => {
    const g = readGuest();
    const owner = reservationOwner(g);
    const name = g?.name || party[0] || "Convidado";
    if (!owner) return { ok: false, error: "room" };
    if (activityId.startsWith(LOCAL_ACTIVITY_PREFIX)) {
      const rv = fallbackReservables(reservable).find((item) => item.activityId === activityId);
      if (!rv) return { ok: false, error: "Atividade indisponivel." };
      upsertLocalReservation(owner, rv, party);
      setMineArr((current) => {
        const remote = current.filter((r) => !r.activityId.startsWith(LOCAL_ACTIVITY_PREFIX));
        return [...remote, ...readLocalReservations(owner)];
      });
      return { ok: true, status: "confirmed" };
    }
    const { data, error } = await guestReserve(activityId, name, owner, party);
    if (error) return { ok: false, error: error.message };
    const [rv] = await Promise.all([fetchReservable(), loadMine(owner)]);
    setReservable(rv);
    return { ok: true, status: (data as any)?.status };
  }, [loadMine, reservable]);

  const cancel = useCallback(async (activityId: string) => {
    const g = readGuest();
    const owner = reservationOwner(g);
    if (!owner) return;
    if (activityId.startsWith(LOCAL_ACTIVITY_PREFIX)) {
      removeLocalReservation(owner, activityId);
      setMineArr((current) => {
        const remote = current.filter((r) => !r.activityId.startsWith(LOCAL_ACTIVITY_PREFIX));
        return [...remote, ...readLocalReservations(owner)];
      });
      return;
    }
    await guestCancel(activityId, owner);
    const [rv] = await Promise.all([fetchReservable(), loadMine(owner)]);
    setReservable(rv);
  }, [loadMine]);

  const reservableByKey = new Map<string, Reservable>(); // por content_key
  [...reservable, ...fallbackReservables(reservable)].forEach((r) => { if (r.contentKey) reservableByKey.set(r.contentKey, r); });
  const mine = new Map<string, MyReservation>();
  mineArr.forEach((r) => mine.set(r.activityId, r));

  const t = makeT(locale, overrides);
  const cfg = useCallback((key: string) => overrides[key]?.pt, [overrides]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t, cfg }}>
      <ReservationsCtx.Provider
        value={{ ready, guest, setGuestRoom, reservableByKey, mine, count: mineArr.length, refresh, reserve, cancel }}
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
