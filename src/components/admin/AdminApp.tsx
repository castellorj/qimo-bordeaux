"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  fetchActivities, fetchParticipants, fetchReservations,
  updateCapacity, setHidden, addParticipant, deleteParticipant,
  reserve, cancelReservation,
  type BxActivityFull, type BxParticipant, type BxReservation,
} from "@/lib/supabase/bordeaux";
import { Icon } from "@/components/Icon";
import { ContentCMS } from "./ContentCMS";
import { TextosEditor } from "./TextosEditor";
import { BotoesEditor } from "./BotoesEditor";
import { PagesBuilder } from "./PagesBuilder";
import { RoteiroEditor } from "./RoteiroEditor";
import { TelasConcierge } from "./TelasConcierge";
import { OperationsCenter } from "./OperationsCenter";
import { PreviewPane } from "./PreviewPane";
import { PublishModal } from "./PublishModal";
import { EditabilityAudit } from "./EditabilityAudit";
import clsx from "clsx";

type Tab = "inicio" | "roteiro" | "passeios" | "participantes" | "reservas" | "conteudo" | "telas" | "paginas" | "textos" | "preview" | "cobertura";

type TabMeta = {
  key: Tab;
  label: string;
  icon: string;
  desc: string;
};

const TAB_META: Record<Tab, TabMeta> = {
  inicio: { key: "inicio", label: "Inicio", icon: "Home", desc: "Visao geral da viagem, pendencias e atalhos para as tarefas mais comuns." },
  roteiro: { key: "roteiro", label: "Programacao", icon: "CalendarDays", desc: "Edite dias, horarios, fotos, portos, agenda do navio e atividades do roteiro." },
  passeios: { key: "passeios", label: "Passeios", icon: "Ticket", desc: "Controle vagas, disponibilidade e visibilidade dos passeios reservaveis." },
  reservas: { key: "reservas", label: "Reservas", icon: "Check", desc: "Acompanhe reservas feitas no app e inclua reservas manualmente pela equipe." },
  participantes: { key: "participantes", label: "Clientes", icon: "Users", desc: "Cadastre participantes, familias e contatos ligados a esta viagem." },
  conteudo: { key: "conteudo", label: "Fichas", icon: "LayoutGrid", desc: "Edite cidades, vinicolas, restaurantes, vinhos, gastronomia, experiencias e compras." },
  telas: { key: "telas", label: "Fotos e concierge", icon: "Smartphone", desc: "Troque imagens fixas do site e gerencie contatos do concierge." },
  paginas: { key: "paginas", label: "Paginas", icon: "BookOpen", desc: "Crie paginas extras com blocos visuais e publique no guia." },
  textos: { key: "textos", label: "Menus e textos", icon: "Languages", desc: "Renomeie menus, botoes, titulos curtos, icones e itens de navegacao." },
  preview: { key: "preview", label: "Editor visual", icon: "Pencil", desc: "Abra o guia dentro do painel, clique em campos editaveis e veja mobile, tablet e desktop." },
  cobertura: { key: "cobertura", label: "Cobertura", icon: "CircleCheck", desc: "Veja o que ja e editavel no painel e quais areas ainda precisam virar CMS." },
};

