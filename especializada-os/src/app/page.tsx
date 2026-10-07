"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/data/store";
import { Card, Icons, PageHeader, Stat, LineIcon, LinkButton } from "@/components/ui";
import { BarList, Columns, Funnel } from "@/components/charts";
import { dashboardMetrics, groupSum } from "@/domain/engines/metrics";
import { operationsQueue, BUCKETS } from "@/domain/engines/priority";
import { money0, moneyK, pct, n } from "@/lib/format";
import { addMonths, daysBetween } from "@/lib/dates";
import { PRODUCT, lineLabel } from "@/domain/products";
import { insurerName, partyName, partyHref } from "@/domain/engines/queries";
import { PIPELINE_STAGES } from "@/domain/types";
import { STAGE_LABEL, DaysBadge } from "@/components/status";

export default function Dashboard() {
  const { db, today, user, visible, can } = useStore();
  const m = useMemo(() => dashboardMetrics(db, today, user), [db, today, user]);
  const queue = useMemo(() => operationsQueue(db, today, user), [db, today, user]);
  const policies = db.policies.filter((p) => p.status === "vigente" && visible(p.holder));
  const opps = db.opportunities.filter((o) => visible(o.party));
  const byLine = groupSum(policies, (p) => p.line, (p) => p.annualPremium).slice(0, 7);
  const byInsurer = groupSum(policies, (p) => p.insurerId, (p) => p.annualPremium).slice(0, 7);
  const byBroker = groupSum(policies, (p) => p.ownerId, (p) => p.annualPremium);
  const month = today.slice(0, 7);
  const polIds = new Set(policies.map((p) => p.id));
  const months = Array.from({ length: 6 }, (_, k) => addMonths(`${month}-01`, k - 4).slice(0, 7));
  const commSeries = months.map((mm) => {
    const cs = db.commissions.filter((c) => c.competence === mm && (polIds.has(c.policyId) || db.policies.find((p) => p.id === c.policyId && visible(p.holder))));
    return { label: mm.slice(5) + "/" + mm.slice(2, 4), values: [cs.reduce((s, c) => s + c.expected, 0), cs.reduce((s, c) => s + (c.received ?? 0), 0)], highlight: mm === month };
  });
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
  const counts = Object.fromEntries(BUCKETS.map((b) => [b.key, queue.filter((i) => i.buckets.includes(b.key)).length]));

  return (
    <div>
      <PageHeader title={`${greeting}, ${user!.name.split(" ")[0]}`} subtitle={<>Visão executiva da corretora · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</>} actions={<><LinkButton href="/operacoes" icon={<Icons.Radar className="h-4 w-4" />}>Central de Operações</LinkButton><LinkButton href="/cotacoes/nova" variant="primary" icon={<Icons.Plus className="h-4 w-4" />}>Nova cotação</LinkButton></>} />

      <Link href="/operacoes" className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3 hover:border-brand-300">
        <div className="flex items-center gap-2 text-sm font-medium text-ink"><Icons.Radar className="h-4 w-4 text-brand-600" />Seu dia</div>
        <span className="text-sm"><b className="text-danger">{counts.urgente}</b> <span className="text-ink-muted">urgentes</span></span>
        <span className="text-sm"><b>{counts.hoje}</b> <span className="text-ink-muted">para hoje</span></span>
        <span className="text-sm"><b>{counts.aguardando_cliente}</b> <span className="text-ink-muted">aguardando cliente</span></span>
        <span className="text-sm"><b>{counts.renovacoes}</b> <span className="text-ink-muted">renovações em andamento</span></span>
        <span className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-700">Abrir <Icons.ArrowRight className="h-3.5 w-3.5" /></span>
      </Link>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Clientes ativos" value={n(m.activeClients)} sub={`${m.leads} leads`} href="/clientes" icon={<Icons.Users className="h-4 w-4" />} tone="brand" />
        <Stat label="Apólices ativas" value={n(m.activePolicies)} sub={`${moneyK(m.activePremium)} em prêmio/ano`} href="/apolices" icon={<Icons.ShieldCheck className="h-4 w-4" />} tone="ok" />
        <Stat label="Propostas abertas" value={m.proposalsOpen} sub={`${m.proposalsWaiting} aguardando cliente`} href="/propostas" icon={<Icons.FileText className="h-4 w-4" />} />
        <Stat label="Aprovadas / perdidas" value={<>{m.proposalsApproved}<span className="text-ink-faint"> / </span>{m.proposalsLost}</>} sub={`conversão ${pct(m.conversion)}`} href="/crm" icon={<Icons.Target className="h-4 w-4" />} />
        {can("commissions.view") ? <Stat label="Comissão do mês" value={moneyK(m.commissionExpectedMonth)} sub={`${moneyK(m.commissionReceivedMonth)} recebida`} href="/comissoes" icon={<Icons.Wallet className="h-4 w-4" />} tone="ok" /> : <Stat label="Vendas do mês" value={moneyK(m.salesMonth)} sub={`${m.salesMonthCount} apólice(s) novas`} href="/apolices" icon={<Icons.TrendingUp className="h-4 w-4" />} tone="ok" />}
        <Stat label="Horas economizadas" value={`${m.hoursSaved30.toFixed(1).replace(".", ",")} h`} sub={`${m.automationRuns30} automações em 30 dias`} href="/automacoes" icon={<Icons.Zap className="h-4 w-4" />} tone="warn" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Renovações" subtitle="Apólices vigentes por janela de vencimento" action={<Link href="/renovacoes" className="text-xs font-medium text-brand-700">Ver todas</Link>}>
          <div className="grid grid-cols-3 gap-2">
            {([["30", m.renew30], ["60", m.renew60], ["90", m.renew90]] as const).map(([d, list]) => (
              <Link key={d} href={`/renovacoes?janela=${d}`} className="rounded-lg border border-line p-3 hover:border-brand-300">
                <div className="text-2xs font-medium text-ink-muted">até {d} dias</div>
                <div className="text-xl font-semibold tabular-nums">{list.length}</div>
                <div className="text-2xs text-ink-muted">{moneyK(list.reduce((s, p) => s + p.annualPremium, 0))}</div>
              </Link>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {m.renew30.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/apolices/${p.id}`} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-line-soft">
                <LineIcon line={p.line} />
                <span className="flex-1 truncate">{partyName(db, p.holder)}</span>
                <span className="text-2xs text-ink-muted">{insurerName(db, p.insurerId)}</span>
                <DaysBadge days={daysBetween(today, p.end)} />
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Funil comercial" subtitle="Oportunidades abertas por etapa" action={<Link href="/crm" className="text-xs font-medium text-brand-700">CRM</Link>}>
          <Funnel steps={PIPELINE_STAGES.filter((s) => s !== "emitido").map((s) => { const os = opps.filter((o) => o.stage === s); return { label: STAGE_LABEL[s], value: os.length, amount: moneyK(os.reduce((a, o) => a + o.estimatedPremium, 0)), href: `/crm?etapa=${s}` }; })} />
        </Card>

        <Card title="Prioridades agora" subtitle="Ordenadas automaticamente pela Central" action={<Link href="/operacoes" className="text-xs font-medium text-brand-700">Abrir</Link>}>
          <div className="space-y-1">
            {queue.slice(0, 7).map((i) => (
              <Link key={i.task.id} href={i.party ? partyHref(i.party) : "/operacoes"} className="block rounded-md px-1.5 py-1.5 hover:bg-line-soft">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i.primary === "urgente" ? "bg-danger" : i.primary === "hoje" ? "bg-warn" : "bg-brand-400"}`} />
                  <span className="truncate text-sm text-ink">{i.task.title}</span>
                </div>
                <div className="truncate pl-3.5 text-2xs text-ink-muted">{partyName(db, i.party)}{i.reasons.length ? ` · ${i.reasons[0]}` : ""}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {can("commissions.view") && (
          <Card title="Comissão prevista × recebida" subtitle="Por competência" className="lg:col-span-1">
            <Columns data={commSeries} series={[{ name: "Prevista", color: "#bcd2ff" }, { name: "Recebida", color: "#1f4fe0" }]} format={money0} />
          </Card>
        )}
        <Card title="Performance por produto" subtitle="Prêmio anual ativo">
          <BarList items={byLine.map((x) => ({ label: lineLabel(x.key as never), value: x.value, color: PRODUCT[x.key as keyof typeof PRODUCT]?.color, href: `/apolices?ramo=${x.key}` }))} format={moneyK} />
        </Card>
        <Card title="Performance por seguradora" subtitle="Prêmio anual ativo">
          <BarList items={byInsurer.map((x) => ({ label: insurerName(db, x.key), value: x.value, color: db.insurers.find((i) => i.id === x.key)?.color, href: `/apolices?seguradora=${x.key}` }))} format={moneyK} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Performance por corretor" subtitle="Carteira ativa e funil">
          <BarList items={byBroker.map((x) => { const u = db.users.find((u) => u.id === x.key); const open = opps.filter((o) => o.ownerId === x.key && !["emitido", "perdido"].includes(o.stage)).length; return { label: u?.name ?? x.key, sub: `· ${open} oportunidades`, value: x.value, href: `/apolices?corretor=${x.key}` }; })} format={moneyK} />
        </Card>
        <Card title="Trabalho operacional eliminado" subtitle="Métrica principal do produto (últimos 30 dias)" className="lg:col-span-2" action={<Link href="/automacoes" className="text-xs font-medium text-brand-700">Detalhes</Link>}>
          <div className="grid gap-3 sm:grid-cols-4">
            {Object.entries(db.automationRuns.reduce<Record<string, { n: number; min: number }>>((acc, r) => { const k = r.automationId; acc[k] = acc[k] ?? { n: 0, min: 0 }; acc[k].n++; acc[k].min += r.minutesSaved; return acc; }, {})).sort((a, b) => b[1].min - a[1].min).slice(0, 4).map(([id, v]) => (
              <div key={id} className="rounded-lg bg-canvas p-3">
                <div className="text-lg font-semibold tabular-nums">{(v.min / 60).toFixed(1).replace(".", ",")} h</div>
                <div className="text-2xs text-ink-muted">{v.n}× {db.automations.find((a) => a.id === id)?.name.split("→")[0].trim()}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-2xs text-ink-muted">Estimativa = execuções × minutos que a tarefa levaria manualmente (baseline configurável por automação). Na DEMO os baselines são ilustrativos; na produção serão cronometrados com a equipe.</p>
        </Card>
      </div>
    </div>
  );
}
