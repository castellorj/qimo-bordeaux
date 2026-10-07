"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useStore } from "@/data/store";
import { Badge, Button, Card, Dialog, Empty, Field, Icons, Input, KeyVal, LineBadge, LinkButton, PageHeader, SourceChip, Table, Td, Th } from "@/components/ui";
import { ProposalStatusBadge } from "@/components/status";
import { decideProposal, issuePolicyFromProposal, markProposalViewed, sendProposal } from "@/data/actions";
import { partyHref, partyName, partyPhone, userName } from "@/domain/engines/queries";
import { COVERAGE_LABEL, REIMB_LABEL, whatChanges } from "@/domain/engines/health";
import { healthPlanOf, optionDiffs, optionLabel, proposalOptions, suggestPolicyNumber } from "@/components/commercial/helpers";
import { waLink } from "@/integrations/whatsapp";
import { date, dateTime, firstName, money, money0, pct } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { lineLabel } from "@/domain/products";
import type { HealthQuoteRequest, QuoteResult } from "@/domain/types";
import { cn } from "@/lib/cn";

export default function PropostaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, user, today, update, can, visible, toast } = useStore();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [policyNumber, setPolicyNumber] = useState("");

  const pr = db.proposals.find((p) => p.id === id);
  const data = useMemo(() => (pr ? proposalOptions(db, pr) : { options: [] as QuoteResult[] }), [db, pr]);

  if (!pr) return <Empty icon={<Icons.FileQuestion className="h-5 w-5" />} title="Proposta não encontrada" action={<LinkButton href="/propostas">Voltar para propostas</LinkButton>}>O link pode estar incorreto ou a proposta foi removida.</Empty>;
  if (!visible(pr.party)) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso a esta proposta" action={<LinkButton href="/propostas">Voltar</LinkButton>}>Ela pertence à carteira de outro corretor.</Empty>;

  const { quote, options, recommended, accepted } = data as ReturnType<typeof proposalOptions>;
  const showComm = can("commissions.view");
  const canEdit = can("proposals.edit");
  const isHealth = pr.line === "saude";
  const healthReq = quote?.request.line === "saude" ? (quote.request as HealthQuoteRequest) : undefined;
  const ages = healthReq?.beneficiaries.map((b) => b.age) ?? [];
  const phone = partyPhone(db, pr.party);
  const issued = db.policies.find((p) => p.proposalId === pr.id);
  const validDays = daysBetween(today, pr.validUntil);
  const open = ["rascunho", "enviada", "visualizada"].includes(pr.status);
  const publicLink = () => `${window.location.origin}/p/${pr.id}`;

  const sendWhatsApp = () => {
    const msg = `Olá ${firstName(partyName(db, pr.party))}! Preparei sua proposta de seguro ${lineLabel(pr.line).toLowerCase()} (${pr.code}) com ${options.length} ${options.length === 1 ? "opção" : "opções"} comparadas${recommended ? " e a minha recomendação" : ""}. Você pode ver tudo aqui: ${publicLink()}`;
    // reenvio após visualização não deve regredir a oportunidade no CRM
    if (pr.status !== "visualizada") update((d, u) => sendProposal(d, u, pr.id, "whatsapp"));
    window.open(waLink(phone, msg), "_blank", "noopener,noreferrer");
    toast(pr.status === "rascunho" ? "Proposta marcada como enviada · WhatsApp aberto" : "WhatsApp aberto com o link da proposta");
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink());
      toast("Link da proposta copiado");
    } catch {
      toast("Não foi possível copiar automaticamente", "warn");
    }
  };
  const simulateView = () => {
    update((d) => markProposalViewed(d, pr.id));
    toast("Visualização registrada (simulação)", "info");
  };
  const confirmAccept = () => {
    update((d, u) => decideProposal(d, u, pr.id, "aceita", choice || recommended?.id));
    setAcceptOpen(false);
    toast("Proposta aceita · tarefa de emissão criada para a operação");
  };
  const confirmRefuse = () => {
    update((d, u) => decideProposal(d, u, pr.id, "recusada"));
    setRefuseOpen(false);
    toast("Proposta marcada como recusada", "info");
  };
  const openIssue = () => {
    const res = accepted ?? recommended;
    setPolicyNumber(res ? suggestPolicyNumber(db, res.insurerId, pr.line) : "");
    setIssueOpen(true);
  };
  const confirmIssue = () => {
    const num = policyNumber.trim();
    if (!num) return;
    const r = issuePolicyFromProposal(db, user, pr.id, num);
    update(() => r.db);
    setIssueOpen(false);
    toast(`Apólice ${num} registrada · renovação e comissões programadas`);
    router.push(`/apolices/${r.id}`);
  };

  const timeline: { label: string; at?: string; icon: ReactNode; tone?: "ok" | "danger" }[] = [
    { label: "Criada", at: pr.createdAt, icon: <Icons.FilePlus2 className="h-3.5 w-3.5" /> },
    { label: "Enviada ao cliente", at: pr.sentAt, icon: <Icons.Send className="h-3.5 w-3.5" /> },
    { label: "Visualizada pelo cliente", at: pr.viewedAt, icon: <Icons.Eye className="h-3.5 w-3.5" /> },
    { label: pr.status === "recusada" ? "Recusada" : pr.status === "aceita" || issued ? "Aceita" : "Decisão do cliente", at: pr.decidedAt, icon: pr.status === "recusada" ? <Icons.X className="h-3.5 w-3.5" /> : <Icons.Check className="h-3.5 w-3.5" />, tone: pr.status === "recusada" ? "danger" : pr.decidedAt ? "ok" : undefined },
  ];
  if (issued) timeline.push({ label: `Apólice ${issued.number} emitida`, at: issued.dataSource.at, icon: <Icons.ShieldCheck className="h-3.5 w-3.5" />, tone: "ok" });

  const others = options.filter((o) => o.id !== recommended?.id);
  const recPlan = healthPlanOf(db, recommended);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Propostas", href: "/propostas" }, { label: pr.code, href: `/propostas/${pr.id}` }]}
        icon={<Icons.FileText className="h-5 w-5" />}
        title={<span className="flex items-center gap-2">{pr.code} <ProposalStatusBadge status={pr.status} /></span>}
        subtitle={<><Link href={partyHref(pr.party)} className="font-medium text-ink hover:text-brand-700">{partyName(db, pr.party)}</Link> · {lineLabel(pr.line)} · responsável {userName(db, pr.ownerId)}</>}
        actions={
          <>
            <Button variant="secondary" onClick={copyLink} icon={<Icons.Link2 className="h-4 w-4" />}>Copiar link</Button>
            <LinkButton href={`/p/${pr.id}`} external icon={<Icons.ExternalLink className="h-4 w-4" />}>Abrir página do cliente</LinkButton>
            {canEdit && open && <Button onClick={sendWhatsApp} icon={<Icons.MessageCircle className="h-4 w-4" />}>Enviar por WhatsApp</Button>}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Necessidade do cliente" subtitle="Base da recomendação">
            <p className="text-sm text-ink-soft">{pr.need}</p>
            {recommended && (
              <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                  <Icons.Star className="h-4 w-4 fill-brand-500 text-brand-500" /> Recomendação: {optionLabel(db, recommended)}
                  <span className="ml-auto tabular-nums">{money0(recommended.annualPremium)}/ano</span>
                </div>
                {pr.recommendationReason && <p className="mt-1 text-xs text-ink-soft">{pr.recommendationReason}</p>}
              </div>
            )}
          </Card>

          <Card padded={false} title="Opções comparadas" subtitle={quote ? <>Resultados da cotação <Link href={`/cotacoes/${quote.id}`} className="text-brand-700 hover:underline">{quote.id}</Link> · {dateTime(quote.createdAt)}</> : "Cotação vinculada não encontrada"}>
            <Table>
              <thead>
                <tr>
                  <Th>Seguradora / produto</Th>
                  <Th className="text-right">Anual</Th>
                  <Th className="text-right">Mensal</Th>
                  {isHealth ? (
                    <>
                      <Th>Acomodação</Th>
                      <Th>Coparticipação</Th>
                      <Th>Reembolso</Th>
                      <Th>Abrangência</Th>
                    </>
                  ) : (
                    <>
                      <Th className="text-right">Franquia</Th>
                      <Th>Coberturas</Th>
                      <Th>Assistência</Th>
                    </>
                  )}
                  {showComm && <Th className="text-right">Comissão</Th>}
                </tr>
              </thead>
              <tbody>
                {options.map((o) => {
                  const plan = healthPlanOf(db, o);
                  const isRec = o.id === recommended?.id;
                  const isAcc = o.id === pr.acceptedResultId;
                  const ins = db.insurers.find((i) => i.id === o.insurerId);
                  const inc = o.coverages.filter((c) => c.included);
                  return (
                    <tr key={o.id} className={cn(isRec && "bg-brand-50/50")}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ins?.color }} />
                          <span className="font-medium text-ink">{ins?.short ?? "—"}</span>
                          {isRec && <Badge tone="brand"><Icons.Star className="h-2.5 w-2.5" />Recomendada</Badge>}
                          {isAcc && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />Escolhida</Badge>}
                          {o.status !== "ok" && <Badge tone="warn">{o.status}</Badge>}
                        </div>
                        <div className="pl-[18px] text-2xs text-ink-muted">{o.productName}</div>
                        <div className="pl-[18px] pt-0.5"><SourceChip source={o.source.method === "demo" ? "calculadora DEMO" : o.source.method} at={o.source.receivedAt} /></div>
                      </Td>
                      <Td className="text-right font-medium tabular-nums">{money0(o.annualPremium)}</Td>
                      <Td className="text-right tabular-nums text-ink-soft">{o.monthlyPremium != null ? money(o.monthlyPremium) : "—"}</Td>
                      {isHealth ? (
                        <>
                          <Td className="text-xs capitalize">{plan?.accommodation ?? "—"}</Td>
                          <Td className="text-xs">{plan ? (plan.coparticipation ? "Com" : "Sem") : "—"}</Td>
                          <Td className="text-xs">{plan ? REIMB_LABEL[plan.reimbursement] : "—"}</Td>
                          <Td className="text-xs">{plan ? COVERAGE_LABEL[plan.coverage] : "—"}</Td>
                        </>
                      ) : (
                        <>
                          <Td className="text-right tabular-nums text-ink-soft">{o.deductible != null ? money0(o.deductible) : "—"}</Td>
                          <Td className="max-w-[220px] text-xs text-ink-soft"><span title={inc.map((c) => `${c.name}${c.limit ? ` (${money0(c.limit)})` : ""}`).join("\n")}>{inc.length ? `${inc.length} · ${inc.slice(0, 3).map((c) => c.name).join(", ")}${inc.length > 3 ? "…" : ""}` : "—"}</span></Td>
                          <Td className="max-w-[200px] text-xs text-ink-soft"><span title={o.assistance.join("\n")}>{o.assistance.length ? `${o.assistance.slice(0, 2).join(", ")}${o.assistance.length > 2 ? ` +${o.assistance.length - 2}` : ""}` : "—"}</span></Td>
                        </>
                      )}
                      {showComm && <Td className="text-right tabular-nums text-ink-soft">{pct(o.commissionPct, 1)}<div className="text-2xs text-ink-faint">{money0(o.annualPremium * o.commissionPct)}</div></Td>}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            {!options.length && <Empty title="Sem opções vinculadas">Os resultados da cotação não foram encontrados.</Empty>}
          </Card>

          {recommended && others.length > 0 && (
            <Card title="O que muda?" subtitle={`Diferenças em relação à recomendada (${optionLabel(db, recommended)}) — cálculo determinístico, sem IA`}>
              <div className="grid gap-3 md:grid-cols-2">
                {others.map((o) => {
                  const plan = healthPlanOf(db, o);
                  const lines = isHealth && recPlan && plan ? whatChanges(db, recPlan, plan, ages, healthReq?.desiredProviderIds ?? []) : optionDiffs(db, recommended, o);
                  return (
                    <div key={o.id} className="rounded-lg border border-line p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{optionLabel(db, o)}</span>
                        <span className="text-xs tabular-nums text-ink-muted">{money0(o.annualPremium)}/ano</span>
                      </div>
                      <ul className="space-y-1">
                        {lines.map((l, i) => <li key={i} className="flex gap-1.5 text-xs text-ink-soft"><Icons.Dot className="-mx-1 h-4 w-4 shrink-0 text-ink-faint" />{l}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Linha do tempo">
            <ol className="relative space-y-4 border-l border-line pl-5">
              {timeline.map((t) => (
                <li key={t.label} className="relative">
                  <span className={cn("absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border bg-white", t.at ? (t.tone === "danger" ? "border-red-200 text-danger" : t.tone === "ok" ? "border-emerald-200 text-ok" : "border-brand-200 text-brand-600") : "border-line text-ink-faint")}>{t.icon}</span>
                  <div className={cn("text-sm", t.at ? "font-medium text-ink" : "text-ink-faint")}>{t.label}</div>
                  <div className="text-2xs text-ink-muted">{t.at ? dateTime(t.at) : "pendente"}</div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Ações">
            <div className="space-y-2">
              {issued ? (
                <LinkButton href={`/apolices/${issued.id}`} variant="subtle" className="w-full" icon={<Icons.ShieldCheck className="h-4 w-4" />}>Ver apólice {issued.number}</LinkButton>
              ) : pr.status === "aceita" && canEdit ? (
                <Button className="w-full" onClick={openIssue} icon={<Icons.ShieldPlus className="h-4 w-4" />}>Registrar emissão da apólice</Button>
              ) : null}
              {canEdit && open && (
                <>
                  {pr.status === "enviada" && <Button variant="secondary" className="w-full" onClick={simulateView} icon={<Icons.Eye className="h-4 w-4" />}>Simular visualização pelo cliente</Button>}
                  <Button variant="secondary" className="w-full" onClick={() => { setChoice(recommended?.id ?? options[0]?.id ?? ""); setAcceptOpen(true); }} disabled={!options.length} icon={<Icons.ThumbsUp className="h-4 w-4 text-ok" />}>Cliente aceitou</Button>
                  <Button variant="ghost" className="w-full" onClick={() => setRefuseOpen(true)} icon={<Icons.ThumbsDown className="h-4 w-4 text-danger" />}>Cliente recusou</Button>
                </>
              )}
              {!canEdit && <p className="text-xs text-ink-muted">Seu perfil pode visualizar, mas não alterar propostas.</p>}
              {!open && !issued && pr.status !== "aceita" && <p className="text-xs text-ink-muted">Proposta encerrada ({pr.status}).</p>}
            </div>
          </Card>

          <Card title="Detalhes">
            <KeyVal k="Cliente" v={<Link href={partyHref(pr.party)} className="hover:text-brand-700">{partyName(db, pr.party)}</Link>} />
            <KeyVal k="Ramo" v={<LineBadge line={pr.line} />} />
            <KeyVal k="Validade" v={<span className={cn(open && validDays < 0 && "text-danger", open && validDays >= 0 && validDays <= 3 && "text-warn-strong")}>{date(pr.validUntil)}{open ? ` · ${validDays < 0 ? `venceu há ${-validDays}d` : `${validDays}d`}` : ""}</span>} />
            <KeyVal k="Opções" v={options.length} />
            {accepted && <KeyVal k="Opção escolhida" v={optionLabel(db, accepted)} />}
            {healthReq && <KeyVal k="Beneficiários" v={healthReq.beneficiaries.map((b) => `${firstName(b.name)} (${b.age})`).join(", ")} />}
            <KeyVal k="WhatsApp do cliente" v={phone ?? <span className="text-ink-faint">não cadastrado</span>} />
            {quote?.opportunityId && <KeyVal k="Oportunidade" v={<Link href={`/crm?id=${quote.opportunityId}`} className="text-brand-700 hover:underline">abrir no CRM</Link>} />}
          </Card>
        </div>
      </div>

      <Dialog open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Cliente aceitou a proposta" footer={<><Button variant="secondary" onClick={() => setAcceptOpen(false)}>Cancelar</Button><Button onClick={confirmAccept} disabled={!choice}>Confirmar aceite</Button></>}>
        <p className="mb-3 text-sm text-ink-muted">Qual opção o cliente escolheu? Uma tarefa de transmissão/emissão será criada para a operação.</p>
        <div className="space-y-2">
          {options.map((o) => (
            <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3", choice === o.id ? "border-brand-500 ring-2 ring-brand-100" : "border-line hover:border-brand-300")}>
              <input type="radio" name="opt" checked={choice === o.id} onChange={() => setChoice(o.id)} className="accent-brand-600" />
              <span className="flex-1 text-sm text-ink">{optionLabel(db, o)}{o.id === recommended?.id && <Badge tone="brand" className="ml-2">Recomendada</Badge>}</span>
              <span className="text-sm font-medium tabular-nums">{money0(o.annualPremium)}</span>
            </label>
          ))}
        </div>
      </Dialog>

      <Dialog open={refuseOpen} onClose={() => setRefuseOpen(false)} title="Cliente recusou a proposta" footer={<><Button variant="secondary" onClick={() => setRefuseOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmRefuse}>Marcar como recusada</Button></>}>
        <p className="text-sm text-ink-muted">A proposta {pr.code} será encerrada, os follow-ups pendentes serão concluídos e a oportunidade irá para &quot;Perdido&quot; no CRM.</p>
      </Dialog>

      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} title="Registrar emissão da apólice" footer={<><Button variant="secondary" onClick={() => setIssueOpen(false)}>Cancelar</Button><Button onClick={confirmIssue} disabled={!policyNumber.trim()} icon={<Icons.ShieldCheck className="h-4 w-4" />}>Registrar apólice</Button></>}>
        {(accepted ?? recommended) && (
          <div className="mb-4 rounded-lg bg-canvas p-3 text-sm">
            <div className="font-medium text-ink">{optionLabel(db, (accepted ?? recommended)!)}</div>
            <div className="text-xs text-ink-muted">{money0((accepted ?? recommended)!.annualPremium)}/ano · {partyName(db, pr.party)}</div>
          </div>
        )}
        <Field label="Número da apólice" hint="Sugestão gerada automaticamente — confira com o documento emitido pela seguradora.">
          <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className="font-mono" autoFocus />
        </Field>
        <ul className="mt-4 space-y-1 text-xs text-ink-muted">
          <li className="flex items-center gap-1.5"><Icons.Check className="h-3.5 w-3.5 text-ok" />Apólice criada com vigência de 12 meses e documento arquivado</li>
          <li className="flex items-center gap-1.5"><Icons.Check className="h-3.5 w-3.5 text-ok" />12 comissões previstas lançadas</li>
          <li className="flex items-center gap-1.5"><Icons.Check className="h-3.5 w-3.5 text-ok" />Renovação programada automaticamente</li>
        </ul>
      </Dialog>
    </div>
  );
}
