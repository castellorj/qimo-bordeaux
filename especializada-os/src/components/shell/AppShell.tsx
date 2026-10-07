"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/data/store";
import { NAV } from "./nav";
import { Avatar, Badge, DemoBadge, Icons } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ROLE_LABEL } from "@/domain/rbac";
import { globalSearch } from "@/domain/engines/search";
import { partyName } from "@/domain/engines/queries";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <I className={className} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready, db } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname.startsWith("/p/") || pathname === "/login";

  useEffect(() => {
    if (ready && !user && !isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, isPublic, pathname, router]);

  if (isPublic) return <>{children}</>;
  if (!ready || !user) return <div className="flex h-screen items-center justify-center text-sm text-ink-muted"><Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando…</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">{children}</main>
        <footer className="px-8 pb-6 text-2xs text-ink-faint">
          Especializada Seguros OS · versão DEMO · {db.persons.length + db.companies.length} registros fictícios · nenhum dado real é armazenado nesta versão
        </footer>
      </div>
      <Toasts />
      <Shortcuts />
    </div>
  );
}

function Sidebar() {
  const { can, ops } = useStore();
  const pathname = usePathname();
  const urgent = useMemo(() => ops.filter((i) => i.primary === "urgente").length, [ops]);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">E</div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-ink">Especializada</div>
          <div className="text-2xs text-ink-muted">Insurance OS</div>
        </div>
        <DemoBadge className="ml-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((g, gi) => {
          const items = g.items.filter((i) => !i.perm || can(i.perm));
          if (!items.length) return null;
          return (
            <div key={gi} className="mb-3">
              {g.section && <div className="px-2 pb-1 text-2xs font-semibold uppercase tracking-wider text-ink-faint">{g.section}</div>}
              {items.map((i) => {
                const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
                return (
                  <Link key={i.href} href={i.href} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition", active ? "bg-brand-50 font-medium text-brand-700" : "text-ink-soft hover:bg-line-soft hover:text-ink")}>
                    <NavIcon name={i.icon} className={cn("h-4 w-4", active ? "text-brand-600" : "text-ink-muted")} />
                    <span className="truncate">{i.label}</span>
                    {i.href === "/operacoes" && urgent > 0 && <span className="ml-auto rounded-full bg-danger px-1.5 text-2xs font-semibold text-white">{urgent}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-3 text-2xs text-ink-muted">
        <kbd className="rounded border border-line bg-canvas px-1">⌘K</kbd> busca · <kbd className="rounded border border-line bg-canvas px-1">N</kbd> novo
      </div>
    </aside>
  );
}

function Topbar() {
  const { user, setUser, db, reset, ops } = useStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const alerts = useMemo(() => ops.filter((i) => i.primary === "urgente").slice(0, 8), [ops]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      else if (!typing && e.key === "/") { e.preventDefault(); setSearchOpen(true); }
      else if (!typing && e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) setNewOpen((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const NEW = [
    { label: "Cliente", href: "/clientes?novo=1", icon: "UserPlus" },
    { label: "Cotação", href: "/cotacoes/nova", icon: "Calculator" },
    { label: "Proposta", href: "/cotacoes?gerar=1", icon: "FileText" },
    { label: "Tarefa", href: "/tarefas?nova=1", icon: "CheckSquare" },
    { label: "Documento", href: "/documentos?upload=1", icon: "Upload" },
    { label: "Apólice", href: "/documentos?upload=1&tipo=apolice", icon: "ShieldCheck" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
        <button className="rounded p-1.5 text-ink-muted hover:bg-line-soft lg:hidden" onClick={() => setMobileNav(true)} aria-label="Menu"><Icons.Menu className="h-5 w-5" /></button>
        <button onClick={() => setSearchOpen(true)} className="flex h-9 w-full max-w-xl items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-left text-sm text-ink-faint hover:border-brand-300">
          <Icons.Search className="h-4 w-4" />
          <span className="flex-1 truncate">Buscar cliente, CPF, placa, apólice, hospital…</span>
          <kbd className="hidden rounded border border-line bg-white px-1.5 text-2xs text-ink-muted sm:inline">⌘K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button onClick={() => setNewOpen((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
              <Icons.Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo</span>
            </button>
            {newOpen && (
              <Menu onClose={() => setNewOpen(false)}>
                {NEW.map((n) => (
                  <button key={n.label} onClick={() => { setNewOpen(false); router.push(n.href); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink-soft hover:bg-line-soft hover:text-ink">
                    <NavIcon name={n.icon} className="h-4 w-4 text-ink-muted" /> {n.label}
                  </button>
                ))}
              </Menu>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setAlertsOpen((v) => !v)} className="relative rounded-lg p-2 text-ink-muted hover:bg-line-soft" aria-label="Alertas">
              <Icons.Bell className="h-5 w-5" />
              {alerts.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />}
            </button>
            {alertsOpen && (
              <Menu onClose={() => setAlertsOpen(false)} wide>
                <div className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-ink">Urgentes ({alerts.length})</div>
                {alerts.map((a) => (
                  <Link key={a.task.id} href="/operacoes" onClick={() => setAlertsOpen(false)} className="block rounded-md px-2.5 py-1.5 hover:bg-line-soft">
                    <div className="truncate text-sm text-ink">{a.task.title}</div>
                    <div className="truncate text-2xs text-ink-muted">{partyName(db, a.party)} · {a.reasons.join(" · ")}</div>
                  </Link>
                ))}
                {!alerts.length && <div className="px-2.5 py-3 text-xs text-ink-muted">Nada urgente agora.</div>}
              </Menu>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-line-soft">
              <Avatar name={user!.name} size="sm" />
              <div className="hidden text-left leading-tight md:block">
                <div className="text-xs font-medium text-ink">{user!.name}</div>
                <div className="text-2xs text-ink-muted">{ROLE_LABEL[user!.role]}</div>
              </div>
            </button>
            {userOpen && (
              <Menu onClose={() => setUserOpen(false)}>
                <div className="px-2.5 py-1.5 text-2xs text-ink-muted">Trocar perfil (DEMO)</div>
                {db.users.map((u) => (
                  <button key={u.id} onClick={() => { setUser(u.id); setUserOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-line-soft", u.id === user!.id && "bg-brand-50")}>
                    <Avatar name={u.name} size="sm" tone="neutral" />
                    <span className="flex-1 text-left">{u.name}</span>
                    <span className="text-2xs text-ink-muted">{ROLE_LABEL[u.role]}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-line" />
                <button onClick={() => { if (confirm("Restaurar todos os dados DEMO ao estado inicial?")) reset(); setUserOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink-soft hover:bg-line-soft"><Icons.RotateCcw className="h-4 w-4" />Restaurar dados DEMO</button>
                <button onClick={() => { setUser(null); router.push("/login"); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink-soft hover:bg-line-soft"><Icons.LogOut className="h-4 w-4" />Sair</button>
              </Menu>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-fuchsia-100 bg-demo-soft px-4 py-1 text-2xs text-demo">
        <Icons.FlaskConical className="h-3 w-3" /> Ambiente DEMO — clientes e hospitais fictícios; planos, preços, redes e cotações simulados (não são tarifas reais das seguradoras). Não insira dados reais de clientes.
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
      {mobileNav && <MobileNav onClose={() => setMobileNav(false)} />}
    </header>
  );
}

function Menu({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h));
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return <div ref={ref} className={cn("absolute right-0 top-11 z-40 rounded-xl border border-line bg-white p-1.5 shadow-pop", wide ? "w-96" : "w-60")}>{children}</div>;
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const { db, user } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const hits = useMemo(() => globalSearch(db, q, user), [db, q, user]);
  const quick = [
    { type: "Ir para", label: "Central de Operações", sub: "o que fazer agora", href: "/operacoes", score: 0 },
    { type: "Ação", label: "Nova cotação", sub: "Saúde, Auto e demais ramos", href: "/cotacoes/nova", score: 0 },
    { type: "Ação", label: "Perguntar à Especializada AI", sub: q || "consultas sobre a carteira", href: `/ai${q ? `?q=${encodeURIComponent(q)}` : ""}`, score: 0 },
  ];
  const list = q.length >= 2 ? [...hits, quick[2]] : quick;
  const go = (href: string) => { onClose(); router.push(href); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-pop" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Icons.Search className="h-4 w-4 text-ink-muted" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === "Enter" && list[sel]) go(list[sel].href);
          }} placeholder="Nome, CPF, CNPJ, telefone, placa, apólice, seguradora, plano, hospital…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
          <kbd className="rounded border border-line px-1.5 text-2xs text-ink-muted">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {list.map((h, i) => (
            <button key={h.href + i} onMouseEnter={() => setSel(i)} onClick={() => go(h.href)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", sel === i && "bg-brand-50")}>
              <Badge tone={h.type === "Ação" || h.type === "Ir para" ? "brand" : "neutral"} className="w-20 justify-center">{h.type}</Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink">{h.label}</div>
                <div className="truncate text-2xs text-ink-muted">{h.sub}</div>
              </div>
              <Icons.CornerDownLeft className={cn("h-3.5 w-3.5 text-ink-faint", sel !== i && "invisible")} />
            </button>
          ))}
          {q.length >= 2 && hits.length === 0 && <div className="px-3 py-4 text-sm text-ink-muted">Nenhum resultado para “{q}”.</div>}
        </div>
      </div>
    </div>
  );
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const { can } = useStore();
  return (
    <div className="fixed inset-0 z-50 bg-ink/30 lg:hidden" onClick={onClose}>
      <div className="h-full w-64 overflow-y-auto bg-white p-3" onClick={(e) => e.stopPropagation()}>
        {NAV.flatMap((g) => g.items).filter((i) => !i.perm || can(i.perm)).map((i) => (
          <Link key={i.href} href={i.href} onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-line-soft">
            <NavIcon name={i.icon} className="h-4 w-4" /> {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn("flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-pop", t.tone === "warn" ? "bg-warn-strong" : t.tone === "info" ? "bg-ink" : "bg-ok-strong")}>
          {t.tone === "warn" ? <Icons.AlertTriangle className="h-4 w-4" /> : <Icons.CheckCircle2 className="h-4 w-4" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Atalhos "G + letra" estilo Linear */
function Shortcuts() {
  const router = useRouter();
  useEffect(() => {
    let g = false;
    let timer: ReturnType<typeof setTimeout>;
    const map: Record<string, string> = { d: "/", o: "/operacoes", c: "/clientes", a: "/ai", r: "/renovacoes", p: "/propostas", t: "/tarefas", m: "/crm" };
    const h = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "g") { g = true; clearTimeout(timer); timer = setTimeout(() => (g = false), 900); return; }
      if (g && map[e.key.toLowerCase()]) { router.push(map[e.key.toLowerCase()]); g = false; }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [router]);
  return null;
}
