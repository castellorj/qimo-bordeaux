"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { createOpportunity, logSensitiveView, updatePerson } from "@/data/actions";
import { Avatar, Badge, Button, Card, DemoBadge, Dialog, Empty, Field, Icons, Input, KeyVal, LineIcon, LinkButton, SourceChip, Tabs } from "@/components/ui";
import { DaysBadge, PolicyStatusBadge, ProposalStatusBadge, RenewalStatusBadge, StageBadge } from "@/components/status";
import { TaskRow } from "@/components/ops/TaskRow";
import { activePolicies, assetLabel, assetsOf, companiesOf, householdOf, insurerName, partyHref, partyName, policiesOfParty, sameParty, userName } from "@/domain/engines/queries";
import { crossSellFor } from "@/domain/engines/crosssell";
import { PERSON_CORE_LINES, PRODUCT, lineLabel } from "@/domain/products";
import { ageOn, daysBetween } from "@/lib/dates";
import { date, dateTime, hideCPF, maskCPF, money0, phone, relTime } from "@/lib/format";
import { waLink } from "@/integrations/whatsapp";
import { mailtoLink } from "@/integrations/email";
import { REIMB_LABEL } from "@/domain/engines/health";
import type { Policy } from "@/domain/types";
import { cn } from "@/lib/cn";

