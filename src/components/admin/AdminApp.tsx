"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  fetchActivities, fetchParticipants, fetchReservations,
  updateCapacity, setHidden, addParticipant, deleteParticipant,
  reserve, cancelReservation,
  type BxActivityFull, type BxParticipant, type BxReservation,
} from "@/lib/supabase/bordeaux";
import { Icon } from "@/components/Icon";
import { ContentCMS } from "./ContentCMS";
import clsx from "clsx";

type Tab = "painel" | "passeios" | "participantes" | "reservas" | "conteudo";

function occupancy(a: BxActivityFull) {
  if (a.capacity_total == null) return { label: "Livre", tone: "muted" };
  if ((a.available ?? 0) <= 0) return { label: "Esgotado", tone: "red" };
  if (a.reserved >= a.capacity_total * 0.8) return { label: "Poucas vagas", tone: "amber" };
  return { label: "Disponível", tone: "green" };
}
function toneClass(t: string) {
  return t === "red"
    ? "bg-[#8f2f2f]/12 text-[#8f2f2f]"
    : t === "amber"
    ? "bg-gold/15 text-gold-deep"
    : t === "green"
    ? "bg-olive/15 text-olive-deep"
    : "bg-black/5 text-muted";
}

export function AdminApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="notranslate min-h-screen" translate="no">
      {!ready ? (
        <div className="container-editorial py-20 text-center text-muted">Carregando…</div>
      ) : !session ? (
        <Login />
      ) : (
        <Shell email={session.user?.email} />
      )}
    </div>
  );
}

/* ---------------- Login ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase().auth.signInWithPassword({ email, password: pw });
    if (error) setErr("E-mail ou senha inválidos.");
    setBusy(false);
  };

  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-16">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <p className="kicker">QIMO Bordeaux</p>
        <h1 className="display mt-2 text-3xl">Painel de gestão</h1>
        <p className="mt-2 font-sans text-[13px] text-muted">Acesso restrito à equipe QIMO.</p>
        <div className="mt-6 space-y-3">
          <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border bg-transparent px-4 py-3 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          <input type="password" required placeholder="Senha" value={pw} onChange={(e) => setPw(e.target.value)}
            className="w-full rounded-[10px] border bg-transparent px-4 py-3 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          {err && <p className="font-sans text-[12px] text-[#8f2f2f]">{err}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? "Entrando…" : "Entrar"}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Shell ---------------- */
