"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { addManualResult, createProposal } from "@/data/actions";
import { Badge, Button, Card, DemoBadge, Dialog, Empty, Field, Icons, Input, LineBadge, PageHeader, Segmented, SourceChip, Table, Td, Th, Textarea } from "@/components/ui";
import type { AutoQuoteRequest, GenericQuoteRequest, HealthQuoteRequest, Quote, QuoteResult } from "@/domain/types";
import { insurerName, partyHref, partyName, vehicleOf, assetLabel } from "@/domain/engines/queries";
import { COVERAGE_LABEL, REIMB_LABEL, evaluatePlans, networkSource, planCovers, recommend, whatChanges } from "@/domain/engines/health";
import { distanceKm, fmtKm } from "@/lib/geo";
import { dateTime, money, money0, pct, date } from "@/lib/format";
import { lineLabel } from "@/domain/products";
import { cn } from "@/lib/cn";
import { coverageScore, scoreResults } from "@/domain/engines/compare";

export default function CotacaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { db, visible } = useStore();
  const q = db.quotes.find((x) => x.id === id);
  if (!q) return <Empty title="Cotação não encontrada" />;
  if (!visible(q.party)) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso" />;
  const req = q.request;
  const desc = req.line === "saude" ? `${(req as HealthQuoteRequest).beneficiaries.length} beneficiário(s): ${(req as HealthQuoteRequest).beneficiaries.map((b) => `${b.name.split(" ")[0]} (${b.age})`).join(", ")}` : req.line === "auto" ? assetLabel(db, vehicleOf(db, (req as AutoQuoteRequest).vehicleId)) : (req as GenericQuoteRequest).description;
  const proposals = db.proposals.filter((p) => p.quoteId === q.id);
  return (
    <div>
      <PageHeader breadcrumb={[{ label: "Cotações", href: "/cotacoes" }]} icon={<Icons.Calculator className="h-5 w-5" />}
        title={<span className="flex items-center gap-2">Cotação {lineLabel(q.line)} · <Link href={partyHref(q.party)} className="hover:text-brand-700">{partyName(db, q.party)}</Link><DemoBadge /></span>}
        subtitle={<>{desc} · calculada em {dateTime(q.createdAt)}</>}
        actions={proposals.map((p) => <Link key={p.id} href={`/propostas/${p.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium shadow-sm hover:bg-canvas"><Icons.FileText className="h-4 w-4" />Proposta {p.code}</Link>)} />
      {q.line === "saude" ? <HealthResult q={q} /> : <MultiResult q={q} />}
    </div>
  );
}

function ProposalBuilder({ q, selected, recommendedId, reason, defaultNeed }: { q: Quote; selected: string[]; recommendedId?: string; reason?: string; defaultNeed: string }) {
  const { update, toast, can } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState(defaultNeed);
  const [validDays, setValidDays] = useState(10);
  if (!can("proposals.edit")) return null;
  return (
    <>
      <Button disabled={!selected.length} onClick={() => setOpen(true)} icon={<Icons.FileText className="h-4 w-4" />}>Gerar proposta ({selected.length})</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Gerar proposta" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => { let pid = ""; update((d, u) => { const r = createProposal(d, u, { quoteId: q.id, optionResultIds: selected, recommendedResultId: selected.includes(recommendedId ?? "") ? recommendedId : selected[0], recommendationReason: reason, need, validDays }); pid = r.id; return r.db; }); toast("Proposta gerada com identidade Especializada"); setTimeout(() => router.push(`/propostas/${pid}`), 50); }}>Gerar</Button></>}>
        <div className="space-y-3">
          <Field label="Necessidade do cliente (aparece na proposta)"><Textarea rows={3} value={need} onChange={(e) => setNeed(e.target.value)} /></Field>
          <Field label="Validade (dias)"><Input type="number" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} /></Field>
          <p className="text-xs text-ink-muted">{selected.length} opção(ões) · a recomendação, o comparativo e as diferenças são montados automaticamente a partir dos dados da cotação.</p>
        </div>
      </Dialog>
    </>
  );
}

// ───────────────────────────── SAÚDE ─────────────────────────────
function HealthResult({ q }: { q: Quote }) {
  const { db } = useStore();
  const req = q.request as HealthQuoteRequest;
  const rec = useMemo(() => recommend(db, req), [db, req]);
  const evals = useMemo(() => evaluatePlans(db, req), [db, req]);
  const okResults = q.results.filter((r) => r.status === "ok");
  const [sel, setSel] = useState<string[]>(() => [...new Set(rec.picks.map((p) => p.planId))].slice(0, 3));
  const [onlyEligible, setOnlyEligible] = useState(true);
  const origin = req.lat != null ? { lat: req.lat, lng: req.lng! } : null;
  const plans = sel.map((pid) => db.healthPlans.find((p) => p.id === pid)!).filter(Boolean);
  const ages = req.beneficiaries.map((b) => b.age);
  const nearest = origin ? db.providers.filter((p) => p.type === "hospital" || p.type === "maternidade").map((p) => ({ p, d: distanceKm(origin, p) })).sort((a, b) => a.d - b.d).slice(0, 6).map((x) => x.p) : [];
  const providerRows = [...new Set([...req.desiredProviderIds, ...nearest.map((p) => p.id)])].map((pid) => db.providers.find((p) => p.id === pid)!);
  const resultFor = (planId: string) => q.results.find((r) => r.healthPlanId === planId);
  const recPick = rec.picks.find((p) => p.key === "custo_beneficio");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rec.picks.map((p) => { const e = rec.evaluations.find((x) => x.plan.id === p.planId)!; return (
          <Card key={p.key} className={cn(p.key === "custo_beneficio" && "border-brand-300 ring-2 ring-brand-100")}>
            <div className="flex items-center justify-between"><span className="text-2xs font-semibold uppercase tracking-wide text-brand-700">{p.label}</span>{p.key === "custo_beneficio" && <Icons.Award className="h-4 w-4 text-brand-600" />}</div>
            <div className="mt-1 text-base font-semibold">{e.plan.name}</div>
            <div className="text-xs text-ink-muted">{insurerName(db, e.plan.insurerId)}</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">{money0(e.monthly)}<span className="text-xs font-normal text-ink-muted">/mês</span></div>
            <ul className="mt-2 space-y-1 text-xs text-ink-soft">{p.reasons.slice(0, 4).map((r, i) => <li key={i} className="flex gap-1.5"><Icons.Check className="mt-0.5 h-3 w-3 shrink-0 text-ok" />{r}</li>)}</ul>
            <button onClick={() => setSel((s) => (s.includes(e.plan.id) ? s : [...s, e.plan.id]))} className="mt-2 text-xs font-medium text-brand-700">{sel.includes(e.plan.id) ? "No comparador ✓" : "Adicionar ao comparador"}</button>
          </Card>); })}
      </div>
      <p className="flex items-center gap-1.5 text-2xs text-ink-muted"><Icons.Info className="h-3 w-3" />Recomendação transparente: preço pelas tabelas por faixa etária ANS; rede pelos vínculos importados (fonte e data indicadas); nenhuma informação é estimada por IA.</p>

      <Card title="Comparador de planos" subtitle="Selecione 2, 3, 4 ou mais planos" padded={false} action={<div className="flex items-center gap-2"><Link href={`/rede?modo=comparar&planos=${sel.join(",")}`} className="text-xs font-medium text-brand-700">Ver redes no mapa</Link><ProposalBuilder q={q} selected={sel.map((pid) => resultFor(pid)?.id).filter(Boolean) as string[]} recommendedId={recPick ? resultFor(recPick.planId)?.id : undefined} reason={recPick?.reasons.slice(0, 3).join("; ")} defaultNeed={`Plano de saúde para ${req.beneficiaries.length} vida(s) (${req.beneficiaries.map((b) => `${b.name.split(" ")[0]}, ${b.age}`).join("; ")})${req.desiredProviderIds.length ? `, com acesso a ${req.desiredProviderIds.map((pid) => db.providers.find((p) => p.id === pid)?.name).join(", ")}` : ""}${req.budgetMonthly ? `, orçamento até ${money0(req.budgetMonthly)}/mês` : ""}.`} /></div>}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5">
          <span className="text-xs text-ink-muted">Planos:</span>
          {evals.filter((e) => !onlyEligible || e.meetsHard).map((e) => (
            <button key={e.plan.id} onClick={() => setSel((s) => (s.includes(e.plan.id) ? s.filter((x) => x !== e.plan.id) : [...s, e.plan.id]))} className={cn("rounded-md border px-2 py-0.5 text-xs", sel.includes(e.plan.id) ? "border-brand-400 bg-brand-50 text-brand-800" : "border-line text-ink-soft hover:border-brand-300", !e.meetsHard && "opacity-60")} title={e.hardFailures.join(", ")}>{e.plan.name}</button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted"><input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} />só elegíveis</label>
        </div>
        {plans.length ? (
          <Table>
            <thead><tr><Th className="w-56">Item</Th>{plans.map((p) => <Th key={p.id}>{p.name}<button onClick={() => setSel(sel.filter((x) => x !== p.id))} className="ml-1 text-ink-faint hover:text-danger">×</button></Th>)}</tr></thead>
            <tbody>
              <Row label="Operadora" cells={plans.map((p) => insurerName(db, p.insurerId))} />
              <Row label="Preço mensal (família)" cells={plans.map((p) => { const e = evals.find((x) => x.plan.id === p.id)!; return <b key={p.id} className={cn("tabular-nums", e.withinBudget === false && "text-danger")}>{money(e.monthly)}</b>; })} />
              <Row label="Preço anual" cells={plans.map((p) => money0(evals.find((x) => x.plan.id === p.id)!.monthly * 12))} />
              <Row label="Acomodação" cells={plans.map((p) => p.accommodation === "apartamento" ? "Apartamento" : "Enfermaria")} />
              <Row label="Coparticipação" cells={plans.map((p) => (p.coparticipation ? "Sim" : "Não"))} />
              <Row label="Abrangência" cells={plans.map((p) => COVERAGE_LABEL[p.coverage])} />
              <Row label="Reembolso" cells={plans.map((p) => `${REIMB_LABEL[p.reimbursement]}${p.reimbursementConsultation ? ` · consulta ${money0(p.reimbursementConsultation)}` : ""}`)} />
              <Row label="Rede em até 10 km" cells={plans.map((p) => { const e = evals.find((x) => x.plan.id === p.id)!; return `${e.nearbyCount} prestadores (${e.nearbyHospitals} hospitais)`; })} />
              <tr><Td colSpan={plans.length + 1} className="bg-canvas py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted">Prestadores desejados e hospitais mais próximos</Td></tr>
              {providerRows.map((pv) => (
                <tr key={pv.id}>
                  <Td className="text-sm">{pv.name}{req.desiredProviderIds.includes(pv.id) && <Badge tone="brand" className="ml-1.5">desejado</Badge>}{origin && <div className="text-2xs text-ink-muted">{pv.district} · {fmtKm(distanceKm(origin, pv))}</div>}</Td>
                  {plans.map((p) => { const l = planCovers(db, p.id, pv.id); return <Td key={p.id}>{l ? <span className="inline-flex items-center gap-1 text-ok-strong"><Icons.Check className="h-4 w-4" /><span className="text-2xs text-ink-muted">{l.services.length} serviço(s)</span></span> : <Icons.X className="h-4 w-4 text-danger" />}</Td>; })}
                </tr>
              ))}
              <Row label="Fonte da rede" cells={plans.map((p) => { const s = networkSource(db, p); return s ? <SourceChip key={p.id} source={s.label} at={s.importedAt} stale={s.status === "expirada"} /> : "—"; })} />
            </tbody>
          </Table>
        ) : <Empty title="Selecione planos para comparar" />}
      </Card>

      {plans.length >= 2 && (
        <Card title="O que muda?" subtitle={`Diferenças em relação a ${plans[0].name} — geradas a partir dos dados estruturados (sem inventar)`}>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.slice(1).map((p) => (
              <div key={p.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 text-sm font-semibold">{plans[0].name} → {p.name}</div>
                <ul className="space-y-1.5 text-sm text-ink-soft">{whatChanges(db, plans[0], p, ages, req.desiredProviderIds.length ? [...req.desiredProviderIds, ...nearest.map((x) => x.id)] : []).map((t, i) => <li key={i} className="flex gap-2"><Icons.ArrowRight className="mt-1 h-3 w-3 shrink-0 text-brand-500" />{t}</li>)}</ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {q.results.some((r) => r.status !== "ok") && (
        <Card title="Planos que não atendem aos critérios obrigatórios">
          <div className="space-y-1 text-sm">{q.results.filter((r) => r.status !== "ok").map((r) => <div key={r.id} className="flex gap-2"><span className="w-44 shrink-0 font-medium">{r.productName}</span><span className="text-ink-muted">{r.message}</span></div>)}</div>
        </Card>
      )}
      <p className="text-2xs text-ink-muted">{okResults.length} planos calculados · tabelas e redes simuladas da DEMO (não são produtos reais das operadoras).</p>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return <tr><Td className="text-sm font-medium text-ink-soft">{label}</Td>{cells.map((c, i) => <Td key={i} className="text-sm">{c}</Td>)}</tr>;
}

// ───────────────────────────── MULTICÁLCULO (auto e demais ramos) ─────────────────────────────
type SortKey = "recomendacao" | "preco" | "cobertura" | "franquia" | "comissao";
function MultiResult({ q }: { q: Quote }) {
  const { db, can, update, toast } = useStore();
  const [sort, setSort] = useState<SortKey>("recomendacao");
  const scores = useMemo(() => scoreResults(q.results), [q.results]);
  const ok = q.results.filter((r) => r.status === "ok");
  const sorted = [...ok].sort((a, b) => sort === "preco" ? a.annualPremium - b.annualPremium : sort === "cobertura" ? coverageScore(b) - coverageScore(a) : sort === "franquia" ? (a.deductible ?? 0) - (b.deductible ?? 0) : sort === "comissao" ? b.commissionPct * b.annualPremium - a.commissionPct * a.annualPremium : (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  const others = q.results.filter((r) => r.status !== "ok");
  const [sel, setSel] = useState<string[]>(() => [...ok].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)).slice(0, 3).map((r) => r.id));
  const [manual, setManual] = useState<QuoteResult | null>(null);
  const [mv, setMv] = useState({ premium: "", deductible: "", ref: "" });
  const best = sorted[0];
  const bestRec = [...ok].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))[0];
  const maxP = Math.max(...ok.map((r) => r.annualPremium), 1);
  const req = q.request;
  const need = req.line === "auto" ? `Seguro auto para ${assetLabel(db, vehicleOf(db, (req as AutoQuoteRequest).vehicleId))}, uso ${(req as AutoQuoteRequest).usage}, bônus classe ${(req as AutoQuoteRequest).bonusClass}.` : (req as GenericQuoteRequest).description;
  const showCommission = can("commissions.view");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card><div className="text-xs text-ink-muted">Seguradoras consultadas</div><div className="mt-1 text-2xl font-semibold">{q.results.length}</div><div className="text-xs text-ink-muted">{ok.length} cotações · {others.length} sem retorno automático</div></Card>
        <Card><div className="text-xs text-ink-muted">Menor prêmio</div><div className="mt-1 text-2xl font-semibold tabular-nums">{ok.length ? money0(Math.min(...ok.map((r) => r.annualPremium))) : "—"}</div><div className="text-xs text-ink-muted">{ok.length ? insurerName(db, [...ok].sort((a, b) => a.annualPremium - b.annualPremium)[0].insurerId) : ""}</div></Card>
        <Card><div className="text-xs text-ink-muted">Recomendada</div><div className="mt-1 text-2xl font-semibold">{bestRec ? insurerName(db, bestRec.insurerId) : "—"}</div><div className="text-xs text-ink-muted">score {bestRec ? scores.get(bestRec.id) : "—"} · preço 60% · cobertura 25% · franquia 15%</div></Card>
        <Card><div className="text-xs text-ink-muted">Amplitude de preço</div><div className="mt-1 text-2xl font-semibold tabular-nums">{ok.length > 1 ? money0(Math.max(...ok.map((r) => r.annualPremium)) - Math.min(...ok.map((r) => r.annualPremium))) : "—"}</div><div className="text-xs text-ink-muted">entre a mais cara e a mais barata</div></Card>
      </div>

      <Card padded={false} title="Resultado do multicálculo" subtitle="Ordenar por" action={<div className="flex items-center gap-2"><Segmented size="sm" value={sort} onChange={setSort} options={[{ value: "recomendacao", label: "Recomendação" }, { value: "preco", label: "Menor preço" }, { value: "cobertura", label: "Cobertura" }, { value: "franquia", label: "Menor franquia" }, ...(showCommission ? [{ value: "comissao" as SortKey, label: "Comissão" }] : [])]} /><ProposalBuilder q={q} selected={sel} recommendedId={bestRec?.id} reason={bestRec ? `Melhor equilíbrio entre preço, coberturas e franquia (score ${scores.get(bestRec.id)}/100).` : undefined} defaultNeed={need} /></div>}>
        <Table>
          <thead><tr><Th className="w-8" /><Th>Seguradora</Th><Th>Produto</Th><Th className="text-right">Prêmio anual</Th><Th className="w-40">Comparativo</Th>{req.line === "auto" && <Th className="text-right">Franquia</Th>}<Th>Coberturas</Th><Th>Assistência</Th>{showCommission && <Th className="text-right">Comissão</Th>}<Th>Score</Th><Th>Fonte</Th></tr></thead>
          <tbody>
            {sorted.map((r) => { const ins = db.insurers.find((i) => i.id === r.insurerId)!; return (
              <tr key={r.id} className={cn("hover:bg-canvas", r.id === best?.id && "bg-brand-50/40")}>
                <Td><input type="checkbox" checked={sel.includes(r.id)} onChange={() => setSel((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))} /></Td>
                <Td><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ins.color }} /><span className="font-medium">{ins.short}</span>{r.id === bestRec?.id && <Badge tone="brand">recomendada</Badge>}</div></Td>
                <Td className="text-sm">{r.productName}</Td>
                <Td className="text-right font-semibold tabular-nums">{money(r.annualPremium)}{r.monthlyPremium && <div className="text-2xs font-normal text-ink-muted">10× {money(r.monthlyPremium)}</div>}</Td>
                <Td><div className="h-2 rounded-full bg-line-soft"><div className="h-2 rounded-full" style={{ width: `${(r.annualPremium / maxP) * 100}%`, background: ins.color }} /></div></Td>
                {req.line === "auto" && <Td className="text-right tabular-nums text-sm">{r.deductible ? money0(r.deductible) : "—"}</Td>}
                <Td className="text-xs text-ink-soft">{r.coverages.filter((c) => c.included).map((c) => c.name).join(" · ")}</Td>
                <Td className="text-xs text-ink-soft">{r.assistance.join(" · ")}</Td>
                {showCommission && <Td className="text-right text-xs tabular-nums">{pct(r.commissionPct)}<div className="text-ink-muted">{money0(r.annualPremium * r.commissionPct)}</div></Td>}
                <Td><Badge tone="neutral">{scores.get(r.id)}</Badge></Td>
                <Td><SourceChip source={r.source.method === "demo" ? "simulado" : r.source.method} at={r.source.receivedAt} /></Td>
              </tr>); })}
          </tbody>
        </Table>
        {others.length > 0 && (
          <div className="border-t border-line px-4 py-3">
            <div className="mb-2 text-xs font-semibold text-ink-soft">Sem cotação automática</div>
            {others.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-1 text-sm">
                <span className="w-28 font-medium">{insurerName(db, r.insurerId)}</span>
                <Badge tone={r.status === "manual_pendente" ? "warn" : "neutral"}>{r.status === "manual_pendente" ? "entrada manual" : r.status}</Badge>
                <span className="flex-1 text-xs text-ink-muted">{r.message}</span>
                {r.status === "manual_pendente" && <Button size="sm" variant="secondary" onClick={() => { setManual(r); setMv({ premium: "", deductible: "", ref: "" }); }}>Registrar cotação manual</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>
      <Dialog open={!!manual} onClose={() => setManual(null)} title={`Cotação manual — ${manual ? insurerName(db, manual.insurerId) : ""}`} footer={<><Button variant="secondary" onClick={() => setManual(null)}>Cancelar</Button><Button disabled={!mv.premium} onClick={() => { const base = q.results.find((r) => r.status === "ok"); update((d, u) => addManualResult(d, u, q.id, { ...manual!, status: "ok", productName: "Auto Individual (manual)", annualPremium: Number(mv.premium), monthlyPremium: Math.round((Number(mv.premium) / 10) * 100) / 100, deductible: Number(mv.deductible) || undefined, coverages: base?.coverages ?? [], assistance: ["Guincho 250 km"], commissionPct: 0.19, message: undefined, source: { adapter: "entrada-manual", method: "manual", receivedAt: new Date().toISOString(), reference: mv.ref || undefined } })); toast("Cotação manual incluída no comparativo"); setManual(null); }}>Incluir no comparativo</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prêmio anual (R$)"><Input type="number" value={mv.premium} onChange={(e) => setMv({ ...mv, premium: e.target.value })} autoFocus /></Field>
          <Field label="Franquia (R$)"><Input type="number" value={mv.deductible} onChange={(e) => setMv({ ...mv, deductible: e.target.value })} /></Field>
          <Field label="Nº do cálculo no portal (referência)" className="sm:col-span-2"><Input value={mv.ref} onChange={(e) => setMv({ ...mv, ref: e.target.value })} /></Field>
          <p className="text-xs text-ink-muted sm:col-span-2">Seguradoras sem integração entram no mesmo comparativo via entrada manual, com a origem registrada (“manual”, responsável e data).</p>
        </div>
      </Dialog>
      <p className="text-2xs text-ink-muted">Valores simulados pela calculadora DEMO ({date(q.createdAt.slice(0, 10))}). Não representam tarifas reais.</p>
    </div>
  );
}
