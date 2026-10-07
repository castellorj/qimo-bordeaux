"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useStore } from "@/data/store";
import { Icons } from "@/components/ui";
import { markProposalViewed } from "@/data/actions";
import { partyName } from "@/domain/engines/queries";
import { COVERAGE_LABEL, REIMB_LABEL } from "@/domain/engines/health";
import { healthPlanOf, proposalOptions } from "@/components/commercial/helpers";
import { waLink } from "@/integrations/whatsapp";
import { date, firstName, money, money0 } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { lineLabel } from "@/domain/products";
import type { DB, QuoteResult } from "@/domain/types";
import { cn } from "@/lib/cn";

/** Número placeholder do corretor na DEMO (não é um número real). */
const BROKER_WA = "5521900000000";

function Highlights({ db, r }: { db: DB; r: QuoteResult }) {
  const plan = healthPlanOf(db, r);
  const items: string[] = plan
    ? [
        plan.accommodation === "apartamento" ? "Quarto privativo (apartamento)" : "Enfermaria",
        plan.coparticipation ? "Com coparticipação" : "Sem coparticipação",
        plan.reimbursement === "nenhum" ? "Sem reembolso" : `Reembolso ${REIMB_LABEL[plan.reimbursement].toLowerCase()}${plan.reimbursementConsultation ? ` (consulta até ${money0(plan.reimbursementConsultation)})` : ""}`,
        `Abrangência ${COVERAGE_LABEL[plan.coverage].toLowerCase()}`,
      ]
    : [
        ...(r.deductible != null ? [`Franquia ${money0(r.deductible)}`] : []),
        ...r.coverages.filter((c) => c.included).map((c) => `${c.name}${c.limit ? ` · ${money0(c.limit)}` : ""}`),
        ...r.assistance,
      ];
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
          <Icons.Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function PublicProposal() {
  const { id } = useParams<{ id: string }>();
  const { db, ready, update, today } = useStore();
  const tracked = useRef(false);
  const pr = db.proposals.find((p) => p.id === id);

  useEffect(() => {
    if (!ready || tracked.current || !pr) return;
    tracked.current = true;
    if (pr.status === "enviada") update((d) => markProposalViewed(d, pr.id));
  }, [ready, pr, update]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500"><Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando proposta…</div>;

  if (!pr) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <Brand />
        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icons.FileQuestion className="h-6 w-6" /></div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">Não encontramos esta proposta</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500">O link pode estar incompleto ou a proposta foi substituída. Fale com seu corretor para receber um novo link.</p>
      </div>
    );
  }

  const { options, recommended, accepted } = proposalOptions(db, pr);
  const client = partyName(db, pr.party);
  const broker = db.users.find((u) => u.id === pr.ownerId);
  const brokerName = broker?.name ?? "Equipe Especializada";
  const validDays = daysBetween(today, pr.validUntil);
  const expired = pr.status === "expirada" || (validDays < 0 && !["aceita", "recusada"].includes(pr.status));
  const ordered = recommended ? [recommended, ...options.filter((o) => o.id !== recommended.id)] : options;
  const isHealth = pr.line === "saude";
  const insurer = (r: QuoteResult) => db.insurers.find((i) => i.id === r.insurerId);
  const wantMsg = (r: QuoteResult) => `Olá ${firstName(brokerName)}! Sou ${client}. Vi a proposta ${pr.code} e quero seguir com a opção ${insurer(r)?.short ?? ""} — ${r.productName} (${money0(r.annualPremium)}/ano).`;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="no-print pointer-events-none fixed right-[-44px] top-5 z-50 rotate-45 bg-fuchsia-700/90 px-12 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow">DEMO</div>

      <header className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white print:bg-none print:text-slate-900">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 print:pb-6">
          <div className="flex items-center justify-between">
            <Brand light />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/20 print:ring-slate-300">Proposta {pr.code}</span>
          </div>
          <div className="mt-10">
            <p className="text-sm text-brand-100 print:text-slate-500">Seguro {lineLabel(pr.line).toLowerCase()} · preparado para</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{client}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-50/90 print:text-slate-600">{pr.need}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-4xl space-y-6 px-5 pb-16 sm:px-8 print:mt-0">
        {expired && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Icons.Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>Esta proposta venceu em {date(pr.validUntil)}. Os preços podem ter mudado — fale com {firstName(brokerName)} para receber valores atualizados.</div>
          </div>
        )}
        {accepted && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>Opção escolhida: <b>{insurer(accepted)?.short} — {accepted.productName}</b>. Seu corretor já está cuidando da emissão.</div>
          </div>
        )}

        {recommended && (
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-[0_10px_40px_-15px_rgba(31,79,224,0.35)] print:shadow-none">
            <div className="flex items-center gap-2 bg-brand-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Icons.Sparkles className="h-3.5 w-3.5" /> Nossa recomendação para você
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: insurer(recommended)?.color }} />
                  <span className="text-sm font-medium text-slate-500">{insurer(recommended)?.name}</span>
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{recommended.productName}</h2>
                {pr.recommendationReason && <p className="mt-2 text-sm leading-relaxed text-slate-600"><b className="font-medium text-slate-800">Por que esta opção:</b> {pr.recommendationReason}</p>}
                <div className="mt-4"><Highlights db={db} r={recommended} /></div>
              </div>
              <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                <div className="sm:text-right">
                  {recommended.monthlyPremium != null && <div className="text-3xl font-semibold tabular-nums text-slate-900">{money(recommended.monthlyPremium)}<span className="text-sm font-normal text-slate-500">/mês</span></div>}
                  <div className={cn("tabular-nums", recommended.monthlyPremium != null ? "text-sm text-slate-500" : "text-3xl font-semibold text-slate-900")}>{money(recommended.annualPremium)}<span className="text-sm font-normal text-slate-500">/ano</span></div>
                </div>
                {!expired && !accepted && (
                  <a href={waLink(BROKER_WA, wantMsg(recommended))} target="_blank" rel="noopener noreferrer" className="no-print inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
                    <Icons.MessageCircle className="h-4 w-4" /> Quero esta opção
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {ordered.length > 1 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{recommended ? "Outras opções avaliadas" : "Opções avaliadas"}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {ordered.filter((o) => o.id !== recommended?.id).map((o) => (
                <div key={o.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 print:break-inside-avoid">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: insurer(o)?.color }} />
                    <span className="text-xs font-medium text-slate-500">{insurer(o)?.name}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">{o.productName}</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
                    {o.monthlyPremium != null ? <>{money(o.monthlyPremium)}<span className="text-xs font-normal text-slate-500">/mês</span></> : <>{money(o.annualPremium)}<span className="text-xs font-normal text-slate-500">/ano</span></>}
                  </div>
                  {o.monthlyPremium != null && <div className="text-xs tabular-nums text-slate-500">{money(o.annualPremium)}/ano</div>}
                  <div className="mt-4 flex-1"><Highlights db={db} r={o} /></div>
                  {!expired && !accepted && (
                    <a href={waLink(BROKER_WA, wantMsg(o))} target="_blank" rel="noopener noreferrer" className="no-print mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700">
                      <Icons.MessageCircle className="h-4 w-4" /> Quero esta opção
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {ordered.length > 1 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white print:break-inside-avoid">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Comparativo lado a lado</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-2.5">Opção</th>
                    <th className="px-4 py-2.5 text-right">{isHealth ? "Mensal" : "Anual"}</th>
                    {isHealth ? (<><th className="px-4 py-2.5">Acomodação</th><th className="px-4 py-2.5">Coparticipação</th><th className="px-4 py-2.5">Reembolso</th><th className="px-4 py-2.5">Abrangência</th></>) : (<><th className="px-4 py-2.5 text-right">Franquia</th><th className="px-4 py-2.5">Coberturas</th><th className="px-4 py-2.5">Assistências</th></>)}
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((o) => {
                    const plan = healthPlanOf(db, o);
                    const rec = o.id === recommended?.id;
                    return (
                      <tr key={o.id} className={cn("border-t border-slate-100", rec && "bg-brand-50/50")}>
                        <td className="px-4 py-3"><div className="font-medium text-slate-900">{insurer(o)?.short}{rec && <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">RECOMENDADA</span>}</div><div className="text-xs text-slate-500">{o.productName}</div></td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{isHealth ? money(o.monthlyPremium ?? o.annualPremium / 12) : money0(o.annualPremium)}</td>
                        {isHealth ? (
                          <>
                            <td className="px-4 py-3 capitalize text-slate-600">{plan?.accommodation ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{plan ? (plan.coparticipation ? "Com" : "Sem") : "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{plan ? REIMB_LABEL[plan.reimbursement] : "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{plan ? COVERAGE_LABEL[plan.coverage] : "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600">{o.deductible != null ? money0(o.deductible) : "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{o.coverages.filter((c) => c.included).length || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{o.assistance.length ? o.assistance.join(", ") : "—"}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!options.length && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">As opções desta proposta ainda estão sendo preparadas pelo seu corretor.</div>}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Seu corretor</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{brokerName.split(" ").slice(0, 2).map((p) => p[0]).join("")}</div>
              <div>
                <div className="font-semibold text-slate-900">{brokerName}</div>
                <div className="text-sm text-slate-500">{broker?.email ?? "contato@especializada.demo"}</div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">WhatsApp +55 (21) 90000-0000 <span className="rounded bg-fuchsia-50 px-1 text-[10px] font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200">DEMO</span></div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Validade</div>
            <div className="mt-3 text-lg font-semibold text-slate-900">{date(pr.validUntil)}</div>
            <p className="mt-1 text-sm text-slate-500">{expired ? "Proposta vencida." : validDays === 0 ? "Válida até hoje." : `Válida por mais ${validDays} dia${validDays > 1 ? "s" : ""}.`} Valores sujeitos à aceitação da seguradora/operadora e análise de risco.</p>
          </div>
        </section>

        <div className="no-print flex flex-wrap items-center justify-center gap-3 pt-2">
          {recommended && !expired && !accepted && (
            <a href={waLink(BROKER_WA, wantMsg(recommended))} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              <Icons.MessageCircle className="h-4 w-4" /> Quero a opção recomendada
            </a>
          )}
          <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:border-slate-300">
            <Icons.Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </button>
        </div>

        <footer className="border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-400">
          Especializada Seguros · Corretora de seguros · Proposta {pr.code}
          <br />
          Versão DEMO — planos, coberturas e valores são simulados e não constituem oferta das seguradoras citadas.
        </footer>
      </main>
    </div>
  );
}

function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold", light ? "bg-white text-brand-700 print:bg-brand-700 print:text-white" : "bg-brand-700 text-white")}>E</div>
      <div className="leading-tight">
        <div className={cn("text-sm font-semibold", light ? "text-white print:text-slate-900" : "text-slate-900")}>Especializada Seguros</div>
        <div className={cn("text-[11px]", light ? "text-brand-100 print:text-slate-500" : "text-slate-500")}>Corretora de seguros</div>
      </div>
    </div>
  );
}
