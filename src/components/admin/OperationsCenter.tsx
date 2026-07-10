"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { listRecentChanges, contentCounts, type ChangeRow, type KindCount } from "@/lib/supabase/content-admin";
import type { BxActivityFull, BxParticipant, BxReservation } from "@/lib/supabase/bordeaux";
import clsx from "clsx";

const TRIP = { name: "QIMO Bordeaux Experience", ship: "SS Bon Voyage", start: "2026-10-25", end: "2026-11-01" };

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}
function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}
const KIND_LABEL: Record<string, string> = {
  city: "Cidade", winery: "Vinícola", restaurant: "Restaurante", wine: "Vinho",
  gastronomy: "Gastronomia", experience: "Experiência", shopping: "Compras",
};

type QuickTab = "roteiro" | "passeios" | "participantes" | "reservas" | "conteudo" | "telas" | "paginas" | "textos" | "preview";

// Hub "O que deseja editar?" — mesma estrutura do painel do guia da Croácia:
// seções temáticas com links diretos para o editor certo.
const HUB: { icon: string; title: string; desc: string; items: { label: string; hint?: string; go: QuickTab }[] }[] = [
  {
    icon: "Smartphone",
    title: "Telas de entrada",
    desc: "As primeiras telas que o hóspede vê: Viagem (porta de entrada) e Hoje.",
    items: [
      { label: "Fotos das telas (Viagem e Hoje)", hint: "troque a foto de fundo · sem republicar", go: "telas" },
      { label: "Frases e títulos das telas", hint: "saudação, chamadas e botões", go: "textos" },
    ],
  },
  {
    icon: "CalendarDays",
    title: "Programação",
    desc: "O roteiro dia a dia — dias, atividades, vagas e textos.",
    items: [
      { label: "Editar roteiro (dias e atividades)", hint: "títulos, horários, descrições, fotos, agenda do navio", go: "roteiro" },
      { label: "Passeios: vagas e visibilidade", hint: "capacidade de cada passeio · ocultar/mostrar", go: "passeios" },
      { label: "Textos do botão do dia", hint: "“Ver programação do dia”, “atividades”…", go: "textos" },
    ],
  },
  {
    icon: "Ticket",
    title: "Reservas & Participantes",
    desc: "Quem vai a cada passeio — reservas feitas pelo app e pela equipe.",
    items: [
      { label: "Reservas por passeio", hint: "quem reservou, acompanhantes, lista de espera", go: "reservas" },
      { label: "Participantes", hint: "cadastro de quem está na viagem", go: "participantes" },
    ],
  },
  {
    icon: "Grape",
    title: "Descobrir (conteúdo)",
    desc: "Cidades, vinícolas, restaurantes, vinhos, gastronomia, experiências e compras.",
    items: [
      { label: "Fichas & fotos", hint: "edite textos, troque fotos, arraste para reordenar", go: "conteudo" },
      { label: "Editar direto no site (visual)", hint: "clique nos textos do guia e salve na hora", go: "preview" },
    ],
  },
  {
    icon: "Bell",
    title: "Concierge",
    desc: "Os contatos do balão flutuante e da página Concierge.",
    items: [
      { label: "Contatos (editar, ocultar, excluir, incluir)", hint: "nome, descrição, telefone, tipo e ícone", go: "telas" },
    ],
  },
  {
    icon: "BookOpen",
    title: "Páginas novas",
    desc: "Crie páginas extras montando blocos — aparecem no guia na hora.",
    items: [
      { label: "Construtor de páginas", go: "paginas" },
    ],
  },
];