const NAV_GROUPS: { title: string; items: Tab[] }[] = [
  { title: "Operacao", items: ["inicio", "roteiro", "passeios"] },
  { title: "CMS visual", items: ["conteudo", "paginas", "telas", "textos", "preview", "cobertura"] },
  { title: "Clientes", items: ["reservas", "participantes"] },
];

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
  const [tab, setTab] = useState<Tab>("inicio");
  const [acts, setActs] = useState<BxActivityFull[]>([]);
  const [parts, setParts] = useState<BxParticipant[]>([]);
  const [res, setRes] = useState<BxReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [a, p, r] = await Promise.all([fetchActivities(), fetchParticipants(), fetchReservations()]);
    setActs(a); setParts(p); setRes(r); setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const active = TAB_META[tab];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">QIMO Bordeaux</p>
          <h1 className="display text-2xl sm:text-3xl">Central de Operações</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPublishOpen(true)} className="btn-primary !px-5 !py-2.5"><Icon name="Rocket" size={15} /> Publicar</button>
          <button onClick={reload} className="btn-ghost !px-4 !py-2" aria-label="Atualizar"><Icon name="ArrowRight" size={14} /></button>
          <button onClick={() => supabase().auth.signOut()} className="font-sans text-[12px] text-muted hover:text-gold-deep">Sair</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-5 lg:self-start">
          <div className="card overflow-hidden p-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="border-b py-3 last:border-b-0" style={{ borderColor: "var(--line)" }}>
                <p className="px-2 pb-2 font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((key) => {
                    const item = TAB_META[key];
                    const selected = tab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={clsx(
                          "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left font-sans text-[13px] transition-colors",
                          selected ? "bg-petrol-600 text-cream" : "text-muted hover:bg-black/[0.035] hover:text-petrol-600"
                        )}
                      >
                        <Icon name={item.icon} size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-[14px] border px-5 py-4" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="kicker flex items-center gap-2"><Icon name={active.icon} size={14} /> {active.label}</p>
                <p className="mt-2 max-w-3xl font-sans text-[13px] leading-relaxed text-muted">{active.desc}</p>
              </div>
              {tab !== "inicio" && (
                <button onClick={() => setTab("preview")} className="btn-ghost !px-3 !py-2 text-[12px]">
                  <Icon name="Eye" size={14} /> Ver no guia
                </button>
              )}
            </div>
          </div>
      {(() => {
        const hints: Partial<Record<Tab, string>> = {
          inicio: "Visão geral da viagem. Toque nas ações rápidas para ir direto ao ponto.",
          roteiro: "Edite o dia a dia completo: textos, foto, portos, agenda do navio e atividades. Salvar sincroniza as reservas.",
          passeios: "Defina a capacidade (vagas) de cada passeio e mostre ou oculte no guia.",
          participantes: "Cadastre e gerencie quem está na viagem.",
          reservas: "Faça e cancele reservas dos passeios com vagas limitadas.",
          conteudo: "Edite as fichas, troque fotos e arraste os cards (⠿) para mudar a ordem no guia.",
          telas: "Troque as fotos das telas principais e edite os contatos do concierge (nome, descrição, telefone).",
          paginas: "Crie páginas novas montando blocos. Publique e elas aparecem no guia na hora.",
          textos: "Renomeie botões, troque ícones, mostre/oculte e reordene (↑/↓) os itens de menu.",
          preview: "Clique nos textos para editar e use ↑/↓ para reordenar seções — tudo salva na hora.",
        };
        return (
          <p className="hidden mt-3 items-center gap-2 font-sans text-[12px] text-muted">
            <Icon name="Info" size={13} className="shrink-0 text-gold-deep" /> {hints[tab]}
          </p>
        );
      })()}

      <div className="py-8">
        {loading && tab !== "preview" && tab !== "conteudo" && tab !== "textos" && tab !== "telas" && tab !== "roteiro" ? (
          <p className="text-center text-muted">Carregando dados…</p>
        ) : tab === "inicio" ? (
          <OperationsCenter acts={acts} parts={parts} res={res} publishing={false}
            onPublish={() => setPublishOpen(true)}
            onGo={(t) => setTab(t)} />
        ) : tab === "roteiro" ? (
          <RoteiroEditor />
        ) : tab === "passeios" ? (
          <Passeios acts={acts} onChange={reload} />
        ) : tab === "participantes" ? (
          <Participantes parts={parts} onChange={reload} />
        ) : tab === "conteudo" ? (
          <ContentCMS />
        ) : tab === "telas" ? (
          <TelasConcierge />
        ) : tab === "paginas" ? (
          <PagesBuilder />
        ) : tab === "textos" ? (
          <div className="space-y-10">
            <BotoesEditor />
            <div className="hairline" />
            <TextosEditor />
          </div>
        ) : tab === "preview" ? (
          <PreviewPane />
        ) : tab === "cobertura" ? (
          <EditabilityAudit />
        ) : (
          <Reservas acts={acts} parts={parts} res={res} onChange={reload} />
        )}
      </div>
        </section>
      </div>

      {publishOpen && <PublishModal acts={acts} onClose={() => setPublishOpen(false)} />}
    </div>
  );
}

