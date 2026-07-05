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

type QuickTab = "passeios" | "participantes" | "reservas" | "conteudo" | "textos" | "preview";

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

  const quick: { icon: string; label: string; go: QuickTab }[] = [
    { icon: "CalendarDays", label: "Programação & passeios", go: "passeios" },
    { icon: "Users", label: "Adicionar participante", go: "participantes" },
    { icon: "Ticket", label: "Nova reserva", go: "reservas" },
    { icon: "Image", label: "Trocar fotos", go: "conteudo" },
    { icon: "LayoutGrid", label: "Editar conteúdo", go: "conteudo" },
    { icon: "Languages", label: "Editar textos & botões", go: "textos" },
    { icon: "Eye", label: "Pré-visualizar guia", go: "preview" },
  ];

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

      {/* Ações rápidas */}
      <div>
        <p className="kicker mb-3">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quick.map((q) => (
            <button key={q.label} onClick={() => onGo(q.go)}
              className="card flex items-center gap-3 p-4 text-left transition-transform hover:-translate-y-0.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-petrol-600/10 text-petrol-600"><Icon name={q.icon} size={16} /></span>
              <span className="font-sans text-[13px] font-medium leading-tight" style={{ color: "var(--text)" }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