export function OperationsCenter({
  acts, parts, res, onGo, onPublish, publishing,
}: {
  acts: BxActivityFull[];
  parts: BxParticipant[];
  res: BxReservation[];
  onGo: (t: QuickTab) => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [counts, setCounts] = useState<KindCount[]>([]);

  useEffect(() => {
    listRecentChanges(8).then(setChanges).catch(() => {});
    contentCounts().then(setCounts).catch(() => {});
  }, []);

  const dLeft = daysUntil(TRIP.start);
  const confirmed = res.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.seats, 0);
  const waitlist = res.filter((r) => r.status === "waitlist").reduce((s, r) => s + r.seats, 0);
  const soldOut = acts.filter((a) => a.capacity_total != null && (a.available ?? 0) <= 0);
  const few = acts.filter((a) => a.capacity_total != null && (a.available ?? 0) > 0 && a.reserved >= a.capacity_total * 0.8);
  const totalNoPhoto = counts.reduce((s, c) => s + c.noPhoto, 0);
  const totalHidden = counts.reduce((s, c) => s + c.hidden, 0);

  const pend: { icon: string; tone: string; text: string; go?: QuickTab }[] = [];
  if (soldOut.length) pend.push({ icon: "AlertTriangle", tone: "red", text: `${soldOut.length} passeio(s) esgotado(s)${waitlist ? ` · ${waitlist} em lista de espera` : ""}`, go: "reservas" });
  if (few.length) pend.push({ icon: "TrendingUp", tone: "amber", text: `${few.length} passeio(s) com poucas vagas`, go: "passeios" });
  if (totalNoPhoto) pend.push({ icon: "Image", tone: "amber", text: `${totalNoPhoto} item(ns) de conteúdo sem foto`, go: "conteudo" });
  if (totalHidden) pend.push({ icon: "EyeOff", tone: "muted", text: `${totalHidden} item(ns) ocultos do guia`, go: "conteudo" });
  if (!parts.length) pend.push({ icon: "Users", tone: "muted", text: "Nenhum participante cadastrado ainda", go: "participantes" });

  return (
    <div className="space-y-8">
      {/* Viagem atual + publicar */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Viagem atual</p>
            <h2 className="display mt-1 text-2xl sm:text-3xl">{TRIP.name}</h2>
            <p className="mt-1 font-sans text-[13px] text-muted">
              {TRIP.ship} · {fmtDate(TRIP.start)} – {fmtDate(TRIP.end)} de 2026
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-petrol-600/10 px-3 py-1.5">
              <Icon name="Clock" size={14} className="text-petrol-600" />
              <span className="font-sans text-[12px] font-medium text-petrol-600">
                {dLeft > 0 ? `Faltam ${dLeft} dias para o embarque` : dLeft === 0 ? "Embarque hoje!" : "Viagem em andamento / concluída"}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <button onClick={onPublish} disabled={publishing}
              className="btn-primary w-full !px-6 !py-3.5 text-[15px] sm:w-auto">
              <Icon name="Rocket" size={17} /> {publishing ? "Publicando…" : "Publicar Alterações"}
            </button>
            <p className="mt-2 text-center font-sans text-[11px] text-muted sm:text-right">Conteúdo reflete no ar em segundos</p>
          </div>
        </div>
      </div>

      {/* O que deseja editar? — hub no estilo do painel da Croácia */}
      <div>
        <h2 className="display text-2xl">O que deseja editar?</h2>
        <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
          O guia da viagem (telas, programação, conteúdo, concierge…). As mudanças aparecem no app em instantes, sem republicar.
        </p>

        <button onClick={() => onGo("textos")}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-[12px] border px-5 py-4 text-left transition-colors hover:border-gold"
          style={{ borderColor: "color-mix(in srgb, var(--gold) 45%, transparent)", background: "color-mix(in srgb, var(--gold) 6%, transparent)" }}>
          <span>
            <span className="block font-serif text-lg font-light leading-tight" style={{ color: "var(--text)" }}>Renomear títulos das seções</span>
            <span className="font-sans text-[11px] text-muted">“Ver programação do dia”, menus, botões, títulos das páginas… edite qualquer um</span>
          </span>
          <Icon name="ArrowRight" size={16} className="shrink-0 text-gold-deep" />
        </button>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {HUB.map((s) => (
            <section key={s.title} className="card flex flex-col p-6">
              <div className="flex items-center gap-3">
                <Icon name={s.icon} size={22} className="text-gold-deep" />
                <h3 className="font-serif text-2xl font-light">{s.title}</h3>
              </div>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{s.desc}</p>
              <ul className="mt-4 space-y-2">
                {s.items.map((it) => (
                  <li key={it.label}>
                    <button onClick={() => onGo(it.go)}
                      className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[10px] border px-4 py-2 text-left transition-colors hover:border-gold"
                      style={{ borderColor: "var(--line)" }}>
                      <span>
                        <span className="block font-serif text-[17px] font-light leading-tight" style={{ color: "var(--text)" }}>{it.label}</span>
                        {it.hint && <span className="font-sans text-[11px] text-muted">{it.hint}</span>}
                      </span>
                      <Icon name="ArrowRight" size={15} className="shrink-0 text-gold-deep" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* Números-chave */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { n: parts.length, l: "Participantes", icon: "Users", tone: "" },
          { n: confirmed, l: "Lugares confirmados", icon: "Check", tone: "green" },
          { n: acts.length, l: "Passeios ativos", icon: "Ticket", tone: "" },
          { n: soldOut.length, l: "Esgotados", icon: "AlertTriangle", tone: soldOut.length ? "red" : "" },
        ].map((s) => (
          <div key={s.l} className="card p-4 text-center">
            <p className={clsx("font-serif text-4xl font-light", s.tone === "red" ? "text-[#8f2f2f]" : s.tone === "green" ? "text-olive-deep" : "text-petrol-600")}>{s.n}</p>
            <p className="mt-1 font-sans text-[11px] uppercase tracking-wide2 text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pendências */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-serif text-xl font-light"><Icon name="Bell" size={17} className="text-gold-deep" /> Pendências</h3>
          <div className="mt-4 space-y-2">
            {pend.length === 0 ? (
              <p className="flex items-center gap-2 font-sans text-[13px] text-olive-deep"><Icon name="CircleCheck" size={16} /> Tudo em ordem. Nenhuma pendência.</p>
            ) : (
              pend.map((p, i) => (
                <button key={i} onClick={() => p.go && onGo(p.go)}
                  className="flex w-full items-center gap-3 rounded-[10px] border p-3 text-left transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }}>
                  <span className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded-full",
                    p.tone === "red" ? "bg-[#8f2f2f]/12 text-[#8f2f2f]" : p.tone === "amber" ? "bg-gold/15 text-gold-deep" : "bg-black/5 text-muted")}>
                    <Icon name={p.icon} size={14} />
                  </span>
                  <span className="flex-1 font-sans text-[13px]" style={{ color: "var(--text)" }}>{p.text}</span>
                  <Icon name="ChevronRight" size={15} className="text-muted" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Últimas alterações */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-serif text-xl font-light"><Icon name="Clock" size={17} className="text-gold-deep" /> Últimas alterações</h3>
          <div className="mt-4 space-y-1">
            {changes.length === 0 ? (
              <p className="font-sans text-[13px] text-muted">Sem alterações registradas ainda.</p>
            ) : (
              changes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-1.5">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-muted">{KIND_LABEL[c.kind] || c.kind}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[13px]" style={{ color: "var(--text)" }}>{c.name}</span>
                  {!c.published && <Icon name="EyeOff" size={13} className="text-muted" />}
                  <span className="shrink-0 font-sans text-[11px] text-muted">{relTime(c.updated_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
