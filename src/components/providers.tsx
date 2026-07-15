"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { itinerary } from "@/content";
import { type Locale, DEFAULT_LOCALE, makeT, type UiOverrides } from "@/lib/i18n";
import {
  fetchReservable, fetchMyReservations, guestReserve, guestCancel, fetchGuestParty,
  type Reservable, type MyReservation, type GuestPassenger,
} from "@/lib/supabase/reservations";
import { normalizePhone } from "@/lib/phone";

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
  settingsReady: boolean;
}>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: (k) => k, cfg: () => undefined, settingsReady: false });

/* ---------------- Reservas (atividades, via Supabase) ---------------- */
export interface Guest { name?: string | null; phone?: string | null; room?: string | null }

interface ReservationsValue {
  ready: boolean;
  guest: Guest | null;
  guestParty: GuestPassenger[];
  setGuestRoom: (room: string) => void;
  reservableByKey: Map<string, Reservable>;
  mine: Map<string, MyReservation>; // por activityId
  count: number;
  refresh: () => Promise<void>;
  reserve: (activityId: string, party: string[]) => Promise<{ ok: boolean; status?: string; error?: string }>;
  cancel: (activityId: string) => Promise<void>;
}
const ReservationsCtx = createContext<ReservationsValue>({
  ready: false, guest: null, guestParty: [], setGuestRoom: () => {}, reservableByKey: new Map(), mine: new Map(),
  count: 0, refresh: async () => {}, reserve: async () => ({ ok: false }), cancel: async () => {},
});

const GUEST_LS = "qimo:guest:v3";
const LOCALE_KEY = "qimo:locale";
const LOCAL_RES_LS = "qimo:local-reservations";
const LOCAL_ACTIVITY_PREFIX = "local:";
const SETTINGS_CACHE_KEY = "qimo:settings-cache:v2";
const SETTINGS_CACHE_MAX_AGE = 5 * 60 * 1000;

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
    return { ...g, phone: normalizePhone(g.phone) || null };
  } catch { return null; }
}

function readSettingsCache(): UiOverrides {
  try {
    if (typeof window === "undefined") return {};
    const raw = sessionStorage.getItem(SETTINGS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    if ("data" in parsed && "ts" in parsed) {
      return Date.now() - Number(parsed.ts) < SETTINGS_CACHE_MAX_AGE ? parsed.data : {};
    }
    return {};
  } catch {
    return {};
  }
}

function writeSettingsCache(overrides: UiOverrides) {
  try {
    sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: overrides }));
    localStorage.removeItem(SETTINGS_CACHE_KEY);
  } catch {}
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
  return normalizePhone(guest?.phone) || null;
}

function normalizedName(name?: string | null) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function reservationIncludesGuest(r: MyReservation, guestName?: string | null) {
  const target = normalizedName(guestName);
  if (!target) return true;
  return r.party.some((name) => normalizedName(name) === target);
}

function readLocalReservations(owner?: string | null): MyReservation[] {
  if (!owner) return [];
  try {
    const raw = localStorage.getItem(LOCAL_RES_LS);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows)
      ? rows
        .filter((r) => normalizePhone(r.owner || r.phone) === owner)
        .map(({ owner: _owner, phone: _phone, ...rest }) => rest)
      : [];
  } catch { return []; }
}

