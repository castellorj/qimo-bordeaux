"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { moveOpportunity } from "@/data/actions";
import { Avatar, Badge, Button, Card, Dialog, Field, Icons, Input, LineIcon, PageHeader, Segmented, Select, Table, Td, Th } from "@/components/ui";
import { STAGE_LABEL, StageBadge } from "@/components/status";
import { insurerName, partyHref, partyName, userName } from "@/domain/engines/queries";
import { PIPELINE_STAGES, type Opportunity, type PipelineStage } from "@/domain/types";
import { PRODUCTS, lineLabel } from "@/domain/products";
import { moneyK, money0, relTime, dateTime } from "@/lib/format";
import { includesNorm } from "@/lib/text";
import { cn } from "@/lib/cn";

const ORIGIN: Record<Opportunity["origin"], string> = { manual: "Manual", renovacao: "Renovação", "cross-sell": "Cross-sell", indicacao: "Indicação", site: "Site", importacao: "Importação" };

function CRM() {
  const { db, visible, update, toast, can } = useStore();
  const params = useSearchParams();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [owner, setOwner] = useState("");
  const [line, setLine] = useState("");
  const [insurer, setInsurer] = useState("");
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [lost, setLost] = useState<{ id: string; reason: string } | null>(null);
  const [hist, setHist] = useState<Opportunity | null>(() => db.opportunities.find((o) => o.id === params.get("id")) ?? null);
  const stageFilter = params.get("etapa");

  const opps = useMemo(() => db.opportunities.filter((o) => visible(o.party) && (!owner || o.ownerId === owner) && (!line || o.line === line) && (!insurer || o.insurerId === insurer) && (!q || includesNorm(o.title, q) || includesNorm(partyName(db, o.party), q))), [db, visible, owner, line, insurer, q]);
  const stages: PipelineStage[] = [...PIPELINE_STAGES, "perdido"];
  const move = (id: string, stage: PipelineStage) => {
    if (!can("crm.edit")) return toast("Sem permissão para mover oportunidades", "warn");
    if (stage === "perdido") return setLost({ id, reason: "" });
    update((d, u) => moveOpportunity(d, u, id, stage));
    toast(`Movida para ${STAGE_LABEL[stage]} — histórico registrado`);
  };

  return (
    <div>
      <PageHeader icon={<Icons.KanbanSquare className="h-5 w-5" />} title="CRM" subtitle={`${opps.filter((o) => !["emitido", "perdido"].includes(o.stage)).length} oportunidades abertas · ${moneyK(opps.filter((o) => !["emitido", "perdido"].includes(o.stage)).reduce((s, o) => s + o.estimatedPremium, 0))} em prêmio estimado`} actions={<Segmented value={view} onChange={setView} options={[{ value: "kanban", label: "Kanban" }, { value: "lista", label: "Lista" }]} />} />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-60"><Icons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar oportunidade ou cliente" className="pl-8" /></div>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-44"><option value="">Responsável: todos</option>{db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select value={line} onChange={(e) => setLine(e.target.value)} className="w-40"><option value="">Produto: todos</option>{PRODUCTS.map((p) => <option key={p.line} value={p.line}>{p.label}</option>)}</Select>
        <Select value={insurer} onChange={(e) => setInsurer(e.target.value)} className="w-44"><option value="">Seguradora: todas</option>{db.insurers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select>
      </div>
      {view === "kanban" ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8">
          {stages.map((s) => {
            const items = opps.filter((o) => o.stage === s).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            return (
              <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) move(drag, s); setDrag(null); }} className={cn("flex w-64 shrink-0 flex-col rounded-xl bg-line-soft/70 p-2", stageFilter === s && "ring-2 ring-brand-300", s === "perdido" && "bg-danger-soft/50")}>
                <div className="mb-2 flex items-center justify-between px-1.5">
                  <span className="text-xs font-semibold text-ink-soft">{STAGE_LABEL[s]} <span className="text-ink-faint">{items.length}</span></span>
                  <span className="text-2xs tabular-nums text-ink-muted">{moneyK(items.reduce((a, o) => a + o.estimatedPremium, 0))}</span>
                </div>
                <div className="flex min-h-24 flex-col gap-2">
                  {items.map((o) => (
                    <div key={o.id} draggable={can("crm.edit")} onDragStart={() => setDrag(o.id)} onDragEnd={() => setDrag(null)} className={cn("cursor-grab rounded-lg border border-line bg-white p-2.5 shadow-sm active:cursor-grabbing", drag === o.id && "opacity-50")}>
                      <div className="flex items-start gap-2">
                        <LineIcon line={o.line} className="mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button onClick={() => setHist(o)} className="text-left text-sm font-medium leading-snug text-ink hover:text-brand-700">{o.title}</button>
                          <Link href={partyHref(o.party)} className="block truncate text-xs text-ink-muted hover:text-ink">{partyName(db, o.party)}</Link>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        {o.origin !== "manual" && <Badge tone={o.origin === "renovacao" ? "warn" : o.origin === "cross-sell" ? "violet" : "neutral"}>{ORIGIN[o.origin]}</Badge>}
                        {o.estimatedPremium > 0 && <span className="text-2xs tabular-nums text-ink-soft">{money0(o.estimatedPremium)}</span>}
                        <span className="ml-auto"><Avatar name={userName(db, o.ownerId)} size="sm" tone="neutral" /></span>
                      </div>
                      {o.lostReason && <div className="mt-1.5 text-2xs text-danger">{o.lostReason}</div>}
                      <div className="mt-1.5 flex items-center justify-between text-2xs text-ink-faint">
                        <span>{relTime(o.updatedAt)}</span>
                        {o.quoteId && <Link href={`/cotacoes/${o.quoteId}`} className="text-brand-700">cotação →</Link>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padded={false}>
          <Table>
            <thead><tr><Th>Oportunidade</Th><Th>Cliente</Th><Th>Produto</Th><Th>Etapa</Th><Th>Origem</Th><Th>Seguradora</Th><Th className="text-right">Valor</Th><Th>Responsável</Th><Th>Atualizada</Th></tr></thead>
            <tbody>
              {opps.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <Td><button onClick={() => setHist(o)} className="font-medium hover:text-brand-700">{o.title}</button></Td>
                  <Td><Link href={partyHref(o.party)} className="text-sm hover:text-brand-700">{partyName(db, o.party)}</Link></Td>
                  <Td className="text-sm">{lineLabel(o.line)}</Td>
                  <Td><Select value={o.stage} onChange={(e) => move(o.id, e.target.value as PipelineStage)} className="h-7 w-40 text-xs">{stages.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</Select></Td>
                  <Td className="text-xs">{ORIGIN[o.origin]}</Td>
                  <Td className="text-xs">{o.insurerId ? insurerName(db, o.insurerId) : "—"}</Td>
                  <Td className="text-right tabular-nums">{money0(o.estimatedPremium)}</Td>
                  <Td className="text-xs">{userName(db, o.ownerId)}</Td>
                  <Td className="text-xs text-ink-muted">{relTime(o.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <Dialog open={!!lost} onClose={() => setLost(null)} title="Marcar como perdida" footer={<><Button variant="secondary" onClick={() => setLost(null)}>Cancelar</Button><Button variant="danger" disabled={!lost?.reason.trim()} onClick={() => { update((d, u) => moveOpportunity(d, u, lost!.id, "perdido", lost!.reason)); toast("Oportunidade perdida — motivo registrado para o relatório de perdas", "info"); setLost(null); }}>Confirmar</Button></>}>
        <Field label="Motivo da perda (alimenta o relatório de propostas perdidas)"><Input value={lost?.reason ?? ""} onChange={(e) => setLost((l) => (l ? { ...l, reason: e.target.value } : l))} placeholder="Ex.: preço, cobertura, fechou com concorrente…" autoFocus /></Field>
      </Dialog>
      <Dialog open={!!hist} onClose={() => setHist(null)} title={hist?.title ?? ""}>
        {hist && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><StageBadge stage={hist.stage} /><span className="text-ink-muted">{partyName(db, hist.party)} · {lineLabel(hist.line)} · {money0(hist.estimatedPremium)}</span></div>
            <div className="text-xs font-semibold text-ink-soft">Histórico automático</div>
            <ol className="mt-2 space-y-2">{[...hist.stageHistory].reverse().map((h, i) => <li key={i} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{STAGE_LABEL[h.stage]}<span className="text-xs text-ink-muted">· {userName(db, h.by)} · {dateTime(h.at)}</span></li>)}</ol>
            <div className="mt-4 flex gap-2">
              {hist.quoteId ? <Link href={`/cotacoes/${hist.quoteId}`} className="text-sm font-medium text-brand-700">Abrir cotação</Link> : <Link href={`/cotacoes/nova?ramo=${hist.line}&${hist.party.type === "person" ? "cliente" : "empresa"}=${hist.party.id}${hist.renewalOfPolicyId ? `&renovacao=${hist.renewalOfPolicyId}` : ""}`} className="text-sm font-medium text-brand-700">Iniciar cotação</Link>}
              {hist.proposalId && <Link href={`/propostas/${hist.proposalId}`} className="text-sm font-medium text-brand-700">Abrir proposta</Link>}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
export default function Page() {
  return <Suspense><CRM /></Suspense>;
}