export default function Cliente360() {
  const { id } = useParams<{ id: string }>();
  const { db, today, visible, update, toast, can } = useStore();
  const person = db.persons.find((p) => p.id === id);
  const ref = useMemo(() => ({ type: "person" as const, id }), [id]);
  const [tab, setTab] = useState<"timeline" | "tarefas" | "comercial" | "documentos">("timeline");
  const [showCpf, setShowCpf] = useState(false);
  const [edit, setEdit] = useState(false);

  if (!person) return <Empty title="Cliente não encontrado" />;
  if (!visible(ref)) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso a este cliente">Este cliente pertence à carteira de outro corretor. Peça acesso ao gestor.</Empty>;

  const hh = householdOf(db, id);
  const titular = hh?.members.find((m) => m.relation === "titular");
  const companies = companiesOf(db, id);
  const assets = assetsOf(db, ref);
  const address = db.addresses.find((a) => a.id === person.addressId);
  const policies = policiesOfParty(db, ref);
  const active = activePolicies(policies);
  const insured = new Set(db.policies.filter((p) => p.status === "vigente").map((p) => p.insuredAssetId));
  const suggestions = crossSellFor(db, ref, today);
  const linesHave = new Set(active.map((p) => p.line));
  const tasks = db.tasks.filter((t) => sameParty(t.party, ref));
  const proposals = db.proposals.filter((p) => sameParty(p.party, ref));
  const quotes = db.quotes.filter((q) => sameParty(q.party, ref));
  const opps = db.opportunities.filter((o) => sameParty(o.party, ref));
  const renewals = db.renewals.filter((r) => policies.some((p) => p.id === r.policyId) && r.status !== "renovada");
  const docs = db.documents.filter((d) => sameParty(d.party, ref) || (d.policyId && policies.some((p) => p.id === d.policyId)));
  const timeline = [
    ...db.interactions.filter((i) => sameParty(i.party, ref)).map((i) => ({ at: i.at, icon: i.channel, text: i.summary, by: i.userId ? userName(db, i.userId) : i.channel === "sistema" ? "Sistema" : partyName(db, ref) })),
    ...db.audit.filter((a) => a.entityId === id).map((a) => ({ at: a.at, icon: "audit", text: a.summary, by: userName(db, a.userId) })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const age = person.birthDate ? ageOn(person.birthDate, today) : undefined;
  const isDependentOnly = !person.clientStatus;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-xs text-ink-muted"><Link href="/clientes" className="hover:text-ink">Clientes</Link><Icons.ChevronRight className="h-3 w-3" />Cliente 360º</div>
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <Avatar name={person.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{person.name}</h1>
            {person.clientStatus === "lead" && <Badge tone="warn">Lead</Badge>}
            {person.clientStatus === "ativo" && <Badge tone="ok">Cliente ativo</Badge>}
            {isDependentOnly && <Badge>Relacionado</Badge>}
            <DemoBadge />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            {age != null && <span>{age} anos</span>}
            {person.profession && <span>{person.profession}</span>}
            {address && <span className="flex items-center gap-1"><Icons.MapPin className="h-3.5 w-3.5" />{address.district}, {address.city}</span>}
            {person.ownerId && <span className="flex items-center gap-1"><Icons.UserCog className="h-3.5 w-3.5" />{userName(db, person.ownerId)}</span>}
            {person.clientSince && <span>cliente desde {date(person.clientSince)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {person.whatsapp && <LinkButton external href={waLink(person.whatsapp, `Olá, ${person.name.split(" ")[0]}! `)} icon={<Icons.MessageCircle className="h-4 w-4 text-ok" />}>WhatsApp</LinkButton>}
          {person.email && <LinkButton external href={mailtoLink(person.email, "Especializada Seguros", "")} icon={<Icons.Mail className="h-4 w-4" />}>E-mail</LinkButton>}
          <LinkButton href={`/cotacoes/nova?cliente=${id}`} variant="primary" icon={<Icons.Calculator className="h-4 w-4" />}>Nova cotação</LinkButton>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Coluna esquerda: dados e relações */}
        <div className="space-y-4">
          <Card title="Dados cadastrais" action={can("clients.edit") && <button onClick={() => setEdit(true)} className="text-xs font-medium text-brand-700">Editar</button>}>
            <KeyVal k="CPF" v={<span className="inline-flex items-center gap-1.5 font-mono text-xs">{showCpf ? maskCPF(person.cpf) : hideCPF(person.cpf)}<button title={showCpf ? "Ocultar" : "Mostrar (registrado na auditoria)"} onClick={() => { if (!showCpf) update((d, u) => logSensitiveView(d, u, "Person", id, "CPF completo")); setShowCpf(!showCpf); }} className="text-ink-faint hover:text-ink">{showCpf ? <Icons.EyeOff className="h-3.5 w-3.5" /> : <Icons.Eye className="h-3.5 w-3.5" />}</button></span>} />
            <KeyVal k="Nascimento" v={person.birthDate ? `${date(person.birthDate)} (${age} anos)` : "—"} />
            <KeyVal k="Telefone" v={phone(person.phone)} />
            <KeyVal k="WhatsApp" v={phone(person.whatsapp)} />
            <KeyVal k="E-mail" v={person.email ?? "—"} />
            <KeyVal k="Endereço" v={address ? `${address.street}, ${address.number}${address.complement ? ` – ${address.complement}` : ""}` : "—"} />
            <KeyVal k="Bairro / CEP" v={address ? `${address.district} · ${address.cep}` : "—"} />
            <KeyVal k="Profissão" v={person.profession ?? "—"} />
            <KeyVal k="Origem" v={person.source ?? "—"} />
            <p className="mt-2 flex items-start gap-1.5 text-2xs text-ink-muted"><Icons.Recycle className="mt-px h-3 w-3 shrink-0" />Estes dados são reaproveitados em todas as cotações, propostas e renovações — nunca são pedidos de novo.</p>
          </Card>

          <Card title="Mapa de relações" subtitle="Pessoa ↔ família ↔ empresas ↔ ativos ↔ seguros">
            <div className="space-y-0.5 text-sm">
              <div className="flex items-center gap-2 font-semibold"><Icons.User className="h-4 w-4 text-brand-600" />{person.name}</div>
              {hh && (
                <TreeRow icon="HeartHandshake" href={`/familias/${hh.id}`} label={hh.name} sub={`${hh.members.length} membros${titular && titular.personId !== id ? ` · titular ${partyName(db, { type: "person", id: titular.personId })}` : ""}`} />
              )}
              {companies.map(({ rel, company }) => <TreeRow key={rel.id} icon="Building2" href={`/empresas/${company.id}`} label={company.tradeName} sub={`${rel.role}${rel.share ? ` · ${rel.share}%` : ""}`} />)}
              {assets.map((a) => <TreeRow key={a.id} icon={a.type === "vehicle" ? "Car" : a.type === "boat" ? "Sailboat" : "Home"} label={assetLabel(db, a)} sub={insured.has(a.id) ? "segurado" : "sem seguro"} warn={!insured.has(a.id)} />)}
              {active.map((p) => <TreeRow key={p.id} icon="ShieldCheck" href={`/apolices/${p.id}`} label={`Seguro ${lineLabel(p.line)}`} sub={`${insurerName(db, p.insurerId)}${p.holder.id !== id ? " · beneficiário" : ""}`} />)}
            </div>
          </Card>

          {hh && (
            <Card title={hh.name} action={<Link href={`/familias/${hh.id}`} className="text-xs font-medium text-brand-700">Visão da família</Link>}>
              <div className="space-y-1.5">
                {hh.members.map((m) => {
                  const p = db.persons.find((x) => x.id === m.personId)!;
                  return (
                    <Link key={m.personId} href={`/clientes/${p.id}`} className={cn("flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-line-soft", p.id === id && "bg-brand-50")}>
                      <Avatar name={p.name} size="sm" tone="neutral" />
                      <span className="flex-1 text-sm">{p.name}</span>
                      <span className="text-2xs text-ink-muted">{m.relation} · {ageOn(p.birthDate, today)} anos</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-4 xl:col-span-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Seguros ({active.length})</h2>
              {policies.length > active.length && <Link href={`/apolices?q=${encodeURIComponent(person.name)}`} className="text-xs text-ink-muted hover:text-ink">+ {policies.length - active.length} encerradas</Link>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((p) => <PolicyCard key={p.id} p={p} viewerId={id} />)}
              {!active.length && <Card className="sm:col-span-2"><Empty title="Nenhum seguro ativo">Inicie uma cotação — os dados do cliente já estão preenchidos.</Empty></Card>}
            </div>
          </div>

          <Card title="Cobertura da carteira & oportunidades" subtitle="Sugestões baseadas em dados reais do cliente — sem disparo automático">
            <div className="mb-3 flex flex-wrap gap-2">
              {PERSON_CORE_LINES.map((l) => (
                <span key={l} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs", linesHave.has(l) ? "border-emerald-200 bg-ok-soft text-ok-strong" : "border-line text-ink-muted")}>
                  {linesHave.has(l) ? <Icons.Check className="h-3.5 w-3.5" /> : <Icons.X className="h-3.5 w-3.5" />}{lineLabel(l)}
                </span>
              ))}
            </div>
            {suggestions.length ? (
              <div className="divide-y divide-line-soft rounded-lg border border-line">
                {suggestions.map((s) => (
                  <div key={s.line + s.reason} className="flex items-center gap-3 px-3 py-2.5">
                    <LineIcon line={s.line} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{lineLabel(s.line)} <Badge tone={s.strength === "alta" ? "ok" : "neutral"}>{s.strength === "alta" ? "sinal forte" : "sinal moderado"}</Badge></div>
                      <div className="text-xs text-ink-muted">{s.reason}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => { update((d, u) => createOpportunity(d, u, { title: `${lineLabel(s.line)} — ${person.name}`, party: ref, line: s.line, estimatedPremium: 0, origin: "cross-sell", ownerId: person.ownerId ?? u?.id ?? "u-ana" }).db); toast("Oportunidade criada no CRM"); }}>Criar oportunidade</Button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-muted">Nenhuma oportunidade relevante identificada agora.</p>}
          </Card>

          {(renewals.length > 0 || opps.some((o) => !["emitido", "perdido"].includes(o.stage))) && (
            <Card title="Em andamento">
              <div className="space-y-2">
                {renewals.map((r) => { const p = db.policies.find((x) => x.id === r.policyId)!; return (
                  <Link key={r.id} href={`/renovacoes?id=${r.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:border-brand-300">
                    <Icons.RefreshCw className="h-4 w-4 text-warn" /><span className="flex-1 text-sm">Renovação {lineLabel(p.line)} · {insurerName(db, p.insurerId)}</span><RenewalStatusBadge status={r.status} /><DaysBadge days={daysBetween(today, r.dueDate)} />
                  </Link>); })}
                {opps.filter((o) => !["emitido", "perdido"].includes(o.stage) && !o.renewalOfPolicyId).map((o) => (
                  <Link key={o.id} href={o.quoteId ? `/cotacoes/${o.quoteId}` : "/crm"} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:border-brand-300">
                    <LineIcon line={o.line} /><span className="flex-1 text-sm">{o.title}</span><StageBadge stage={o.stage} />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card padded={false}>
            <div className="px-4 pt-2"><Tabs value={tab} onChange={setTab} tabs={[{ value: "timeline", label: "Histórico", count: timeline.length }, { value: "tarefas", label: "Tarefas", count: tasks.filter((t) => t.status === "aberta").length }, { value: "comercial", label: "Cotações & propostas", count: quotes.length + proposals.length }, { value: "documentos", label: "Documentos", count: docs.length }]} /></div>
            {tab === "timeline" && (
              <ol className="relative px-4 py-3">
                {timeline.map((e, i) => (
                  <li key={i} className="flex gap-3 pb-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-muted">
                      {e.icon === "whatsapp" ? <Icons.MessageCircle className="h-3.5 w-3.5 text-ok" /> : e.icon === "email" ? <Icons.Mail className="h-3.5 w-3.5" /> : e.icon === "telefone" ? <Icons.Phone className="h-3.5 w-3.5" /> : e.icon === "reuniao" ? <Icons.Users className="h-3.5 w-3.5" /> : e.icon === "audit" ? <Icons.History className="h-3.5 w-3.5" /> : <Icons.Zap className="h-3.5 w-3.5 text-brand-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-ink">{e.text}</div>
                      <div className="text-2xs text-ink-muted" title={dateTime(e.at)}>{e.by} · {relTime(e.at)}</div>
                    </div>
                  </li>
                ))}
                {!timeline.length && <Empty title="Sem histórico ainda" />}
              </ol>
            )}
            {tab === "tarefas" && <div className="divide-y divide-line-soft">{tasks.sort((a, b) => a.status.localeCompare(b.status) || a.due.localeCompare(b.due)).map((t) => <TaskRow key={t.id} task={t} compact />)}{!tasks.length && <Empty title="Sem tarefas" />}</div>}
            {tab === "comercial" && (
              <div className="divide-y divide-line-soft">
                {quotes.map((q) => <Link key={q.id} href={`/cotacoes/${q.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas"><LineIcon line={q.line} /><span className="flex-1 text-sm">Cotação {lineLabel(q.line)} · {q.results.filter((r) => r.status === "ok").length} resultados</span><span className="text-xs text-ink-muted">{date(q.createdAt.slice(0, 10))}</span></Link>)}
                {proposals.map((p) => <Link key={p.id} href={`/propostas/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas"><Icons.FileText className="h-4 w-4 text-ink-muted" /><span className="flex-1 text-sm">Proposta {p.code} · {lineLabel(p.line)}</span><ProposalStatusBadge status={p.status} /></Link>)}
                {!quotes.length && !proposals.length && <Empty title="Nenhuma cotação ou proposta" />}
              </div>
            )}
            {tab === "documentos" && (
              <div className="divide-y divide-line-soft">
                {docs.map((d) => <div key={d.id} className="flex items-center gap-3 px-4 py-2.5"><Icons.FileText className="h-4 w-4 text-ink-muted" /><span className="flex-1 truncate text-sm">{d.name}</span><Badge>{d.kind.replace("_", " ")}</Badge><span className="text-xs text-ink-muted">{date(d.uploadedAt.slice(0, 10))}</span></div>)}
                <div className="px-4 py-3"><LinkButton size="sm" href="/documentos?upload=1" icon={<Icons.Upload className="h-3.5 w-3.5" />}>Enviar documento</LinkButton></div>
              </div>
            )}
          </Card>
        </div>
      </div>
      {edit && <EditDialog personId={id} onClose={() => setEdit(false)} />}
    </div>
  );
}

function TreeRow({ icon, label, sub, href, warn }: { icon: string; label: string; sub?: string; href?: string; warn?: boolean }) {
  const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[icon] ?? Icons.Circle;
  const body = (
    <div className="flex items-center gap-2 py-1 pl-2">
      <span className="text-ink-faint">└</span>
      <I className={cn("h-3.5 w-3.5", warn ? "text-warn" : "text-ink-muted")} />
      <span className={cn("truncate", href && "hover:text-brand-700")}>{label}</span>
      {sub && <span className={cn("truncate text-2xs", warn ? "text-warn-strong" : "text-ink-muted")}>· {sub}</span>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function PolicyCard({ p, viewerId }: { p: Policy; viewerId: string }) {
  const { db, today } = useStore();
  const days = daysBetween(today, p.end);
  const plan = db.healthPlans.find((h) => h.id === p.healthPlanId);
  const asset = db.assets.find((a) => a.id === p.insuredAssetId);
  const ad = asset?.type === "property" ? db.addresses.find((a) => a.id === asset.addressId) : undefined;
  return (
    <Link href={`/apolices/${p.id}`} className="group rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-pop">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider" style={{ color: PRODUCT[p.line].color }}><LineIcon line={p.line} />{lineLabel(p.line)}</div>
        <DaysBadge days={days} />
      </div>
      <div className="mt-2 text-base font-semibold text-ink">{insurerName(db, p.insurerId)}</div>
      <div className="text-sm text-ink-soft">{p.productName}</div>
      <div className="mt-2 space-y-0.5 text-xs text-ink-muted">
        {p.line === "saude" && p.beneficiaryIds && <div>{p.beneficiaryIds.length} beneficiário(s) · {money0(p.annualPremium / 12)}/mês{plan && ` · reembolso ${REIMB_LABEL[plan.reimbursement].toLowerCase()}`}</div>}
        {asset && <div>{asset.type === "property" && ad ? `${ad.district}/${ad.state}` : assetLabel(db, asset)}</div>}
        {p.capitalInsured && <div>Capital segurado {money0(p.capitalInsured)}</div>}
        <div>Apólice {p.number} · vence {date(p.end)}</div>
        {p.holder.id !== viewerId && <div className="text-brand-700">Titular: {partyName(db, p.holder)}</div>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <PolicyStatusBadge status={p.status} />
        <SourceChip source={p.dataSource.kind === "demo" ? "DEMO" : p.dataSource.kind} at={p.dataSource.at} />
      </div>
    </Link>
  );
}

function EditDialog({ personId, onClose }: { personId: string; onClose: () => void }) {
  const { db, update, toast } = useStore();
  const p = db.persons.find((x) => x.id === personId)!;
  const [f, setF] = useState({ phone: p.phone ?? "", whatsapp: p.whatsapp ?? "", email: p.email ?? "", profession: p.profession ?? "" });
  return (
    <Dialog open onClose={onClose} title="Editar dados" footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={() => { update((d, u) => updatePerson(d, u, personId, { phone: f.phone || undefined, whatsapp: f.whatsapp || undefined, email: f.email || undefined, profession: f.profession || undefined })); toast("Dados atualizados — alteração registrada na auditoria"); onClose(); }}>Salvar</Button></>}>
      <div className="grid gap-3">
        <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
        <Field label="E-mail"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Profissão"><Input value={f.profession} onChange={(e) => setF({ ...f, profession: e.target.value })} /></Field>
        <p className="text-2xs text-ink-muted">Toda alteração guarda o valor anterior, o responsável e o horário (auditoria). Nada é sobrescrito silenciosamente.</p>
      </div>
    </Dialog>
  );
}