function upsertLocalReservation(owner: string, rv: Reservable, party: string[]) {
  const raw = localStorage.getItem(LOCAL_RES_LS);
  const rows = raw ? JSON.parse(raw) : [];
  const list = Array.isArray(rows) ? rows : [];
  const next = list.filter((r) => !(normalizePhone(r.owner || r.phone) === owner && r.activityId === rv.activityId));
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
  localStorage.setItem(LOCAL_RES_LS, JSON.stringify(list.filter((r) => !(normalizePhone(r.owner || r.phone) === owner && r.activityId === activityId))));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [overrides, setOverrides] = useState<UiOverrides>(() => readSettingsCache());
  const [settingsReady, setSettingsReady] = useState(false);
  const [ready, setReady] = useState(false);

  // reservas
  const [guest, setGuest] = useState<Guest | null>(null);
  const [guestParty, setGuestParty] = useState<GuestPassenger[]>([]);
  const [reservable, setReservable] = useState<Reservable[]>([]);
  const [mineArr, setMineArr] = useState<MyReservation[]>([]);
  const started = useRef(false);

  const loadMine = useCallback(async (owner?: string | null, guestName?: string | null, party: GuestPassenger[] = []) => {
    if (!owner) { setMineArr([]); return; }
    const currentName = guestName || party.find((p) => normalizePhone(p.phone) === owner)?.fullName || null;
    const phones = Array.from(new Set([owner, ...party.map((p) => normalizePhone(p.phone)).filter(Boolean)]));
    const batches = await Promise.all(phones.map(async (phone) => ({
      phone,
      rows: await fetchMyReservations(phone),
    })));
    const byId = new Map<string, MyReservation>();
    batches.forEach(({ phone, rows }) => {
      rows.forEach((row) => {
        if (phone === owner || reservationIncludesGuest(row, currentName)) {
          byId.set(row.reservationId, row);
        }
      });
    });
    const remote = Array.from(byId.values());
    setMineArr([...remote, ...readLocalReservations(owner)]);
  }, []);

  const refresh = useCallback(async () => {
    const g = readGuest();
    setGuest(g);
    const owner = reservationOwner(g);
    const [rv, party] = await Promise.all([
      fetchReservable(),
      owner ? fetchGuestParty(owner) : Promise.resolve([]),
    ]);
    await loadMine(owner, g?.name, party);
    setReservable(rv);
    setGuestParty(party);
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
        setSettingsReady(true);
        writeSettingsCache(m);
      })
      .catch(() => setSettingsReady(true));
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
    window.addEventListener("qimo-guest-updated", refreshLiveData);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("message", onMsg);
    return () => {
      window.clearInterval(stockTimer);
      window.removeEventListener("focus", refreshLiveData);
      window.removeEventListener("qimo-guest-updated", refreshLiveData);
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
    loadMine(reservationOwner(next), next.name, guestParty);
  }, [guestParty, loadMine]);

  const reserve = useCallback<ReservationsValue["reserve"]>(async (activityId, party) => {
    const g = readGuest();
    const owner = reservationOwner(g);
    const allowed = guestParty.length ? new Set(guestParty.map((p) => p.fullName)) : null;
    const cleanParty = party.map((p) => p.trim()).filter((p) => p && (!allowed || allowed.has(p)));
    const finalParty = cleanParty.length ? cleanParty : [g?.name || "Convidado"];
    const name = g?.name || finalParty[0] || "Convidado";
    if (!owner) return { ok: false, error: "phone" };
    if (activityId.startsWith(LOCAL_ACTIVITY_PREFIX)) {
      const rv = fallbackReservables(reservable).find((item) => item.activityId === activityId);
      if (!rv) return { ok: false, error: "Atividade indisponivel." };
      upsertLocalReservation(owner, rv, finalParty);
      setMineArr((current) => {
        const remote = current.filter((r) => !r.activityId.startsWith(LOCAL_ACTIVITY_PREFIX));
        return [...remote, ...readLocalReservations(owner)];
      });
      return { ok: true, status: "confirmed" };
    }
    const { data, error } = await guestReserve(activityId, name, owner, finalParty);
    if (error) return { ok: false, error: error.message };
    const [rv] = await Promise.all([fetchReservable(), loadMine(owner, name, guestParty)]);
    setReservable(rv);
    return { ok: true, status: (data as any)?.status };
  }, [guestParty, loadMine, reservable]);

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
    const [rv] = await Promise.all([fetchReservable(), loadMine(owner, g?.name, guestParty)]);
    setReservable(rv);
  }, [guestParty, loadMine]);

  const reservableByKey = new Map<string, Reservable>(); // por content_key
  [...reservable, ...fallbackReservables(reservable)].forEach((r) => { if (r.contentKey) reservableByKey.set(r.contentKey, r); });
  const mine = new Map<string, MyReservation>();
  mineArr.forEach((r) => mine.set(r.activityId, r));

  const t = makeT(locale, overrides);
  const cfg = useCallback((key: string) => overrides[key]?.pt, [overrides]);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t, cfg, settingsReady }}>
      <ReservationsCtx.Provider
        value={{ ready, guest, guestParty, setGuestRoom, reservableByKey, mine, count: mineArr.length, refresh, reserve, cancel }}
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
