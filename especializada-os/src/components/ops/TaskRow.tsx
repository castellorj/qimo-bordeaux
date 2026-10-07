"use client";
import Link from "next/link";
import type { Task } from "@/domain/types";
import { useStore } from "@/data/store";
import { completeTask, snoozeTask } from "@/data/actions";
import { Badge, Icons } from "@/components/ui";
import { partyHref, partyName, partyPhone } from "@/domain/engines/queries";
import { relDays } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { waLink } from "@/integrations/whatsapp";

const CAT: Record<Task["category"], string> = {
  follow_up: "Follow-up", documento: "Documento", renovacao: "Renovação", cotacao: "Cotação", emissao: "Emissão", pendencia: "Pendência", cross_sell: "Oportunidade", revisao: "Revisão IA",
};

export function relatedHref(t: Task) {
  if (!t.related) return t.party ? partyHref(t.party) : undefined;
  const r = t.related;
  return r.type === "policy" ? `/apolices/${r.id}` : r.type === "proposal" ? `/propostas/${r.id}` : r.type === "quote" ? `/cotacoes/${r.id}` : r.type === "renewal" ? `/renovacoes?id=${r.id}` : r.type === "document" ? `/documentos?revisar=${r.id}` : t.party ? partyHref(t.party) : "/crm";
}

export function TaskRow({ task, score, reasons, compact }: { task: Task; score?: number; reasons?: string[]; compact?: boolean }) {
  const { db, today, update, toast } = useStore();
  const due = daysBetween(today, task.due);
  const done = task.status === "concluida";
  const href = relatedHref(task);
  const phone = task.party ? partyPhone(db, task.party) : undefined;
  const owner = db.users.find((u) => u.id === task.ownerId);
  return (
    <div className={cn("group flex items-start gap-3 px-4 py-3 hover:bg-canvas", done && "opacity-60")}>
      <button onClick={() => { update((d, u) => completeTask(d, u, task.id)); toast(done ? "Tarefa reaberta" : "Tarefa concluída"); }} className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition", done ? "border-ok bg-ok text-white" : "border-line hover:border-ok hover:text-ok")} aria-label="Concluir">
        <Icons.Check className={cn("h-3 w-3", !done && "opacity-0 group-hover:opacity-100")} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {href ? <Link href={href} className={cn("text-sm font-medium text-ink hover:text-brand-700", done && "line-through")}>{task.title}</Link> : <span className="text-sm font-medium text-ink">{task.title}</span>}
          <Badge tone={task.category === "renovacao" ? "warn" : task.category === "revisao" ? "violet" : "neutral"}>{CAT[task.category]}</Badge>
          {task.origin !== "manual" && <Badge tone="brand"><Icons.Zap className="h-2.5 w-2.5" />automática</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
          {task.party && <Link href={partyHref(task.party)} className="hover:text-ink">{partyName(db, task.party)}</Link>}
          <span className={cn(!done && due < 0 && "font-medium text-danger", !done && due === 0 && "font-medium text-warn-strong")}>{due < 0 ? `atrasada ${relDays(task.due)}` : `vence ${relDays(task.due)}`}</span>
          {task.waitingOn && <span>aguardando {task.waitingOn}{task.waitingSince ? ` há ${daysBetween(task.waitingSince, today)}d` : ""}</span>}
          {!compact && owner && <span>{owner.name.split(" ")[0]}</span>}
          {!compact && reasons && reasons.length > 0 && <span className="text-ink-faint">· {reasons.join(" · ")}</span>}
        </div>
      </div>
      {score != null && <span title="Pontuação de prioridade" className="hidden rounded bg-line-soft px-1.5 py-0.5 text-2xs tabular-nums text-ink-muted sm:block">{score}</span>}
      {!done && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          {phone && <a href={waLink(phone, "")} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="rounded p-1.5 text-ink-muted hover:bg-white hover:text-ok"><Icons.MessageCircle className="h-4 w-4" /></a>}
          <button title="Adiar 1 dia" onClick={() => { update((d) => snoozeTask(d, task.id, 1)); toast("Adiada para amanhã", "info"); }} className="rounded p-1.5 text-ink-muted hover:bg-white hover:text-ink"><Icons.AlarmClock className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
