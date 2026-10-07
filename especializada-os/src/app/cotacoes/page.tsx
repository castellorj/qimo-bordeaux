"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Badge, Card, Icons, LineBadge, LinkButton, PageHeader, Table, Td, Th } from "@/components/ui";
import { partyName, insurerName, userName } from "@/domain/engines/queries";
import { dateTime, money0 } from "@/lib/format";

function Cotacoes() {
  const { db, visible } = useStore();
  const gerar = useSearchParams().get("gerar");
  const quotes = db.quotes.filter((q) => visible(q.party)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader icon={<Icons.Calculator className="h-5 w-5" />} title="Cotações" subtitle="Quote Engine · multicálculo · comparadores" actions={<LinkButton href="/cotacoes/nova" variant="primary" icon={<Icons.Plus className="h-4 w-4" />}>Nova cotação</LinkButton>} />
      {gerar && <div className="mb-3 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800"><Icons.Info className="h-4 w-4" />Propostas são geradas a partir de uma cotação: abra a cotação, selecione as opções e clique em “Gerar proposta”.</div>}
      <Card padded={false}>
        <Table>
          <thead><tr><Th>Cliente</Th><Th>Ramo</Th><Th>Status</Th><Th>Resultados</Th><Th className="text-right">Melhor prêmio</Th><Th>Melhor seguradora</Th><Th>Criada</Th><Th>Por</Th></tr></thead>
          <tbody>
            {quotes.map((q) => {
              const ok = q.results.filter((r) => r.status === "ok").sort((a, b) => a.annualPremium - b.annualPremium);
              return (
                <tr key={q.id} className="hover:bg-canvas">
                  <Td><Link href={`/cotacoes/${q.id}`} className="font-medium hover:text-brand-700">{partyName(db, q.party)}</Link></Td>
                  <Td><LineBadge line={q.line} /></Td>
                  <Td><Badge tone={q.status === "proposta_gerada" ? "ok" : q.status === "calculado" ? "brand" : "neutral"}>{q.status === "proposta_gerada" ? "Proposta gerada" : q.status === "calculado" ? "Calculada" : "Rascunho"}</Badge></Td>
                  <Td className="text-sm">{ok.length} ok{q.results.length > ok.length ? <span className="text-ink-muted"> · {q.results.length - ok.length} outros</span> : null}</Td>
                  <Td className="text-right tabular-nums">{ok[0] ? money0(ok[0].annualPremium) : "—"}</Td>
                  <Td className="text-sm">{ok[0] ? insurerName(db, ok[0].insurerId) : "—"}</Td>
                  <Td className="text-xs text-ink-muted">{dateTime(q.createdAt)}</Td>
                  <Td className="text-xs">{userName(db, q.createdBy)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
export default function Page() {
  return <Suspense><Cotacoes /></Suspense>;
}
