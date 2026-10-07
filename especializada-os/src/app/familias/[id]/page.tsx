"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/data/store";
import { addToHousehold } from "@/data/actions";
import { Avatar, Badge, Button, Card, DemoBadge, Dialog, Empty, Field, Icons, Input, LineBadge, LineIcon, LinkButton, PageHeader, Select, Table, Td, Th } from "@/components/ui";
import { DaysBadge } from "@/components/status";
import { assetLabel, assetsOf, companiesOf, householdPolicies, insurerName, partyName } from "@/domain/engines/queries";
import { crossSellFor } from "@/domain/engines/crosssell";
import { lineLabel } from "@/domain/products";
import { ageOn, daysBetween } from "@/lib/dates";
import { date, money0 } from "@/lib/format";
import type { HouseholdRelation } from "@/domain/types";

export default function Familia() {
  const { id } = useParams<{ id: string }>();
  const { db, today, visible, can } = useStore();
  const [add, setAdd] = useState(false);
  const hh = db.households.find((h) => h.id === id);
  if (!hh) return <Empty title="Família não encontrada" />;
  if (!hh.members.some((m) => visible({ type: "person", id: m.personId }))) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem acesso" />;
  const members = hh.members.map((m) => ({ ...m, person: db.persons.find((p) => p.id === m.personId)! }));
  const titular = members.find((m) => m.relation === "titular");
  const pols = householdPolicies(db, id);
  const active = pols.filter((p) => p.status === "vigente");
  const assets = members.flatMap((m) => assetsOf(db, { type: "person", id: m.personId }));
  const insured = new Set(db.policies.filter((p) => p.status === "vigente").map((p) => p.insuredAssetId));
  const companies = members.flatMap((m) => companiesOf(db, m.personId).map((c) => ({ ...c, member: m.person })));
  const ad = db.addresses.find((a) => a.id === hh.addressId);
  const opps = members.filter((m) => m.person.clientStatus).flatMap((m) => crossSellFor(db, { type: "person", id: m.personId }, today));
  const noHealth = members.filter((m) => !active.some((p) => p.line === "saude" && p.beneficiaryIds?.includes(m.personId)));
  const docs = db.documents.filter((d) => d.party?.type === "person" && members.some((m) => m.personId === d.party!.id));

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "Famílias", href: "/familias" }]} icon={<Icons.HeartHandshake className="h-5 w-5" />} title={<span className="flex items-center gap-2">{hh.name}<DemoBadge /></span>} subtitle={`${members.length} membros · ${ad ? `${ad.street}, ${ad.number} — ${ad.district}` : ""} · ${money0(active.reduce((s, p) => s + p.annualPremium, 0))}/ano em ${active.length} apólices`}
        actions={<>{can("clients.edit") && <Button variant="secondary" icon={<Icons.UserPlus className="h-4 w-4" />} onClick={() => setAdd(true)}>Adicionar membro</Button>}<LinkButton href={`/cotacoes/nova?ramo=saude&familia=${id}`} variant="primary" icon={<Icons.HeartPulse className="h-4 w-4" />}>Cotar saúde da família</LinkButton></>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {members.map((m) => {
          const mp = active.filter((p) => (p.holder.type === "person" && p.holder.id === m.personId) || p.beneficiaryIds?.includes(m.personId));
          return (
            <Link key={m.personId} href={`/clientes/${m.personId}`} className="rounded-xl border border-line bg-white p-4 shadow-card hover:border-brand-300">
              <div className="flex items-center gap-3"><Avatar name={m.person.name} /><div><div className="font-medium">{m.person.name}</div><div className="text-xs text-ink-muted">{m.relation} · {ageOn(m.person.birthDate, today)} anos</div></div></div>
              <div className="mt-3 flex flex-wrap gap-1">{mp.map((p) => <LineBadge key={p.id} line={p.line} />)}{!mp.length && <span className="text-xs text-ink-faint">sem seguros</span>}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Seguros da família" className="xl:col-span-2" padded={false}>
          <Table>
            <thead><tr><Th>Ramo</Th><Th>Seguradora / produto</Th><Th>Titular</Th><Th>Cobre</Th><Th>Vencimento</Th><Th className="text-right">Prêmio/ano</Th></tr></thead>
            <tbody>
              {active.sort((a, b) => a.end.localeCompare(b.end)).map((p) => (
                <tr key={p.id} className="hover:bg-canvas">
                  <Td><LineBadge line={p.line} /></Td>
                  <Td><Link href={`/apolices/${p.id}`} className="font-medium hover:text-brand-700">{insurerName(db, p.insurerId)}</Link><div className="text-xs text-ink-muted">{p.productName}</div></Td>
                  <Td className="text-sm">{partyName(db, p.holder)}</Td>
                  <Td className="text-xs text-ink-soft">{p.beneficiaryIds ? `${p.beneficiaryIds.length} beneficiários` : p.insuredAssetId ? assetLabel(db, db.assets.find((a) => a.id === p.insuredAssetId)) : p.capitalInsured ? `capital ${money0(p.capitalInsured)}` : "—"}</Td>
                  <Td><div className="flex items-center gap-2"><span className="text-xs">{date(p.end)}</span><DaysBadge days={daysBetween(today, p.end)} /></div></Td>
                  <Td className="text-right tabular-nums">{money0(p.annualPremium)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="space-y-4">
          <Card title="Oportunidades da família">
            {noHealth.length > 0 && noHealth.length < members.length && <p className="mb-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn-strong">{noHealth.map((m) => m.person.name.split(" ")[0]).join(", ")} sem plano de saúde na carteira.</p>}
            <div className="space-y-2">
              {opps.map((o, i) => <div key={i} className="flex items-start gap-2 text-sm"><LineIcon line={o.line} className="mt-0.5" /><div><div className="font-medium">{lineLabel(o.line)} <span className="font-normal text-ink-muted">· {partyName(db, o.party)}</span></div><div className="text-xs text-ink-muted">{o.reason}</div></div></div>)}
              {!opps.length && <p className="text-sm text-ink-muted">Nenhuma oportunidade relevante.</p>}
            </div>
          </Card>
          <Card title="Ativos">
            <div className="space-y-1.5">
              {assets.map((a) => <div key={a.id} className="flex items-center gap-2 text-sm">{a.type === "vehicle" ? <Icons.Car className="h-4 w-4 text-ink-muted" /> : a.type === "boat" ? <Icons.Sailboat className="h-4 w-4 text-ink-muted" /> : <Icons.Home className="h-4 w-4 text-ink-muted" />}<span className="flex-1 truncate">{assetLabel(db, a)}</span>{insured.has(a.id) ? <Badge tone="ok">segurado</Badge> : <Badge tone="warn">sem seguro</Badge>}</div>)}
              {!assets.length && <p className="text-sm text-ink-muted">Nenhum ativo cadastrado.</p>}
            </div>
          </Card>
          {companies.length > 0 && <Card title="Empresas ligadas">{companies.map((c) => <Link key={c.rel.id} href={`/empresas/${c.company.id}`} className="flex items-center gap-2 py-1 text-sm hover:text-brand-700"><Icons.Building2 className="h-4 w-4 text-ink-muted" /><span className="flex-1">{c.company.tradeName}</span><span className="text-2xs text-ink-muted">{c.member.name.split(" ")[0]} · {c.rel.role}</span></Link>)}</Card>}
          <Card title="Documentos" subtitle={`${docs.length} arquivos dos membros`}><Link href="/documentos" className="text-xs font-medium text-brand-700">Abrir central de documentos</Link></Card>
        </div>
      </div>
      {add && titular && <AddMemberDialog householdId={id} titularId={titular.personId} onClose={() => setAdd(false)} />}
    </div>
  );
}

function AddMemberDialog({ householdId, titularId, onClose }: { householdId: string; titularId: string; onClose: () => void }) {
  const { db, update, toast } = useStore();
  const titular = db.persons.find((p) => p.id === titularId)!;
  const surname = titular.name.split(" ").slice(-1)[0];
  const [f, setF] = useState({ name: ` ${surname}`, birth: "", relation: "filho(a)" as HouseholdRelation, cpf: "" });
  return (
    <Dialog open onClose={onClose} title="Adicionar membro à família" footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={f.name.trim().length < 3 || !f.birth} onClick={() => { update((d, u) => addToHousehold(d, u, householdId, titularId, { name: f.name.trim(), cpf: f.cpf, birthDate: f.birth, addressId: titular.addressId, clientStatus: null }, f.relation)); toast("Membro adicionado — endereço herdado da família"); onClose(); }}>Adicionar</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Nascimento"><Input type="date" value={f.birth} onChange={(e) => setF({ ...f, birth: e.target.value })} /></Field>
        <Field label="Parentesco"><Select value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value as HouseholdRelation })}><option value="cônjuge">Cônjuge</option><option value="filho(a)">Filho(a)</option><option value="pai/mãe">Pai/mãe</option><option value="outro">Outro</option></Select></Field>
        <Field label="CPF (opcional)"><Input value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} /></Field>
        <Field label="Endereço" known><Input disabled value={db.addresses.find((a) => a.id === titular.addressId)?.street ?? "—"} /></Field>
      </div>
    </Dialog>
  );
}
