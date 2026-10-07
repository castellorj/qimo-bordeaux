"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { Card, Empty, Icons, Input, LineBadge, PageHeader, Table, Td, Th, Tabs, LinkButton } from "@/components/ui";
import { ProposalStatusBadge } from "@/components/status";
import type { ProposalStatus } from "@/domain/types";
import { insurerName, partyHref, partyName, userName } from "@/domain/engines/queries";
import { proposalOptions } from "@/components/commercial/helpers";
import { date, dateTime, money0 } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { lineLabel } from "@/domain/products";
import { cn } from "@/lib/cn";

const FILTERS: { value: ProposalStatus | "todas" | "abertas"; label: string }[] = [
  { value: "abertas", label: "Em aberto" },
  { value: "todas", label: "Todas" },
  { value: "rascunho", label: "Rascunho" },
  { value: "enviada", label: "Enviadas" },
  { value: "visualizada", label: "Visualizadas" },
  { value: "aceita", label: "Aceitas" },
  { value: "recusada", label: "Recusadas" },
  { value: "expirada", label: "Expiradas" },
];
const OPEN: ProposalStatus[] = ["rascunho", "enviada", "visualizada"];

export default function PropostasPage() {
  const { db, today, visible } = useStore();
  const [status, setStatus] = useState<(typeof FILTERS)[number]["value"]>("abertas");
  const [q, setQ] = useState("");

  const all = useMemo(
    () => db.proposals.filter((p) => visible(p.party)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.proposals, visible],
  );
  const count = (s: (typeof FILTERS)[number]["value"]) => (s === "todas" ? all.length : s === "abertas" ? all.filter((p) => OPEN.includes(p.status)).length : all.filter((p) => p.status === s).length);
  const term = q.trim().toLowerCase();
  const rows = all
    .filter((p) => (status === "todas" ? true : status === "abertas" ? OPEN.includes(p.status) : p.status === status))
    .filter((p) => !term || p.code.toLowerCase().includes(term) || partyName(db, p.party).toLowerCase().includes(term) || lineLabel(p.line).toLowerCase().includes(term));

  const waiting = all.filter((p) => p.status === "enviada" || p.status === "visualizada");
  const accepted = all.filter((p) => p.status === "aceita");
  const decided = all.filter((p) => p.status === "aceita" || p.status === "recusada").length;

  return (
    <div>
      <PageHeader
        icon={<Icons.FileText className="h-5 w-5" />}
        title="Propostas"
        subtitle={<>Propostas comparativas geradas a partir das cotações. <b className="font-medium text-ink">{waiting.length}</b> aguardando o cliente · {accepted.length} aceitas{decided ? ` · taxa de aceite ${Math.round((accepted.length / decided) * 100)}%` : ""}</>}
        actions={<LinkButton href="/cotacoes/nova" variant="primary" icon={<Icons.Plus className="h-4 w-4" />}>Nova cotação</LinkButton>}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-3">
          <Tabs value={status} onChange={setStatus} tabs={FILTERS.map((f) => ({ value: f.value, label: f.label, count: count(f.value) }))} />
          <div className="relative mb-2 w-full max-w-xs">
            <Icons.Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, cliente ou ramo…" className="pl-8" />
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Proposta</Th>
              <Th>Cliente</Th>
              <Th>Ramo</Th>
              <Th className="text-center">Opções</Th>
              <Th>Recomendada</Th>
              <Th className="text-right">Prêmio anual</Th>
              <Th>Enviada</Th>
              <Th>Visualizada</Th>
              <Th>Validade</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const { options, recommended } = proposalOptions(db, p);
              const validDays = daysBetween(today, p.validUntil);
              const open = OPEN.includes(p.status);
              return (
                <tr key={p.id} className="hover:bg-canvas">
                  <Td>
                    <Link href={`/propostas/${p.id}`} className="font-medium text-ink hover:text-brand-700">{p.code}</Link>
                    <div className="text-2xs text-ink-muted">{userName(db, p.ownerId)}</div>
                  </Td>
                  <Td><Link href={partyHref(p.party)} className="text-ink-soft hover:text-ink">{partyName(db, p.party)}</Link></Td>
                  <Td><LineBadge line={p.line} /></Td>
                  <Td className="text-center tabular-nums">{options.length}</Td>
                  <Td className="text-xs text-ink-soft">{recommended ? <>{insurerName(db, recommended.insurerId)} <span className="text-ink-muted">· {recommended.productName}</span></> : <span className="text-ink-faint">—</span>}</Td>
                  <Td className="text-right tabular-nums font-medium">{recommended ? money0(recommended.annualPremium) : "—"}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink-muted">{p.sentAt ? dateTime(p.sentAt) : "—"}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink-muted">{p.viewedAt ? dateTime(p.viewedAt) : p.sentAt ? <span className="text-ink-faint">não aberta</span> : "—"}</Td>
                  <Td className={cn("whitespace-nowrap text-xs", open && validDays < 0 ? "font-medium text-danger" : open && validDays <= 3 ? "font-medium text-warn-strong" : "text-ink-muted")}>
                    {date(p.validUntil)}
                    {open && <div className="text-2xs">{validDays < 0 ? `venceu há ${-validDays}d` : validDays === 0 ? "vence hoje" : `${validDays} dias`}</div>}
                  </Td>
                  <Td><ProposalStatusBadge status={p.status} /></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {!rows.length && <Empty icon={<Icons.FileSearch className="h-5 w-5" />} title="Nenhuma proposta encontrada">Ajuste os filtros ou gere uma proposta a partir de uma cotação.</Empty>}
      </Card>
    </div>
  );
}
