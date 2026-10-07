"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/data/store";
import { createOpportunity } from "@/data/actions";
import { Avatar, Badge, Button, Card, DemoBadge, Empty, Icons, KeyVal, LineBadge, LineIcon, LinkButton, PageHeader, Table, Td, Th } from "@/components/ui";
import { DaysBadge, StageBadge, ProposalStatusBadge } from "@/components/status";
import { TaskRow } from "@/components/ops/TaskRow";
import { activePolicies, assetLabel, assetsOf, insurerName, peopleOf, policiesOfParty, sameParty, userName, householdOf } from "@/domain/engines/queries";
import { crossSellFor } from "@/domain/engines/crosssell";
import { COMPANY_CORE_LINES, lineLabel } from "@/domain/products";
import { daysBetween } from "@/lib/dates";
import { date, maskCNPJ, money0, phone } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function Empresa() {
  const { id } = useParams<{ id: string }>();
  const { db, today, visible, update, toast } = useStore();
  const c = db.companies.find((x) => x.id === id);
  if (!c) return <Empty title="Empresa não encontrada" />;
  const ref = { type: "company" as const, id };
  if (!visible(ref)) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso a esta empresa" />;
  const people = peopleOf(db, id);
  const pols = activePolicies(policiesOfParty(db, ref));
  const sugg = crossSellFor(db, ref, today);
  const ad = db.addresses.find((a) => a.id === c.addressId);
  const assets = assetsOf(db, ref);
  const opps = db.opportunities.filter((o) => sameParty(o.party, ref));
  const props = db.proposals.filter((p) => sameParty(p.party, ref));
  const tasks = db.tasks.filter((t) => sameParty(t.party, ref) && t.status === "aberta");

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "Empresas", href: "/empresas" }]} icon={<Icons.Building2 className="h-5 w-5" />} title={<span className="flex items-center gap-2">{c.tradeName}<DemoBadge /></span>} subtitle={`${c.legalName} · CNPJ ${maskCNPJ(c.cnpj)} · ${c.sector}`}
        actions={<LinkButton href={`/cotacoes/nova?empresa=${id}`} variant="primary" icon={<Icons.Calculator className="h-4 w-4" />}>Nova cotação</LinkButton>} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card title="Dados">
            <KeyVal k="Funcionários" v={c.employees} />
            <KeyVal k="Telefone" v={phone(c.phone)} />
            <KeyVal k="E-mail" v={c.email ?? "—"} />
            <KeyVal k="Endereço" v={ad ? `${ad.street}, ${ad.number} — ${ad.district}` : "—"} />
            <KeyVal k="Corretor" v={userName(db, c.ownerId)} />
            <KeyVal k="Cliente desde" v={date(c.clientSince)} />
          </Card>
          <Card title="Sócios e pessoas" subtitle="Navegue pessoa ↔ família ↔ empresa">
            <div className="space-y-1.5">
              {people.map(({ rel, person }) => { const hh = householdOf(db, person.id); return (
                <div key={rel.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-line-soft">
                  <Avatar name={person.name} size="sm" />
                  <Link href={`/clientes/${person.id}`} className="flex-1 text-sm hover:text-brand-700">{person.name}</Link>
                  {hh && <Link href={`/familias/${hh.id}`} title={hh.name} className="text-ink-faint hover:text-brand-600"><Icons.HeartHandshake className="h-3.5 w-3.5" /></Link>}
                  <Badge tone={rel.role === "sócio" ? "brand" : "neutral"}>{rel.role}{rel.share ? ` ${rel.share}%` : ""}</Badge>
                </div>); })}
            </div>
            <p className="mt-2 text-2xs text-ink-muted">Funcionários cadastrados: {people.filter((p) => p.rel.role === "funcionário").length} de {c.employees} (vidas do plano empresarial ficam no módulo saúde).</p>
          </Card>
          {assets.length > 0 && <Card title="Frota e patrimônio">{assets.map((a) => <div key={a.id} className="py-1 text-sm">{assetLabel(db, a)}</div>)}</Card>}
        </div>
        <div className="space-y-4 xl:col-span-2">
          <Card title="Produtos corporativos" subtitle="O que a empresa tem e o que falta">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {COMPANY_CORE_LINES.map((l) => { const p = pols.find((x) => x.line === l); return (
                <div key={l} className={cn("rounded-lg border p-3", p ? "border-emerald-200 bg-ok-soft/50" : "border-dashed border-line")}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold"><LineIcon line={l} />{lineLabel(l)}</div>
                  {p ? <Link href={`/apolices/${p.id}`} className="mt-1 block text-xs text-ink-soft hover:text-brand-700">{insurerName(db, p.insurerId)} · vence {date(p.end)}</Link> : <div className="mt-1 text-xs text-ink-faint">não contratado</div>}
                </div>); })}
            </div>
            {sugg.length > 0 && <div className="mt-3 space-y-2">{sugg.map((s) => (
              <div key={s.line} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <LineIcon line={s.line} /><div className="flex-1 text-sm"><b className="font-medium">{lineLabel(s.line)}</b> <span className="text-ink-muted">— {s.reason}</span></div>
                <Button size="sm" variant="secondary" onClick={() => { update((d, u) => createOpportunity(d, u, { title: `${lineLabel(s.line)} — ${c.tradeName}`, party: ref, line: s.line, estimatedPremium: 0, origin: "cross-sell", ownerId: c.ownerId ?? "u-ana" }).db); toast("Oportunidade criada no CRM"); }}>Criar oportunidade</Button>
              </div>))}</div>}
          </Card>
          <Card title="Apólices" padded={false}>
            <Table>
              <thead><tr><Th>Ramo</Th><Th>Seguradora</Th><Th>Produto</Th><Th>Vencimento</Th><Th className="text-right">Prêmio/ano</Th></tr></thead>
              <tbody>{pols.map((p) => <tr key={p.id} className="hover:bg-canvas"><Td><LineBadge line={p.line} /></Td><Td><Link href={`/apolices/${p.id}`} className="hover:text-brand-700">{insurerName(db, p.insurerId)}</Link></Td><Td className="text-sm">{p.productName}</Td><Td><DaysBadge days={daysBetween(today, p.end)} /></Td><Td className="text-right tabular-nums">{money0(p.annualPremium)}</Td></tr>)}</tbody>
            </Table>
          </Card>
          {(opps.length > 0 || props.length > 0) && <Card title="Comercial">
            {opps.map((o) => <Link key={o.id} href={o.quoteId ? `/cotacoes/${o.quoteId}` : "/crm"} className="flex items-center gap-3 py-1.5 text-sm"><LineIcon line={o.line} /><span className="flex-1">{o.title}</span><StageBadge stage={o.stage} /></Link>)}
            {props.map((p) => <Link key={p.id} href={`/propostas/${p.id}`} className="flex items-center gap-3 py-1.5 text-sm"><Icons.FileText className="h-4 w-4 text-ink-muted" /><span className="flex-1">Proposta {p.code}</span><ProposalStatusBadge status={p.status} /></Link>)}
          </Card>}
          {tasks.length > 0 && <Card title="Tarefas abertas" padded={false}><div className="divide-y divide-line-soft">{tasks.map((t) => <TaskRow key={t.id} task={t} compact />)}</div></Card>}
        </div>
      </div>
    </div>
  );
}