/* ---------------- Passeios (editar capacidade) ---------------- */
function Passeios({ acts, onChange }: { acts: BxActivityFull[]; onChange: () => void }) {
  return (
    <div>
      <p className="mb-4 flex items-start gap-2 font-sans text-[13px] text-muted">
        <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-gold-deep" />
        <span>Defina a <strong>capacidade</strong> (vagas totais) de cada passeio. Deixe <strong>0</strong> para “livre” (sem limite). Passeios ocultos não aparecem no guia.</span>
      </p>
      <div className="space-y-2">
        {acts.map((a) => (
          <PasseioRow key={a.id} a={a} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
function PasseioRow({ a, onChange }: { a: BxActivityFull; onChange: () => void }) {
  const [cap, setCap] = useState(a.capacity_total ?? 0);
  const [busy, setBusy] = useState(false);
  const dirty = cap !== (a.capacity_total ?? 0);
  const save = async () => { setBusy(true); await updateCapacity(a.id, cap); await onChange(); setBusy(false); };
  const hidden = a.status === "hidden";
  const cap0 = a.capacity_total;
  const pct = cap0 ? Math.min(100, Math.round((a.reserved / cap0) * 100)) : 0;
  const tone = cap0 == null ? "muted" : (a.available ?? 0) <= 0 ? "red" : a.reserved >= cap0 * 0.8 ? "amber" : "green";
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[17px] font-light">Dia {a.day_number} · {a.title}</p>
        <p className="font-sans text-[12px] text-muted">
          {cap0 != null ? `${a.reserved} de ${cap0} vagas ocupadas` : `${a.reserved} reservados · livre`}
          {a.waitlisted > 0 && ` · ${a.waitlisted} na lista de espera`}
        </p>
        {cap0 != null && (
          <div className="mt-1.5 h-1.5 w-44 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone === "red" ? "#8f2f2f" : tone === "amber" ? "var(--gold)" : "var(--olive)" }} />
          </div>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Capacidade (vagas)</span>
        <input type="number" min={0} value={cap} onChange={(e) => setCap(parseInt(e.target.value) || 0)}
          className="w-24 rounded-[8px] border bg-transparent px-2 py-1.5 text-center font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
      </label>
      {dirty && <button disabled={busy} onClick={save} className="btn-primary !px-4 !py-2">{busy ? "…" : "Salvar"}</button>}
      <button onClick={async () => { await setHidden(a.id, !hidden); onChange(); }}
        className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px]", hidden ? "bg-black/5 text-muted" : "bg-olive/15 text-olive-deep")}>
        <Icon name={hidden ? "EyeOff" : "Eye"} size={12} /> {hidden ? "Oculto" : "Visível"}
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
        <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted">Quem faz parte da viagem. Depois use “Reservas” para inscrevê-los nos passeios.</p>
        <div className="mt-4 space-y-3">
          {[
            { k: "full_name", label: "Nome completo *" },
            { k: "family", label: "Família / grupo", hint: "Para agrupar casais e famílias." },
            { k: "phone", label: "Telefone" },
            { k: "email", label: "E-mail" },
          ].map(({ k, label, hint }) => (
            <label key={k} className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">{label}</span>
              {hint && <span className="mb-1 block font-sans text-[11px] text-muted">{hint}</span>}
              <input value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
                className="mt-1 w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
          ))}
          <label className="block">
            <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Acompanhantes</span>
            <span className="mb-1 block font-sans text-[11px] text-muted">Quantas pessoas vêm com este participante.</span>
            <input type="number" min={0} value={f.companions} onChange={(e) => setF({ ...f, companions: parseInt(e.target.value) || 0 })}
              className="mt-1 w-24 rounded-[8px] border bg-transparent px-3 py-2 text-center outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
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

  // Agrupa por passeio (para ver quem reservou o quê)
  const byActivity = acts
    .map((a) => {
      const list = active.filter((r) => r.activity_id === a.id);
      const people = list.reduce((s, r) => s + (r.seats || 1), 0);
      return { a, list, people };
    })
    .filter((g) => g.list.length > 0)
    .sort((x, y) => (x.a.day_number ?? 99) - (y.a.day_number ?? 99));

  const personLabel = (r: BxReservation) => {
    if (r.source === "guest" && r.party && r.party.length) return r.party[0];
    return r.participant?.full_name || r.guest_name || "—";
  };
  const companions = (r: BxReservation) => (r.source === "guest" && r.party ? r.party.slice(1) : []);

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="card h-fit p-6">
        <h3 className="font-serif text-xl font-light">Nova reserva</h3>
        <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted">Inscreva alguém num passeio manualmente. Os hóspedes também reservam pelo app — e aparecem aqui na hora.</p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Passeio</span>
            <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="mt-1 w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
              <option value="">Escolha o passeio…</option>
              {acts.map((a) => (
                <option key={a.id} value={a.id}>Dia {a.day_number} · {a.title} ({a.available ?? "∞"} vagas)</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Participante</span>
            <select value={participantId} onChange={(e) => setParticipantId(e.target.value)} className="mt-1 w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
              <option value="">Escolha um cadastrado…</option>
              {parts.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </label>
          {!participantId && (
            <label className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">…ou nome avulso</span>
              <span className="mb-1 block font-sans text-[11px] text-muted">Para alguém que ainda não está cadastrado em Participantes.</span>
              <input placeholder="Nome" value={guest} onChange={(e) => setGuest(e.target.value)} className="mt-1 w-full rounded-[10px] border bg-transparent px-4 py-2.5 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
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
        <p className="kicker mb-3">{active.length} reservas · {byActivity.length} passeios com inscritos</p>
        {byActivity.length === 0 && <p className="text-muted">Nenhuma reserva ainda.</p>}
        <div className="space-y-5">
          {byActivity.map(({ a, list, people }) => (
            <div key={a.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--petrol-600) 6%, transparent)" }}>
                <div className="min-w-0">
                  <p className="font-sans text-[11px] uppercase tracking-wide2 text-gold-deep">Dia {a.day_number}{a.start_time ? ` · ${a.start_time}` : ""}</p>
                  <p className="truncate font-serif text-[17px] font-light">{a.title}</p>
                </div>
                <span className="shrink-0 rounded-full bg-petrol-600/10 px-3 py-1 font-sans text-[12px] font-medium text-petrol-600">
                  {people} {people === 1 ? "pessoa" : "pessoas"}{a.capacity_total != null ? ` / ${a.capacity_total}` : ""}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {list.map((r) => {
                  const comps = companions(r);
                  return (
                    <div key={r.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-serif text-[16px] font-light">{personLabel(r)}</span>
                          {r.source === "guest"
                            ? <span className="rounded-full bg-olive/12 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-olive-deep">pelo app</span>
                            : <span className="rounded-full bg-black/[0.05] px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-muted">equipe</span>}
                          {r.status !== "confirmed" && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-gold-deep">lista de espera</span>}
                        </div>
                        <p className="mt-0.5 font-sans text-[12px] text-muted">
                          {[r.guest_phone, `${r.seats} ${r.seats === 1 ? "lugar" : "lugares"}`].filter(Boolean).join(" · ")}
                        </p>
                        {comps.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {comps.map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 font-sans text-[11px]">
                                <Icon name="Users" size={11} className="text-gold-deep" /> {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={async () => { await cancelReservation(r.id); onChange(); }} aria-label="Cancelar" className="shrink-0 text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