function Shell({ email }: { email?: string }) {
  const [tab, setTab] = useState<Tab>("painel");
  const [acts, setActs] = useState<BxActivityFull[]>([]);
  const [parts, setParts] = useState<BxParticipant[]>([]);
  const [res, setRes] = useState<BxReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [a, p, r] = await Promise.all([fetchActivities(), fetchParticipants(), fetchReservations()]);
    setActs(a); setParts(p); setRes(r); setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "painel", label: "Painel", icon: "Home" },
    { key: "passeios", label: "Passeios", icon: "Ticket" },
    { key: "participantes", label: "Participantes", icon: "Users" },
    { key: "reservas", label: "Reservas", icon: "Check" },
    { key: "conteudo", label: "Conteúdo", icon: "FileText" },
  ];

  return (
    <div className="container-editorial py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">QIMO Bordeaux · Gestão</p>
          <h1 className="display text-2xl sm:text-3xl">Passeios & Vagas</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={reload} className="btn-ghost !px-4 !py-2"><Icon name="ArrowRight" size={14} /> Atualizar</button>
          <button onClick={() => supabase().auth.signOut()} className="font-sans text-[12px] text-muted hover:text-gold-deep">Sair {email ? `(${email})` : ""}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b" style={{ borderColor: "var(--line)" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx("flex items-center gap-2 border-b-2 px-4 py-3 font-sans text-[13px] transition-colors",
              tab === t.key ? "border-petrol-600 text-petrol-600" : "border-transparent text-muted hover:text-petrol-600")}>
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="py-8">
        {loading ? (
          <p className="text-center text-muted">Carregando dados…</p>
        ) : tab === "painel" ? (
          <Painel acts={acts} res={res} />
        ) : tab === "passeios" ? (
          <Passeios acts={acts} onChange={reload} />
        ) : tab === "participantes" ? (
          <Participantes parts={parts} onChange={reload} />
        ) : tab === "conteudo" ? (
          <ContentCMS />
        ) : (
          <Reservas acts={acts} parts={parts} res={res} onChange={reload} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Painel ---------------- */
function Painel({ acts, res }: { acts: BxActivityFull[]; res: BxReservation[] }) {
  const limited = acts.filter((a) => (a.capacity_total ?? 999) < 124);
  const soldOut = acts.filter((a) => a.capacity_total != null && (a.available ?? 0) <= 0);
  const few = acts.filter((a) => a.capacity_total != null && (a.available ?? 0) > 0 && a.reserved >= a.capacity_total * 0.8);
  const confirmed = res.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.seats, 0);
  const waitlist = res.filter((r) => r.status === "waitlist").reduce((s, r) => s + r.seats, 0);

  const stats = [
    { n: acts.length, l: "Passeios", icon: "Ticket" },
    { n: limited.length, l: "Com vagas limitadas", icon: "ShieldCheck" },
    { n: soldOut.length, l: "Esgotados", icon: "X", tone: "red" },
    { n: few.length, l: "Poucas vagas", icon: "Clock", tone: "amber" },
    { n: confirmed, l: "Lugares confirmados", icon: "Check", tone: "green" },
    { n: waitlist, l: "Em lista de espera", icon: "Users" },
  ];

  const byDay = useMemo(() => {
    const m = new Map<number, BxActivityFull[]>();
    acts.forEach((a) => { const d = a.day_number ?? 0; if (!m.has(d)) m.set(d, []); m.get(d)!.push(a); });
    return [...m.entries()].sort((x, y) => x[0] - y[0]);
  }, [acts]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.l} className="card p-4 text-center">
            <p className={clsx("font-serif text-4xl font-light", s.tone === "red" ? "text-[#8f2f2f]" : s.tone === "amber" ? "text-gold-deep" : s.tone === "green" ? "text-olive-deep" : "text-petrol-600")}>{s.n}</p>
            <p className="mt-1 font-sans text-[11px] uppercase tracking-wide2 text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      {byDay.map(([day, list]) => (
        <div key={day}>
          <p className="kicker">Dia {day}</p>
          <div className="mt-3 space-y-2">
            {list.map((a) => {
              const o = occupancy(a);
              const pct = a.capacity_total ? Math.min(100, Math.round((a.reserved / a.capacity_total) * 100)) : 0;
              return (
                <div key={a.id} className="card flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[17px] font-light">{a.title}</p>
                    <p className="font-sans text-[12px] text-muted">{a.start_time} · {a.location}</p>
                  </div>
                  <div className="hidden w-40 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: o.tone === "red" ? "#8f2f2f" : o.tone === "amber" ? "var(--gold)" : "var(--olive)" }} />
                    </div>
                    <p className="mt-1 text-right font-sans text-[11px] text-muted">
                      {a.reserved}/{a.capacity_total ?? "∞"} {a.waitlisted > 0 && `· espera ${a.waitlisted}`}
                    </p>
                  </div>
                  <span className={clsx("shrink-0 rounded-full px-3 py-1 font-sans text-[11px] font-medium", toneClass(o.tone))}>{o.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Passeios (editar capacidade) ---------------- */
function Passeios({ acts, onChange }: { acts: BxActivityFull[]; onChange: () => void }) {
  return (
    <div className="space-y-2">
      {acts.map((a) => (
        <PasseioRow key={a.id} a={a} onChange={onChange} />
      ))}
    </div>
  );
}
function PasseioRow({ a, onChange }: { a: BxActivityFull; onChange: () => void }) {
  const [cap, setCap] = useState(a.capacity_total ?? 0);
  const [busy, setBusy] = useState(false);
  const dirty = cap !== (a.capacity_total ?? 0);
  const save = async () => { setBusy(true); await updateCapacity(a.id, cap); await onChange(); setBusy(false); };
  const hidden = a.status === "hidden";
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[17px] font-light">Dia {a.day_number} · {a.title}</p>
        <p className="font-sans text-[12px] text-muted">Reservados: {a.reserved} · Espera: {a.waitlisted}</p>
      </div>
      <label className="flex items-center gap-2 font-sans text-[12px] text-muted">
        Capacidade
        <input type="number" min={0} value={cap} onChange={(e) => setCap(parseInt(e.target.value) || 0)}
          className="w-20 rounded-[8px] border bg-transparent px-2 py-1.5 text-center font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
      </label>
      {dirty && <button disabled={busy} onClick={save} className="btn-primary !px-4 !py-2">{busy ? "…" : "Salvar"}</button>}
      <button onClick={async () => { await setHidden(a.id, !hidden); onChange(); }}
        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[11px] text-muted transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }}>
        <Icon name={hidden ? "Plus" : "Minus"} size={12} /> {hidden ? "Oculto" : "Visível"}
      </button>
    </div>
  );
}

/* ---------------- Participantes ---------------- */
function Participantes({ parts, onChange }: { parts: BxParticipant[]; onChange: () => void }) {
  const [f, setF] = useState({ full_name: "", family: "", phone: "", email: "", companions: 0 });
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!f.full_name) return;
    setBusy(true); await addParticipant(f); setF({ full_name: "", family: "", phone: "", email: "", companions: 0 }); await onChange(); setBusy(false);
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <form onSubmit={add} className="card h-fit p-6">
        <h3 className="font-serif text-xl font-light">Novo participante</h3>
        <div className="mt-4 space-y-3">
          {[
            ["full_name", "Nome completo *"], ["family", "Família"], ["phone", "Telefone"], ["email", "E-mail"],
          ].map(([k, ph]) => (
            <input key={k} placeholder={ph} value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className="w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          ))}
          <label className="flex items-center gap-2 font-sans text-[12px] text-muted">Acompanhantes
            <input type="number" min={0} value={f.companions} onChange={(e) => setF({ ...f, companions: parseInt(e.target.value) || 0 })}
              className="w-20 rounded-[8px] border bg-transparent px-2 py-1.5 text-center outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          </label>
          <button disabled={busy} className="btn-primary w-full">{busy ? "…" : "Adicionar"}</button>
        </div>
      </form>

      <div>
        <p className="kicker mb-3">{parts.length} participantes</p>
        <div className="space-y-2">
          {parts.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[17px] font-light">{p.full_name}</p>
                <p className="font-sans text-[12px] text-muted">{[p.family, p.phone, p.email].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={async () => { await deleteParticipant(p.id); onChange(); }} aria-label="Remover" className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
            </div>
          ))}
          {parts.length === 0 && <p className="text-muted">Nenhum participante ainda.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reservas ---------------- */
function Reservas({ acts, parts, res, onChange }: { acts: BxActivityFull[]; parts: BxParticipant[]; res: BxReservation[]; onChange: () => void }) {
  const [activityId, setActivityId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [guest, setGuest] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || (!participantId && !guest)) { setMsg({ ok: false, text: "Escolha o passeio e o participante." }); return; }
    setBusy(true); setMsg(null);
    const { data, error } = await reserve(activityId, participantId || null, participantId ? null : guest, adults, children, null);
    setBusy(false);
    if (error) { setMsg({ ok: false, text: "Erro: " + error.message }); return; }
    const status = (data as any)?.status;
    setMsg({ ok: true, text: status === "confirmed" ? "✓ Reserva confirmada!" : "Passeio lotado — adicionado à lista de espera." });
    setGuest(""); setAdults(1); setChildren(0);
    onChange();
  };

  const active = res.filter((r) => r.status !== "cancelled");
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="card h-fit p-6">
        <h3 className="font-serif text-xl font-light">Nova reserva</h3>
        <div className="mt-4 space-y-3">
          <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            <option value="">Passeio…</option>
            {acts.map((a) => (
              <option key={a.id} value={a.id}>Dia {a.day_number} · {a.title} ({a.available ?? "∞"} vagas)</option>
            ))}
          </select>
          <select value={participantId} onChange={(e) => setParticipantId(e.target.value)} className="w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            <option value="">Participante cadastrado…</option>
            {parts.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          {!participantId && (
            <input placeholder="…ou nome avulso" value={guest} onChange={(e) => setGuest(e.target.value)} className="w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          )}
          <div className="flex gap-3">
            <label className="flex flex-1 items-center gap-2 font-sans text-[12px] text-muted">Adultos
              <input type="number" min={1} value={adults} onChange={(e) => setAdults(parseInt(e.target.value) || 1)} className="w-16 rounded-[8px] border bg-transparent px-2 py-1.5 text-center outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
            <label className="flex flex-1 items-center gap-2 font-sans text-[12px] text-muted">Crianças
              <input type="number" min={0} value={children} onChange={(e) => setChildren(parseInt(e.target.value) || 0)} className="w-16 rounded-[8px] border bg-transparent px-2 py-1.5 text-center outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
          </div>
          {msg && <p className={clsx("font-sans text-[12px]", msg.ok ? "text-olive-deep" : "text-[#8f2f2f]")}>{msg.text}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? "…" : "Reservar"}</button>
        </div>
      </form>

      <div>
        <p className="kicker mb-3">{active.length} reservas ativas</p>
        <div className="space-y-2">
          {active.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[16px] font-light">{r.participant?.full_name || r.guest_name}</p>
                <p className="truncate font-sans text-[12px] text-muted">Dia {r.activity?.day_number} · {r.activity?.title} · {r.seats} lugar(es)</p>
              </div>
              <span className={clsx("shrink-0 rounded-full px-3 py-1 font-sans text-[11px] font-medium", r.status === "confirmed" ? "bg-olive/15 text-olive-deep" : "bg-gold/15 text-gold-deep")}>
                {r.status === "confirmed" ? "Confirmada" : "Lista de espera"}
              </span>
              <button onClick={async () => { await cancelReservation(r.id); onChange(); }} aria-label="Cancelar" className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
            </div>
          ))}
          {active.length === 0 && <p className="text-muted">Nenhuma reserva ainda.</p>}
        </div>
      </div>
    </div>
  );
}
