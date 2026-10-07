"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/data/store";
import { Badge, Card, DemoBadge, Icons, LineBadge, PageHeader, Segmented, SourceChip } from "@/components/ui";
import type { Insurer } from "@/domain/types";
import { COVERAGE_LABEL, REIMB_LABEL } from "@/domain/engines/health";
import { INTEGRATION_INFO } from "@/components/commercial/helpers";
import { date, money0, moneyK, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS: Record<Insurer["integration"]["status"], { label: string; tone: "demo" | "neutral" | "ok" | "danger" }> = {
  demo: { label: "Simulada (DEMO)", tone: "demo" },
  nao_configurada: { label: "Não configurada", tone: "neutral" },
  ativa: { label: "Ativa", tone: "ok" },
  erro: { label: "Erro", tone: "danger" },
};
const TIER = ["", "Básico", "Intermediário", "Superior", "Premium"];
const SOURCE_KIND: Record<string, string> = { xlsx: "Planilha", csv: "CSV", pdf: "PDF", api: "API", manual: "Manual" };

export default function SeguradorasPage() {
  const { db, visible } = useStore();
  const [kind, setKind] = useState<"todas" | "seguradoras" | "saude">("todas");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash.slice(1));
    read();
    if (window.location.hash) setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const policies = db.policies.filter((p) => (p.status === "vigente" || p.status === "em_emissao") && visible(p.holder));
  const isHealth = (i: Insurer) => i.lines.includes("saude");
  const list = db.insurers.filter((i) => (kind === "todas" ? true : kind === "saude" ? isHealth(i) : !isHealth(i)));
  const methods = Array.from(new Set(db.insurers.map((i) => i.integration.method)));

  return (
    <div>
      <PageHeader
        icon={<Icons.Landmark className="h-5 w-5" />}
        title="Seguradoras e operadoras"
        subtitle={`${db.insurers.filter((i) => !isHealth(i)).length} seguradoras · ${db.insurers.filter(isHealth).length} operadoras de saúde · ${db.healthPlans.length} planos`}
        actions={<Segmented value={kind} onChange={setKind} options={[{ value: "todas", label: "Todas" }, { value: "seguradoras", label: "Seguradoras" }, { value: "saude", label: "Saúde" }]} />}
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-demo/20 bg-demo-soft px-4 py-3 text-xs text-ink-soft">
        <Icons.Info className="mt-0.5 h-4 w-4 shrink-0 text-demo" />
        <p>
          <b className="font-semibold text-ink">Nomes fictícios para a DEMO.</b> Seguradoras, operadoras, planos, preços e redes desta versão são ilustrativos. Integrações reais dependem de contratos e APIs disponibilizadas por cada parceiro (ver <span className="font-mono">docs/INTEGRATIONS.md</span>): API oficial, API de parceiro, integração autorizada, importação de arquivos fornecidos ou processo manual. <b className="font-semibold text-ink">Nenhum scraping</b> ou automação de portal com credenciais do corretor é utilizado.
        </p>
      </div>

      <Card title="Como cada integração funciona" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {methods.map((m) => (
            <div key={m} className="rounded-lg bg-canvas p-3">
              <div className="text-xs font-semibold text-ink">{INTEGRATION_INFO[m].label}</div>
              <p className="mt-1 text-2xs leading-relaxed text-ink-muted">{INTEGRATION_INFO[m].explain}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((ins) => {
          const ps = policies.filter((p) => p.insurerId === ins.id);
          const premium = ps.reduce((s, p) => s + p.annualPremium, 0);
          const plans = db.healthPlans.filter((p) => p.insurerId === ins.id).sort((a, b) => a.tier - b.tier);
          const sources = db.networkSources.filter((s) => s.insurerId === ins.id);
          const st = STATUS[ins.integration.status];
          return (
            <section key={ins.id} id={ins.id} className={cn("scroll-mt-20 rounded-xl border bg-white shadow-card", hash === ins.id ? "border-brand-400 ring-2 ring-brand-100" : "border-line")}>
              <div className="flex items-start gap-3 border-b border-line-soft p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: ins.color }}>{ins.short.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">{ins.name}</h2>
                    <DemoBadge />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">{ins.lines.map((l) => <LineBadge key={l} line={l} />)}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums text-ink">{ps.length}</div>
                  <div className="text-2xs text-ink-muted">apólices ativas</div>
                  <Link href={`/apolices?seguradora=${ins.id}`} className="text-2xs font-medium text-brand-700 hover:underline">{moneyK(premium)}/ano</Link>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand"><Icons.Plug className="h-2.5 w-2.5" />{INTEGRATION_INFO[ins.integration.method].label}</Badge>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  {ins.integration.note && <span className="text-xs text-ink-muted">{ins.integration.note}</span>}
                </div>
                <p className="text-xs leading-relaxed text-ink-muted">{INTEGRATION_INFO[ins.integration.method].explain}</p>

                {sources.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">Fonte da rede credenciada</div>
                    {sources.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-xs">
                        <span className="font-medium text-ink">{s.label}</span>
                        <SourceChip source={`${SOURCE_KIND[s.kind] ?? s.kind} importado`} at={s.importedAt} stale={s.status === "expirada"} />
                        <span className={cn("text-2xs", s.status === "expirada" ? "font-medium text-warn-strong" : s.status === "expirando" ? "text-warn-strong" : "text-ink-muted")}>
                          {s.status === "expirada" ? `expirou em ${date(s.validUntil)} — confirmar com a operadora` : `válida até ${date(s.validUntil)}${s.status === "expirando" ? " (expirando)" : ""}`}
                        </span>
                        <span className="ml-auto text-2xs text-ink-faint">confiança {pct(s.confidence)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {plans.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted">Planos ({plans.length})</div>
                    <div className="overflow-x-auto rounded-lg border border-line-soft">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-canvas text-left text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                            <th className="px-2.5 py-1.5">Plano</th><th className="px-2.5 py-1.5">Categoria</th><th className="px-2.5 py-1.5">Acomodação</th><th className="px-2.5 py-1.5">Abrangência</th><th className="px-2.5 py-1.5">Reembolso</th><th className="px-2.5 py-1.5 text-right">A partir de</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plans.map((p) => (
                            <tr key={p.id} className="border-t border-line-soft">
                              <td className="px-2.5 py-1.5"><div className="font-medium text-ink">{p.name}</div><div className="text-2xs text-ink-muted">{p.segment}{p.coparticipation ? " · coparticipação" : ""}</div></td>
                              <td className="px-2.5 py-1.5 text-ink-soft">{TIER[p.tier]}</td>
                              <td className="px-2.5 py-1.5 capitalize text-ink-soft">{p.accommodation}</td>
                              <td className="px-2.5 py-1.5 text-ink-soft">{COVERAGE_LABEL[p.coverage]}</td>
                              <td className="px-2.5 py-1.5 text-ink-soft">{REIMB_LABEL[p.reimbursement]}{p.reimbursementConsultation ? ` · ${money0(p.reimbursementConsultation)}` : ""}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums text-ink-soft">{money0(Math.min(...Object.values(p.pricesByBand)))}/mês</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-2xs text-ink-muted">
                      <span>Preço por vida na menor faixa etária (tabela importada)</span>
                      <Link href="/rede" className="font-medium text-brand-700 hover:underline">Ver rede credenciada →</Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
