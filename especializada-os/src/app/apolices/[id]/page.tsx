"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Badge, Card, Empty, Icons, KeyVal, LineBadge, LinkButton, PageHeader, Progress, SourceChip, Table, Td, Th } from "@/components/ui";
import { DaysBadge, PolicyStatusBadge, RenewalStatusBadge } from "@/components/status";
import { TaskRow } from "@/components/ops/TaskRow";
import { assetLabel, insurerName, partyHref, partyName, userName } from "@/domain/engines/queries";
import { COVERAGE_LABEL, REIMB_LABEL } from "@/domain/engines/health";
import { RENEWAL_NEXT_STEP, monthLabel } from "@/components/commercial/helpers";
import { date, dateTime, money, money0, pct } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { lineLabel } from "@/domain/products";
import type { Policy } from "@/domain/types";
import { cn } from "@/lib/cn";

const SOURCE_LABEL: Record<Policy["dataSource"]["kind"], string> = {
  manual: "Cadastro manual", importacao: "Importação de carteira", "document-ai": "Document AI (revisado)", proposta: "Emitida via proposta", demo: "Dado DEMO",
};
const COMM_TONE = { prevista: "neutral", recebida: "ok", divergente: "warn", atrasada: "danger" } as const;

export default function ApoliceDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { db, today, can, visible } = useStore();
  const pol = db.policies.find((p) => p.id === id);

  if (!pol) return <Empty icon={<Icons.ShieldQuestion className="h-5 w-5" />} title="Apólice não encontrada" action={<LinkButton href="/apolices">Voltar para apólices</LinkButton>} />;
  if (!visible(pol.holder)) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso a esta apólice" action={<LinkButton href="/apolices">Voltar</LinkButton>}>Ela pertence à carteira de outro corretor.</Empty>;

  const insurer = db.insurers.find((i) => i.id === pol.insurerId);
  const asset = db.assets.find((a) => a.id === pol.insuredAssetId);
  const plan = pol.healthPlanId ? db.healthPlans.find((p) => p.id === pol.healthPlanId) : undefined;
  const beneficiaries = (pol.beneficiaryIds ?? []).map((bid) => db.persons.find((p) => p.id === bid)).filter((p): p is NonNullable<typeof p> => !!p);
  const days = daysBetween(today, pol.end);
  const active = pol.status === "vigente" || pol.status === "em_emissao";

  // cadeia de renovação
  const back: Policy[] = [];
  let cur = pol.renewedFromId ? db.policies.find((p) => p.id === pol.renewedFromId) : undefined;
  while (cur && back.length < 10) { back.unshift(cur); cur = cur.renewedFromId ? db.policies.find((p) => p.id === cur!.renewedFromId) : undefined; }
  const forward: Policy[] = [];
  let nxt = db.policies.find((p) => p.renewedFromId === pol.id);
  while (nxt && forward.length < 10) { forward.push(nxt); const prevId: string = nxt.id; nxt = db.policies.find((p) => p.renewedFromId === prevId); }
  const chain = [...back, pol, ...forward];

  const renewal = db.renewals.find((r) => r.policyId === pol.id);
  const done = renewal?.checklist.filter((c) => c.done).length ?? 0;
  const showComm = can("commissions.view");
  const comms = db.commissions.filter((c) => c.policyId === pol.id).sort((a, b) => a.competence.localeCompare(b.competence));
  const docs = db.documents.filter((d) => d.policyId === pol.id);
  const audit = can("audit.view") ? db.audit.filter((a) => a.entityId === pol.id || (renewal && a.entityId === renewal.id)).slice(0, 15) : [];
  const tasks = db.tasks.filter((t) => t.status === "aberta" && ((t.related?.type === "policy" && t.related.id === pol.id) || (renewal && t.related?.type === "renewal" && t.related.id === renewal.id) || (pol.proposalId && t.related?.type === "proposal" && t.related.id === pol.proposalId)));
  const proposal = pol.proposalId ? db.proposals.find((p) => p.id === pol.proposalId) : undefined;
  const commExpected = comms.reduce((s, c) => s + c.expected, 0);
  const commReceived = comms.reduce((s, c) => s + (c.received ?? 0), 0);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Apólices", href: "/apolices" }, { label: pol.number, href: `/apolices/${pol.id}` }]}
        icon={<Icons.ShieldCheck className="h-5 w-5" />}
        title={<span className="flex items-center gap-2"><span className="font-mono">{pol.number}</span> <PolicyStatusBadge status={pol.status} /></span>}
        subtitle={<><Link href={partyHref(pol.holder)} className="font-medium text-ink hover:text-brand-700">{partyName(db, pol.holder)}</Link> · {lineLabel(pol.line)} · {insurer?.name ?? "—"}</>}
        actions={
          <>
            <SourceChip source={SOURCE_LABEL[pol.dataSource.kind]} at={pol.dataSource.at} />
            {renewal && <LinkButton href={`/renovacoes?id=${renewal.id}`} icon={<Icons.RefreshCw className="h-4 w-4" />}>Renovação</LinkButton>}
            {active && <LinkButton href={`/cotacoes/nova?ramo=${pol.line}&cliente=${pol.holder.id}&renovacao=${pol.id}`} variant="primary" icon={<Icons.Calculator className="h-4 w-4" />}>Nova cotação</LinkButton>}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="text-xs text-ink-muted">Prêmio anual</div><div className="mt-1 text-xl font-semibold tabular-nums">{money(pol.annualPremium)}</div></div>
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="text-xs text-ink-muted">Vigência</div><div className="mt-1 text-sm font-medium">{date(pol.start)} – {date(pol.end)}</div><div className="mt-1">{active ? <DaysBadge days={days} /> : <span className="text-2xs text-ink-muted">encerrada</span>}</div></div>
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="text-xs text-ink-muted">Seguradora</div><div className="mt-1 flex items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: insurer?.color }} />{insurer?.short ?? "—"}</div><Link href={`/seguradoras#${pol.insurerId}`} className="text-2xs text-brand-700 hover:underline">ver integração</Link></div>
        {showComm ? (
          <div className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="text-xs text-ink-muted">Comissão</div><div className="mt-1 text-xl font-semibold tabular-nums">{pct(pol.commissionPct, 1)}</div><div className="text-2xs text-ink-muted">{money0(pol.annualPremium * pol.commissionPct)}/ano</div></div>
        ) : (
          <div className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="text-xs text-ink-muted">Corretor</div><div className="mt-1 text-sm font-medium">{userName(db, pol.ownerId)}</div></div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Dados da apólice">
            <div className="grid gap-x-8 md:grid-cols-2">
              <div>
                <KeyVal k="Número" v={pol.number} mono />
                <KeyVal k="Titular" v={<Link href={partyHref(pol.holder)} className="text-brand-700 hover:underline">{partyName(db, pol.holder)}</Link>} />
                <KeyVal k="Ramo" v={<LineBadge line={pol.line} />} />
                <KeyVal k="Produto" v={pol.productName} />
                <KeyVal k="Corretor" v={userName(db, pol.ownerId)} />
                {proposal && <KeyVal k="Proposta de origem" v={<Link href={`/propostas/${proposal.id}`} className="text-brand-700 hover:underline">{proposal.code}</Link>} />}
              </div>
              <div>
                {asset && <KeyVal k="Bem segurado" v={assetLabel(db, asset)} />}
                {asset?.type === "vehicle" && <KeyVal k="Valor FIPE" v={money0(asset.fipeValue)} />}
                {plan && <KeyVal k="Plano" v={plan.name} />}
                {plan && <KeyVal k="Características" v={`${plan.accommodation} · ${plan.coparticipation ? "com" : "sem"} copart. · ${COVERAGE_LABEL[plan.coverage]}`} />}
                {plan && <KeyVal k="Reembolso" v={REIMB_LABEL[plan.reimbursement]} />}
                <KeyVal k="Capital segurado" v={pol.capitalInsured != null ? money0(pol.capitalInsured) : "—"} />
                <KeyVal k="Franquia" v={pol.deductible != null ? money0(pol.deductible) : "—"} />
                <KeyVal k="Origem do dado" v={<SourceChip source={`${SOURCE_LABEL[pol.dataSource.kind]}${pol.dataSource.by ? ` · ${userName(db, pol.dataSource.by)}` : ""}`} at={pol.dataSource.at} />} />
              </div>
            </div>
            {beneficiaries.length > 0 && (
              <div className="mt-3 border-t border-line-soft pt-3">
                <div className="mb-2 text-xs font-medium text-ink-muted">Beneficiários ({beneficiaries.length})</div>
                <div className="flex flex-wrap gap-2">
                  {beneficiaries.map((b) => <Link key={b.id} href={`/clientes/${b.id}`} className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:border-brand-300 hover:text-ink">{b.name}</Link>)}
                </div>
              </div>
            )}
          </Card>

          {showComm && (
            <Card padded={false} title="Comissões desta apólice" subtitle={comms.length ? `${money0(commReceived)} recebidos de ${money0(commExpected)} previstos` : undefined}>
              {comms.length ? (
                <Table>
                  <thead><tr><Th>Competência</Th><Th className="text-right">Prevista</Th><Th className="text-right">Recebida</Th><Th>Recebida em</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {comms.map((c) => (
                      <tr key={c.id} className={cn(c.competence === today.slice(0, 7) && "bg-brand-50/40")}>
                        <Td className="text-xs font-medium">{monthLabel(c.competence)}</Td>
                        <Td className="text-right tabular-nums">{money(c.expected)}</Td>
                        <Td className="text-right tabular-nums">{c.received != null ? money(c.received) : "—"}</Td>
                        <Td className="text-xs text-ink-muted">{c.receivedAt ? date(c.receivedAt) : "—"}</Td>
                        <Td><Badge tone={COMM_TONE[c.status]} dot>{c.status}</Badge></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : <Empty title="Sem comissões lançadas" />}
            </Card>
          )}

          <Card padded={false} title="Tarefas em aberto" subtitle="Relacionadas à apólice, à renovação ou à proposta de origem">
            <div className="divide-y divide-line-soft">
              {tasks.map((t) => <TaskRow key={t.id} task={t} compact />)}
              {!tasks.length && <Empty icon={<Icons.CheckCheck className="h-5 w-5" />} title="Nada pendente">Nenhuma tarefa aberta para esta apólice.</Empty>}
            </div>
          </Card>

          {can("audit.view") && (
            <Card title="Auditoria" subtitle="Quem alterou o quê (inclui a renovação)">
              {audit.length ? (
                <ul className="space-y-2.5">
                  {audit.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      <div className="min-w-0">
                        <div className="text-ink">{a.summary}</div>
                        <div className="text-2xs text-ink-muted">{dateTime(a.at)} · {userName(db, a.userId)} · {a.source}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-muted">Nenhum registro de auditoria para esta apólice.</p>}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Cadeia de renovação" subtitle={chain.length > 1 ? `${chain.length} vigências` : "Primeira vigência na carteira"}>
            <ol className="space-y-2">
              {chain.map((p) => (
                <li key={p.id}>
                  <Link href={`/apolices/${p.id}`} className={cn("block rounded-lg border px-3 py-2", p.id === pol.id ? "border-brand-300 bg-brand-50/50" : "border-line hover:border-brand-300")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-ink">{p.number}</span>
                      <PolicyStatusBadge status={p.status} />
                    </div>
                    <div className="mt-0.5 text-2xs text-ink-muted">{date(p.start)} – {date(p.end)} · {insurerName(db, p.insurerId)} · {money0(p.annualPremium)}</div>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Renovação" action={renewal && <Link href={`/renovacoes?id=${renewal.id}`} className="text-xs font-medium text-brand-700">Abrir</Link>}>
            {renewal ? (
              <div>
                <div className="flex items-center justify-between">
                  <RenewalStatusBadge status={renewal.status} />
                  <span className="text-2xs text-ink-muted">{renewal.createdBy === "automacao" ? "criada pela automação" : `criada por ${userName(db, renewal.createdBy)}`}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted"><Progress value={renewal.checklist.length ? done / renewal.checklist.length : 0} className="flex-1" tone={done === renewal.checklist.length ? "ok" : "brand"} />{done}/{renewal.checklist.length}</div>
                <ul className="mt-3 space-y-1.5">
                  {renewal.checklist.map((c) => (
                    <li key={c.key} className="flex items-start gap-2 text-xs">
                      {c.done ? <Icons.CheckCircle2 className="h-4 w-4 shrink-0 text-ok" /> : <Icons.Circle className="h-4 w-4 shrink-0 text-ink-faint" />}
                      <span className={cn(c.done ? "text-ink-muted line-through" : "text-ink-soft")}>{c.label}</span>
                    </li>
                  ))}
                </ul>
                {renewal.changesReported && <p className="mt-3 rounded-md bg-canvas p-2 text-xs text-ink-soft"><b className="font-medium">Mudanças informadas:</b> {renewal.changesReported}</p>}
                <div className="mt-3 flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1.5 text-xs text-brand-800"><Icons.ArrowRight className="h-3.5 w-3.5" />Próximo passo: {RENEWAL_NEXT_STEP[renewal.status]}</div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{active ? `A automação inicia o processo de renovação nas janelas configuradas (${db.settings.renewalWindows.join("/")} dias antes do vencimento).` : "Sem processo de renovação."}</p>
            )}
          </Card>

          <Card title="Documentos" action={<Link href="/documentos" className="text-xs font-medium text-brand-700">Todos</Link>}>
            {docs.length ? (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
                    <Icons.FileText className="h-4 w-4 shrink-0 text-ink-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-ink">{d.name}</div>
                      <div className="text-2xs text-ink-muted">{d.kind.replace("_", " ")} · {d.sizeKb} KB · {date(d.uploadedAt.slice(0, 10))} · via {d.channel}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">Nenhum documento vinculado.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
