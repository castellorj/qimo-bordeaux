"use client";
/**
 * Repositório da DEMO: estado em memória + localStorage do navegador.
 * Em produção este provider é substituído por chamadas ao servidor
 * (Postgres via Prisma) mantendo a mesma API de casos de uso (actions.ts).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DB, Permission, User } from "@/domain/types";
import { createSeed, SEED_VERSION } from "./seed";
import { todayISO } from "@/lib/dates";
import { can as canFn, canSeeParty } from "@/domain/rbac";
import { runAutomations } from "@/domain/engines/automation";

const KEY = "especializada-os-demo";
const USER_KEY = "especializada-os-demo-user";

interface Toast { id: number; text: string; tone?: "ok" | "info" | "warn" }

interface Store {
  db: DB;
  today: string;
  user: User | null;
  ready: boolean;
  setUser(id: string | null): void;
  update(fn: (db: DB, user: User | null) => DB): void;
  can(p: Permission): boolean;
  visible(ref?: { type: "person" | "company"; id: string }): boolean;
  reset(): void;
  toast(text: string, tone?: Toast["tone"]): void;
  toasts: Toast[];
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => todayISO(), []);
  const [db, setDb] = useState<DB>(() => createSeed(today));
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loaded = useRef(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DB & { _seedDay?: string };
        if (parsed.version === SEED_VERSION) setDb(runAutomations(parsed, today).db);
      }
      setUserId(localStorage.getItem(USER_KEY));
    } catch {
      /* armazenamento indisponível: segue com a seed */
    }
    loaded.current = true;
    setReady(true);
  }, [today]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* ignore */
    }
  }, [db]);

  const user = db.users.find((u) => u.id === userId) ?? null;

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const value: Store = {
    db,
    today,
    user,
    ready,
    toasts,
    toast,
    setUser(id) {
      setUserId(id);
      try {
        if (id) localStorage.setItem(USER_KEY, id);
        else localStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
    },
    update(fn) {
      // aplica o caso de uso uma única vez (fora do updater do React) para manter IDs gerados estáveis
      const next = fn(dbRef.current, dbRef.current.users.find((u) => u.id === userId) ?? null);
      dbRef.current = next;
      setDb(next);
    },
    can: (p) => canFn(db, user, p),
    visible: (ref) => canSeeParty(db, user, ref),
    reset() {
      setDb(createSeed(today));
      toast("Dados DEMO restaurados", "info");
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fora do StoreProvider");
  return s;
}
