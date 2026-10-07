"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Badge, Button, Card, Empty, Icons, Input, LineIcon, LinkButton, PageHeader, Progress, Segmented, Textarea } from "@/components/ui";
import { DaysBadge, RenewalStatusBadge } from "@/components/status";
import type { Policy, Renewal } from "@/domain/types";
import { insurerName, partyHref, partyName, partyPhone, userName } from "@/domain/engines/queries";
import { logRenewalContact, setRenewalChanges, toggleRenewalItem } from "@/data/actions-commercial";
import { RENEWAL_NEXT_STEP } from "@/components/commercial/helpers";
import { waLink } from "@/integrations/whatsapp";
import { date, firstName, money0, moneyK } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { lineLabel } from "@/domain/products";
import { cn } from "@/lib/cn";

const WINDOWS = [7, 15, 30, 60, 90] as const;
type Janela = "todas" | "vencidas" | `${(typeof WINDOWS)[number]}`;
interface Row { ren: Renewal; pol: Policy; days: number }

function RenovacoesInner() {
  const { db, today, visible, update, toast, can } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const focusId = sp.get("id");
  const janela = (sp.get("janela") ?? "todas") as Janela;
  const [scope, setScope] = useState<"andamento" | "concluidas">("andamento");
  const [expanded, setExpanded] = useState<string | null>(focusId);
  const [q, setQ] = useState("");
  const [changes, setChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!focusId) return;
    setExpanded(focusId);
    const r = db.renewals.find((x) => x.id === focusId);
    if (r && ["renovada", "nao_renovada"].includes(r.status)) setScope("concluidas");
    const t = setTimeout(() => document.getElementById(focusId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
    // roda só quando muda o item em foco (rolagem única); reagir a db.renewals rolaria a cada edição
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const all = useMemo<Row[]>(
    () =>
      db.renewals
        .map((ren) => ({ ren, pol: db.policies.find((p) => p.id === ren.policyId)! }))
        .filter((x) => x.pol && visible(x.pol.holder))
        .map((x) => ({ ...x, days: daysBetween(today, x.ren.dueDate) }))
        .sort((a, b) => a.days - b.days),
    [db.renewals, db.policies, visible, today],
  );
  const inProgress = all.filter((r) => !["renovada", "nao_renovada"].includes(r.ren.status));
  const finished = all.filter((r) => ["renovada", "nao_renovada"].includes(r.ren.status));
  const inWindow = (r: Row, j: Janela) => (j === "todas" ? true : j === "vencidas" ? r.days < 0 : r.days >= 0 && r.days <= Number(j));
  const pool = scope === "andamento" ? inProgress : finished;
  const term = q.trim().toLowerCase();
  const rows = pool.filter((r) => inWindow(r, janela)).filter((r) => !term || partyName(db, r.pol.holder).toLowerCase().includes(term) || r.pol.number.toLowerCase().includes(term));
  const setJanela = (j: Janela) => {
    const next = new URLSearchParams(sp.toString());
    next.delete("id");
    if (j === "todas" || j === janela) next.delete("janela");
    else next.set("janela", j);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };
  const canEdit = can("policies.edit") || can("proposals.edit");

  const askWhatsApp = (r: Row) => {
    const name = firstName(partyName(db, r.pol.holder));
    const msg = `Olá ${name}! Seu seguro ${lineLabel(r.pol.line).toLowerCase()} vence em ${date(r.pol.end)}. Algo mudou desde o ano passado (endereço, condutores, uso, beneficiários)? Se estiver tudo igual, responda 'tudo igual'.`;
    window.open(waLink(partyPhone(db, r.pol.holder), msg), "_blank", "noopener,noreferrer");
    update((d, u) => logRenewalContact(d, u, r.ren.id));
    toast("WhatsApp aberto · contato registrado no histórico");
  };

  return (
    <div>
      <PageHeader
        icon={<Icons.RefreshCw className="h-5 w-5" />}
        title="Renovação inteligente"
        subtitle={<>{inProgress.length} renovações em andamento · {moneyK(inProgress.reduce((s, r) => s + r.pol.annualPremium, 0))} em prêmio a reter</>}
        actions={<Segmented value={scope} onChange={setScope} options={[{ value: "andamento", label: `Em andamento (${inProgress.length})` }, { value: "concluidas", label: `Concluídas (${finished.length})` }]} />}
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-muted shadow-card">
        <Icons.Workflow className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>
          A automação acompanha o vencimento de cada apólice e, ao entrar na janela do ramo, <b className="font-medium text-ink">cria o processo de renovação</b> (checklist + oportunidade no CRM) com os dados da apólice atual. Alertas escalonados em <b className="font-medium text-ink">{db.settings.renewalWindows.join(" · ")} dias</b> geram tarefas na Central de Operações. O fluxo: perguntar o que mudou → nova cotação → proposta comparativa → emissão.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-7">
        {(["vencidas", ...WINDOWS.map((w) => `${w}` as Janela), "todas"] as Janela[]).map((j) => {
          const list = pool.filter((r) => inWindow(r, j));
          const active = janela === j;
          return (
            <button key={j} onClick={() => setJanela(j)} className={cn("rounded-xl border bg-white p-3 text-left transition", active ? "border-brand-500 ring-2 ring-brand-100" : "border-line hover:border-brand-300", j === "vencidas" && list.length > 0 && !active && "border-red-200 bg-danger-soft/40")}>
              <div className={cn("text-2xs font-medium", j === "vencidas" ? "text-danger" : "text-ink-muted")}>{j === "vencidas" ? "Vencidas" : j === "todas" ? "Todas" : `até ${j} dias`}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{list.length}</div>
              <div className="text-2xs text-ink-muted">{moneyK(list.reduce((s, r) => s + r.pol.annualPremium, 0))}</div>
            </button>
          );
        })}
      </div>

      <Card padded={false} title={janela === "todas" ? "Processos de renovação" : janela === "vencidas" ? "Vencidas sem renovação concluída" : `Vencendo em até ${janela} dias`} subtitle="Ordenado por vencimento · clique para ver checklist e ações" action={<div className="relative w-56"><Icons.Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-ink-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente ou apólice…" className="h-8 pl-8 text-xs" /></div>}>
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_24px] gap-3 border-b border-line bg-canvas px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted lg:grid">
          <span>Cliente / apólice</span><span>Seguradora</span><span>Vencimento</span><span>Status</span><span>Checklist</span><span>Próximo passo</span><span />
        </div>
        <div className="divide-y divide-line-soft">
          {rows.map((r) => {
            const done = r.ren.checklist.filter((c) => c.done).length;
            const total = r.ren.checklist.length;
            const open = expanded === r.ren.id;
            const phone = partyPhone(db, r.pol.holder);
            const opp = r.ren.opportunityId ? db.opportunities.find((o) => o.id === r.ren.opportunityId) : undefined;
            return (
              <div key={r.ren.id} id={r.ren.id} className={cn("scroll-mt-24", focusId === r.ren.id && "bg-brand-50/40 ring-1 ring-inset ring-brand-200")}>
                <button onClick={() => setExpanded(open ? null : r.ren.id)} className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left hover:bg-canvas lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_24px]">
                  <div className="col-span-2 flex min-w-0 items-center gap-2.5 lg:col-span-1">
                    <LineIcon line={r.pol.line} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{partyName(db, r.pol.holder)}</div>
                      <div className="truncate text-2xs text-ink-muted">{lineLabel(r.pol.line)} · <span className="font-mono">{r.pol.number}</span> · {money0(r.pol.annualPremium)}</div>
                    </div>
                  </div>
                  <span className="text-xs text-ink-soft">{insurerName(db, r.pol.insurerId)}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">{date(r.ren.dueDate)} <DaysBadge days={r.days} /></span>
                  <span><RenewalStatusBadge status={r.ren.status} /></span>
                  <span className="flex items-center gap-2 text-2xs text-ink-muted"><Progress value={total ? done / total : 0} className="w-16" tone={done === total ? "ok" : "brand"} />{done}/{total}</span>
                  <span className="col-span-2 truncate text-xs text-ink-soft lg:col-span-1">{RENEWAL_NEXT_STEP[r.ren.status]}</span>
                  <Icons.ChevronDown className={cn("hidden h-4 w-4 text-ink-muted transition lg:block", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="grid gap-4 border-t border-line-soft bg-canvas/60 px-4 py-4 md:grid-cols-[1.2fr_1fr]">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-soft">
                        Checklist da renovação
                        <span className="font-normal text-ink-muted">{r.ren.createdBy === "automacao" ? <><Icons.Zap className="mr-0.5 inline h-3 w-3 text-brand-600" />criada pela automação</> : `criada por ${userName(db, r.ren.createdBy)}`} · {date(r.ren.createdAt.slice(0, 10))}</span>
                      </div>
                      <ul className="space-y-1">
                        {r.ren.checklist.map((c) => (
                          <li key={c.key}>
                            <button disabled={!canEdit} onClick={() => update((d, u) => toggleRenewalItem(d, u, r.ren.id, c.key))} className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white disabled:pointer-events-none">
                              {c.done ? <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <Icons.Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />}
                              <span className={cn(c.done ? "text-ink-muted line-through" : "text-ink-soft")}>{c.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        <div className="mb-1 text-xs font-medium text-ink-soft">O que mudou (resposta do cliente)</div>
                        {r.ren.changesReported && changes[r.ren.id] == null ? (
                          <div className="flex items-start gap-2 rounded-md bg-white p-2 text-sm text-ink-soft ring-1 ring-line">
                            <span className="flex-1">{r.ren.changesReported}</span>
                            {canEdit && <button onClick={() => setChanges((c) => ({ ...c, [r.ren.id]: r.ren.changesReported ?? "" }))} className="text-2xs font-medium text-brand-700">editar</button>}
                          </div>
                        ) : canEdit ? (
                          <div className="flex items-start gap-2">
                            <Textarea rows={2} value={changes[r.ren.id] ?? ""} onChange={(e) => setChanges((c) => ({ ...c, [r.ren.id]: e.target.value }))} placeholder='Ex.: "tudo igual" ou "mudou de endereço, novo condutor de 22 anos"' className="text-xs" />
                            <Button size="sm" variant="secondary" disabled={!(changes[r.ren.id] ?? "").trim()} onClick={() => { update((d, u) => setRenewalChanges(d, u, r.ren.id, (changes[r.ren.id] ?? "").trim())); setChanges((c) => { const n = { ...c }; delete n[r.ren.id]; return n; }); toast("Mudanças registradas"); }}>Salvar</Button>
                          </div>
                        ) : <p className="text-xs text-ink-muted">Ainda não informado.</p>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-brand-100 bg-white p-3">
                        <div className="text-2xs font-semibold uppercase tracking-wide text-brand-700">Próximo passo sugerido</div>
                        <div className="mt-0.5 text-sm font-medium text-ink">{RENEWAL_NEXT_STEP[r.ren.status]}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant={r.ren.status === "identificada" ? "primary" : "secondary"} onClick={() => askWhatsApp(r)} disabled={!phone} icon={<Icons.MessageCircle className="h-4 w-4" />}>Perguntar o que mudou (WhatsApp)</Button>
                        {!phone && <span className="text-2xs text-ink-muted">Cliente sem WhatsApp/telefone cadastrado.</span>}
                        <LinkButton href={`/cotacoes/nova?ramo=${r.pol.line}&cliente=${r.pol.holder.id}&renovacao=${r.pol.id}`} variant={r.ren.status === "coletando_dados" ? "primary" : "secondary"} icon={<Icons.Calculator className="h-4 w-4" />}>Nova cotação</LinkButton>
                        <div className="flex gap-2">
                          <LinkButton href={`/apolices/${r.pol.id}`} size="sm" variant="ghost" icon={<Icons.ShieldCheck className="h-3.5 w-3.5" />}>Apólice</LinkButton>
                          <LinkButton href={partyHref(r.pol.holder)} size="sm" variant="ghost" icon={<Icons.User className="h-3.5 w-3.5" />}>Cliente</LinkButton>
                          {opp && <LinkButton href={`/crm?id=${opp.id}`} size="sm" variant="ghost" icon={<Icons.KanbanSquare className="h-3.5 w-3.5" />}>CRM</LinkButton>}
                        </div>
                        {opp?.proposalId && <Link href={`/propostas/${opp.proposalId}`} className="text-xs font-medium text-brand-700 hover:underline">Ver proposta de renovação →</Link>}
                        {opp && <Badge tone="neutral" className="self-start">Oportunidade: {opp.stage}</Badge>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!rows.length && <Empty icon={<Icons.CalendarCheck className="h-5 w-5" />} title="Nenhuma renovação nesta janela">{scope === "andamento" ? "Quando uma apólice entrar na janela de renovação, a automação cria o processo aqui." : "Nenhuma renovação concluída com estes filtros."}</Empty>}
        </div>
      </Card>
    </div>
  );
}

export default function RenovacoesPage() {
  return (
    <Suspense fallback={null}>
      <RenovacoesInner />
    </Suspense>
  );
}
