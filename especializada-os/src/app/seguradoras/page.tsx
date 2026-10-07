"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/data/store";
import { Badge, Button, Card, DemoBadge, Dialog, Field, Icons, Input, LineBadge, PageHeader, Progress, Segmented, SourceChip } from "@/components/ui";
import { addInsurer, updateInsurer, toggleIntegrationStep, INTEGRATION_STEPS } from "@/data/actions-insurers";
import { PRODUCTS } from "@/domain/products";
import type { ProductLine } from "@/domain/types";
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
  const { db, visible, can, update, toast } = useStore();
  const [editing, setEditing] = useState<Insurer | "new" | null>(null);
  const canManage = can("settings.manage") || can("policies.edit");
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

  return (
    <div>
      <PageHeader
        icon={<Icons.Landmark className="h-5 w-5" />}
        title="Seguradoras e operadoras"
        subtitle={`${db.insurers.filter((i) => !isHealth(i)).length} seguradoras · ${db.insurers.filter(isHealth).length} operadoras de saúde · ${db.healthPlans.length} planos`}
        actions={<><Segmented value={kind} onChange={setKind} options={[{ value: "todas", label: "Todas" }, { value: "seguradoras", label: "Seguradoras" }, { value: "saude", label: "Saúde" }]} />{canManage && <Button icon={<Icons.Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Adicionar</Button>}</>}
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-demo/20 bg-demo-soft px-4 py-3 text-xs text-ink-soft">
        <Icons.Info className="mt-0.5 h-4 w-4 shrink-0 text-demo" />
        <p>
          <b className="font-semibold text-ink">Catálogo inicial com as principais seguradoras e operadoras do mercado</b> — adicione as demais pelo botão “Adicionar” e ajuste os ramos de cada uma. Nesta DEMO, <b className="font-semibold text-ink">planos, preços, redes e cotações são simulados</b> e não representam produtos ou tarifas dessas empresas.
        </p>
      </div>

      <Card title="Integração própria" subtitle="Decisão: cada seguradora ganha um adapter próprio (sem agregador). Sem scraping — apenas vias autorizadas pela seguradora." className="mb-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {INTEGRATION_STEPS.map((st, i) => (
            <div key={st.key} className="rounded-lg bg-canvas p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-2xs text-brand-700">{i + 1}</span>{st.label}</div>
              <p className="mt-1 text-2xs leading-relaxed text-ink-muted">{st.hint}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-2xs text-ink-muted">Enquanto a integração não está em produção, a seguradora entra no multicálculo como <b className="font-medium">cotação manual</b> (o corretor cota no portal e registra o resultado, com origem e responsável). Detalhes: docs/INTEGRATIONS.md.</p>
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
                    {ins.integration.status === "demo" && <DemoBadge />}
                    {ins.custom && <Badge tone="brand">adicionada</Badge>}
                    {canManage && <button onClick={() => setEditing(ins)} className="text-2xs font-medium text-brand-700 hover:underline">editar</button>}
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
                {ins.integrationPath && (
                  <div className="rounded-lg bg-canvas px-3 py-2 text-xs">
                    <div className="mb-0.5 flex items-center gap-1.5 font-medium text-ink"><Icons.Route className="h-3.5 w-3.5 text-brand-600" />Caminho de integração · onda {ins.integrationPath.wave}<Badge tone={ins.integrationPath.confirmed ? "ok" : "warn"}>{ins.integrationPath.confirmed ? "evidência pública" : "a confirmar"}</Badge></div>
                    <p className="text-ink-soft">{ins.integrationPath.summary}</p>
                  </div>
                )}
                <IntegrationChecklist ins={ins} canEdit={canManage} onToggle={(k) => update((d, u) => toggleIntegrationStep(d, u, ins.id, k))} />

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
      {editing && <InsurerDialog insurer={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSave={(data) => { update((d, u) => (editing === "new" ? addInsurer(d, u, data) : updateInsurer(d, u, editing.id, data))); toast(editing === "new" ? `${data.name} adicionada ao catálogo` : "Cadastro atualizado"); setEditing(null); }} />}
    </div>
  );
}

function IntegrationChecklist({ ins, canEdit, onToggle }: { ins: Insurer; canEdit: boolean; onToggle: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const done = INTEGRATION_STEPS.filter((st) => ins.integrationSteps?.[st.key]).length;
  return (
    <div className="rounded-lg border border-line-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-3 py-2 text-left">
        <span className="text-xs font-medium text-ink">Integração própria</span>
        <Progress value={done / INTEGRATION_STEPS.length} className="flex-1" tone={done === INTEGRATION_STEPS.length ? "ok" : "brand"} />
        <span className="text-2xs tabular-nums text-ink-muted">{done}/{INTEGRATION_STEPS.length}</span>
        <Icons.ChevronDown className={cn("h-3.5 w-3.5 text-ink-faint transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-1 border-t border-line-soft px-3 py-2">
          {INTEGRATION_STEPS.map((st) => (
            <label key={st.key} className="flex items-start gap-2 text-xs">
              <input type="checkbox" disabled={!canEdit} checked={!!ins.integrationSteps?.[st.key]} onChange={() => onToggle(st.key)} className="mt-0.5" />
              <span><span className="text-ink">{st.label}</span> <span className="text-ink-muted">— {st.hint}</span></span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function InsurerDialog({ insurer, onClose, onSave }: { insurer?: Insurer; onClose: () => void; onSave: (d: { name: string; short: string; color: string; lines: ProductLine[] }) => void }) {
  const [name, setName] = useState(insurer?.name ?? "");
  const [short, setShort] = useState(insurer?.short ?? "");
  const [color, setColor] = useState(insurer?.color ?? "#475569");
  const [lines, setLines] = useState<ProductLine[]>(insurer?.lines ?? []);
  return (
    <Dialog open onClose={onClose} title={insurer ? `Editar ${insurer.name}` : "Adicionar seguradora / operadora"} wide footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={name.trim().length < 2 || !lines.length} onClick={() => onSave({ name: name.trim(), short: short.trim() || name.trim().split(" ")[0], color, lines })}>Salvar</Button></>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome" className="sm:col-span-2"><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Mitsui Sumitomo Seguros" /></Field>
        <Field label="Nome curto"><Input value={short} onChange={(e) => setShort(e.target.value)} placeholder="Ex.: Mitsui" /></Field>
        <Field label="Cor (identificação visual)"><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 p-1" /></Field>
      </div>
      <div className="mt-4 text-xs font-medium text-ink-soft">Ramos com que a corretora trabalha nesta seguradora</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRODUCTS.map((pm) => (
          <button key={pm.line} type="button" onClick={() => setLines((ls) => (ls.includes(pm.line) ? ls.filter((x) => x !== pm.line) : [...ls, pm.line]))} className={cn("rounded-lg border px-2 py-1 text-xs", lines.includes(pm.line) ? "border-brand-400 bg-brand-50 text-brand-800" : "border-line text-ink-soft hover:border-brand-300")}>{pm.label}</button>
        ))}
      </div>
      {!insurer && <p className="mt-4 text-2xs text-ink-muted">A seguradora entra como “cotação manual” até a integração própria ser concluída (checklist no card).</p>}
    </Dialog>
  );
}
