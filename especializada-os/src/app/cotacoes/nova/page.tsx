"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { saveQuote, uid } from "@/data/actions";
import { Badge, Button, Card, Field, Icons, Input, LineIcon, PageHeader, Segmented, Select, Toggle } from "@/components/ui";
import { PRODUCT, PRODUCTS, lineLabel } from "@/domain/products";
import type { AutoQuoteRequest, GenericQuoteRequest, HealthQuoteRequest, PartyRef, ProductLine, QuoteResult, Vehicle, Accommodation, Coverage, ReimbursementLevel } from "@/domain/types";
import { ageOn } from "@/lib/dates";
import { householdOf, partyName, peopleOf, sameParty } from "@/domain/engines/queries";
import { adaptersFor, manualPlaceholders } from "@/integrations/insurers/registry";
import { recommend, COVERAGE_LABEL, REIMB_LABEL } from "@/domain/engines/health";
import { demoGeocoder } from "@/integrations/maps";
import { money0 } from "@/lib/format";
import { cn } from "@/lib/cn";
import { norm } from "@/lib/text";

const MAIN: ProductLine[] = ["saude", "auto", "vida", "residencial", "empresarial", "viagem"];

function NovaCotacao() {
  const params = useSearchParams();
  const { db, visible } = useStore();
  const pre = params.get("cliente") ? { type: "person" as const, id: params.get("cliente")! } : params.get("empresa") ? { type: "company" as const, id: params.get("empresa")! } : undefined;
  const fam = params.get("familia") ? db.households.find((h) => h.id === params.get("familia")) : undefined;
  const famTitular = fam?.members.find((m) => m.relation === "titular")?.personId;
  const [line, setLine] = useState<ProductLine | null>((params.get("ramo") as ProductLine) || null);
  const [party, setParty] = useState<PartyRef | undefined>(pre ?? (famTitular ? { type: "person", id: famTitular } : undefined));
  const [showAll, setShowAll] = useState(false);
  const renewalOf = params.get("renovacao") ?? undefined;

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "Cotações", href: "/cotacoes" }]} icon={<Icons.Calculator className="h-5 w-5" />} title="Nova cotação" subtitle="Quote Engine — cada ramo tem o seu fluxo, regras e integrações. Os dados que já conhecemos são reaproveitados." />
      <Card className="mb-4" title="1. Cliente">
        <PartyPicker value={party} onChange={setParty} visible={visible} />
      </Card>
      <Card className="mb-4" title="2. Qual produto?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {(showAll ? PRODUCTS.map((p) => p.line) : MAIN).map((l) => (
            <button key={l} onClick={() => setLine(l)} className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition", line === l ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-300")}>
              <LineIcon line={l} className="h-6 w-6" />
              {lineLabel(l)}
              {PRODUCT[l].depth === "completo" && <span className="text-2xs font-normal text-ok-strong">fluxo dedicado</span>}
            </button>
          ))}
          {!showAll && <button onClick={() => setShowAll(true)} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line p-3 text-sm text-ink-muted hover:border-brand-300"><Icons.MoreHorizontal className="h-6 w-6" />Outros ramos</button>}
        </div>
      </Card>
      {line && party && (line === "saude" ? <HealthFlow party={party} householdId={fam?.id} renewalOf={renewalOf} /> : line === "auto" ? <AutoFlow party={party} renewalOf={renewalOf} /> : <GenericFlow party={party} line={line} renewalOf={renewalOf} />)}
      {line && !party && <p className="text-sm text-ink-muted">Selecione o cliente para continuar.</p>}
    </div>
  );
}

function PartyPicker({ value, onChange, visible }: { value?: PartyRef; onChange: (p?: PartyRef) => void; visible: (r: PartyRef) => boolean }) {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const options = useMemo(() => [
    ...db.persons.filter((p) => p.clientStatus).map((p) => ({ ref: { type: "person" as const, id: p.id }, label: p.name, sub: p.clientStatus === "lead" ? "Lead" : p.profession ?? "" })),
    ...db.companies.map((c) => ({ ref: { type: "company" as const, id: c.id }, label: c.tradeName, sub: "Empresa" })),
  ].filter((o) => visible(o.ref) && (!q || norm(o.label).includes(norm(q)))), [db, q, visible]);
  if (value) {
    const p = value.type === "person" ? db.persons.find((x) => x.id === value.id) : undefined;
    const ad = db.addresses.find((a) => a.id === (p?.addressId ?? db.companies.find((c) => c.id === value.id)?.addressId));
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm"><Icons.UserCheck className="h-4 w-4 text-brand-600" /><b className="font-medium">{partyName(db, value)}</b></div>
        <div className="flex flex-wrap gap-1.5 text-2xs">
          {p?.cpf && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />CPF</Badge>}
          {p?.birthDate && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />Nascimento</Badge>}
          {ad && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />Endereço {ad.district}</Badge>}
          {(p?.whatsapp || p?.email) && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />Contato</Badge>}
          {value.type === "person" && householdOf(db, value.id) && <Badge tone="ok"><Icons.Check className="h-2.5 w-2.5" />Família</Badge>}
        </div>
        <span className="text-xs text-ink-muted">Dados já cadastrados — não serão pedidos de novo.</span>
        <button onClick={() => onChange(undefined)} className="ml-auto text-xs font-medium text-brand-700">Trocar</button>
      </div>
    );
  }
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente ou empresa…" className="mb-2 max-w-md" autoFocus />
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {options.slice(0, 30).map((o) => <button key={o.ref.id} onClick={() => onChange(o.ref)} className="rounded-lg border border-line px-2.5 py-1 text-sm hover:border-brand-300 hover:bg-brand-50">{o.label} <span className="text-2xs text-ink-muted">{o.sub}</span></button>)}
      </div>
    </div>
  );
}

// ───────────────────────────── SAÚDE ─────────────────────────────
function HealthFlow({ party, householdId, renewalOf }: { party: PartyRef; householdId?: string; renewalOf?: string }) {
  const { db, today, update, toast } = useStore();
  const router = useRouter();
  const isCompany = party.type === "company";
  const person = party.type === "person" ? db.persons.find((p) => p.id === party.id) : undefined;
  const hh = householdId ? db.households.find((h) => h.id === householdId) : person ? householdOf(db, person.id) : undefined;
  const company = isCompany ? db.companies.find((c) => c.id === party.id) : undefined;
  const addr = db.addresses.find((a) => a.id === (person?.addressId ?? hh?.addressId ?? company?.addressId));
  const initialBen = hh ? hh.members.map((m) => { const p = db.persons.find((x) => x.id === m.personId)!; return { personId: p.id, name: p.name, age: ageOn(p.birthDate, today), on: true }; }) : person ? [{ personId: person.id, name: person.name, age: ageOn(person.birthDate, today), on: true }] : isCompany ? peopleOf(db, party.id).map(({ person: p }) => ({ personId: p.id, name: p.name, age: ageOn(p.birthDate, today), on: true })) : [];
  const [ben, setBen] = useState(initialBen);
  const [loc, setLoc] = useState(addr ? { lat: addr.lat, lng: addr.lng, label: `${addr.street}, ${addr.number} — ${addr.district}`, known: true } : { lat: -22.9068, lng: -43.1729, label: "", known: false });
  const [addrQuery, setAddrQuery] = useState("");
  const [desired, setDesired] = useState<string[]>([]);
  const [provQ, setProvQ] = useState("");
  const [budget, setBudget] = useState("");
  const [acc, setAcc] = useState<Accommodation | "">("apartamento");
  const [copart, setCopart] = useState<"sim" | "nao" | "indiferente">("indiferente");
  const [reimb, setReimb] = useState<ReimbursementLevel | "">("");
  const [cov, setCov] = useState<Coverage | "">("");
  const [segment] = useState(isCompany ? "pme" : "individual");
  const [newBen, setNewBen] = useState({ name: "", age: "" });

  const req: HealthQuoteRequest = {
    line: "saude", segment: segment as HealthQuoteRequest["segment"], city: addr?.city ?? "Rio de Janeiro", addressId: loc.known ? addr?.id : undefined, lat: loc.lat, lng: loc.lng,
    beneficiaries: ben.filter((b) => b.on).map(({ personId, name, age }) => ({ personId, name, age })), desiredProviderIds: desired,
    budgetMonthly: Number(budget) || undefined, accommodation: acc || undefined, coparticipation: copart, reimbursement: reimb || undefined, coverage: cov || undefined,
  };
  const rec = useMemo(() => (req.beneficiaries.length ? recommend(db, req) : null), [db, JSON.stringify(req)]); // eslint-disable-line react-hooks/exhaustive-deps
  const provOptions = db.providers.filter((p) => !desired.includes(p.id) && provQ.length >= 2 && (norm(p.name).includes(norm(provQ)) || p.aliases.some((a) => norm(a).includes(norm(provQ))) || p.specialties.some((s) => norm(s).includes(norm(provQ)))));

  function calc() {
    if (!rec) return;
    const at = new Date().toISOString();
    const results: QuoteResult[] = rec.evaluations.map((e) => ({
      id: uid("qr"), insurerId: e.plan.insurerId, productName: e.plan.name, annualPremium: Math.round(e.monthly * 12 * 100) / 100, monthlyPremium: e.monthly, coverages: [], assistance: [], commissionPct: 0.04, healthPlanId: e.plan.id,
      status: e.meetsHard ? "ok" : "recusado", message: e.meetsHard ? undefined : `Não atende: ${e.hardFailures.join(", ")}`, source: { adapter: "tabela-operadora", method: "importacao", receivedAt: at, reference: e.plan.networkSourceId },
    }));
    const opp = renewalOf ? db.opportunities.find((o) => o.renewalOfPolicyId === renewalOf)?.id : undefined;
    let id = "";
    update((d, u) => { const r = saveQuote(d, u, { party, line: "saude", status: "calculado", request: req, results, opportunityId: opp }); id = r.id; return r.db; });
    toast("Cotação calculada e vinculada ao CRM");
    setTimeout(() => router.push(`/cotacoes/${id}`), 50);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card title="3. Beneficiários e idades" subtitle={hh ? `Carregados da ${hh.name} — idades calculadas pela data de nascimento` : "Adicione os beneficiários"}>
          <div className="space-y-1.5">
            {ben.map((b, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <input type="checkbox" checked={b.on} onChange={(e) => setBen(ben.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} />
                <span className="flex-1 text-sm">{b.name}</span>
                <span className="text-sm tabular-nums text-ink-soft">{b.age} anos</span>
                {b.personId && <Badge tone="ok">já cadastrado</Badge>}
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <Input placeholder="Novo beneficiário" value={newBen.name} onChange={(e) => setNewBen({ ...newBen, name: e.target.value })} />
              <Input placeholder="Idade" type="number" className="w-24" value={newBen.age} onChange={(e) => setNewBen({ ...newBen, age: e.target.value })} />
              <Button variant="secondary" disabled={!newBen.name || newBen.age === ""} onClick={() => { setBen([...ben, { personId: undefined as unknown as string, name: newBen.name, age: Number(newBen.age), on: true }]); setNewBen({ name: "", age: "" }); }}>Adicionar</Button>
            </div>
          </div>
        </Card>
        <Card title="4. Localização" subtitle="Usada para medir a distância da rede credenciada">
          {loc.known && addr ? (
            <div className="flex items-center gap-2 text-sm"><Icons.MapPin className="h-4 w-4 text-brand-600" />{loc.label}<Badge tone="ok">endereço cadastrado</Badge><span className="text-xs text-ink-muted">Os dados continuam os mesmos?</span><button onClick={() => setLoc({ ...loc, known: false })} className="text-xs font-medium text-brand-700">Mudou</button></div>
          ) : (
            <div className="flex gap-2"><Input placeholder="CEP ou bairro (ex.: 22270-010, Botafogo)" value={addrQuery} onChange={(e) => setAddrQuery(e.target.value)} /><Button variant="secondary" onClick={async () => { const g = await demoGeocoder.geocode(addrQuery); if (g) setLoc({ lat: g.lat, lng: g.lng, label: g.label, known: false }); else toast("Endereço não encontrado no geocoder DEMO", "warn"); }}>Localizar</Button>{loc.label && <span className="self-center text-xs text-ink-muted">{loc.label}</span>}</div>
          )}
        </Card>
        <Card title="5. Hospitais, médicos e prestadores importantes" subtitle="A recomendação prioriza planos que atendem estes prestadores">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {desired.map((id) => { const p = db.providers.find((x) => x.id === id)!; return <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-sm text-brand-800">{p.name}<button onClick={() => setDesired(desired.filter((x) => x !== id))}><Icons.X className="h-3.5 w-3.5" /></button></span>; })}
          </div>
          <Input placeholder="Buscar hospital, laboratório, clínica ou especialidade…" value={provQ} onChange={(e) => setProvQ(e.target.value)} />
          {provOptions.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1.5">{provOptions.slice(0, 8).map((p) => <button key={p.id} onClick={() => { setDesired([...desired, p.id]); setProvQ(""); }} className="rounded-lg border border-line px-2 py-1 text-xs hover:border-brand-300">{p.name} <span className="text-ink-muted">· {p.district}</span></button>)}</div>}
        </Card>
        <Card title="6. Orçamento e preferências">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Orçamento mensal (R$)"><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="opcional" /></Field>
            <Field label="Acomodação"><Select value={acc} onChange={(e) => setAcc(e.target.value as Accommodation | "")}><option value="">Indiferente</option><option value="apartamento">Apartamento</option><option value="enfermaria">Enfermaria</option></Select></Field>
            <Field label="Coparticipação"><Segmented size="sm" value={copart} onChange={setCopart} options={[{ value: "indiferente", label: "Tanto faz" }, { value: "nao", label: "Sem" }, { value: "sim", label: "Aceita" }]} /></Field>
            <Field label="Reembolso mínimo"><Select value={reimb} onChange={(e) => setReimb(e.target.value as ReimbursementLevel | "")}><option value="">Não exige</option>{(["basico", "intermediario", "alto", "premium"] as const).map((r) => <option key={r} value={r}>{REIMB_LABEL[r]}</option>)}</Select></Field>
            <Field label="Abrangência mínima"><Select value={cov} onChange={(e) => setCov(e.target.value as Coverage | "")}><option value="">Indiferente</option>{(["regional", "estadual", "nacional"] as const).map((c) => <option key={c} value={c}>{COVERAGE_LABEL[c]}</option>)}</Select></Field>
            <Field label="Segmento"><Input disabled value={segment === "pme" ? "PME / empresarial" : "Individual / familiar / adesão"} /></Field>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Prévia da recomendação" subtitle="Atualiza em tempo real · cálculo determinístico pelas tabelas por faixa ANS">
          {rec ? (
            <div className="space-y-2.5">
              {rec.picks.map((p) => { const e = rec.evaluations.find((x) => x.plan.id === p.planId)!; return (
                <div key={p.key} className="rounded-lg border border-line p-3">
                  <div className="text-2xs font-semibold uppercase tracking-wide text-brand-700">{p.label}</div>
                  <div className="mt-0.5 flex items-baseline justify-between"><span className="font-medium">{e.plan.name}</span><span className="text-sm tabular-nums">{money0(e.monthly)}<span className="text-2xs text-ink-muted">/mês</span></span></div>
                  <div className="mt-1 text-2xs text-ink-muted">{p.reasons[0]}</div>
                </div>); })}
              <div className="text-2xs text-ink-muted">{rec.evaluations.filter((e) => e.meetsHard).length} de {rec.evaluations.length} planos atendem aos critérios obrigatórios.</div>
            </div>
          ) : <p className="text-sm text-ink-muted">Selecione ao menos um beneficiário.</p>}
          <Button className="mt-4 w-full" disabled={!rec} onClick={calc} icon={<Icons.Sparkles className="h-4 w-4" />}>Calcular e comparar planos</Button>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────── AUTO ─────────────────────────────
function AutoFlow({ party, renewalOf }: { party: PartyRef; renewalOf?: string }) {
  const { db, today, update, toast } = useStore();
  const router = useRouter();
  const prevPolicy = renewalOf ? db.policies.find((p) => p.id === renewalOf) : undefined;
  const vehicles = db.assets.filter((a) => a.type === "vehicle" && (sameParty(a.owner, party) || (party.type === "person" && householdOf(db, party.id)?.members.some((m) => m.personId === a.owner.id)))) as Vehicle[];
  const [vehicleId, setVehicleId] = useState(prevPolicy?.insuredAssetId ?? vehicles[0]?.id ?? "");
  const v = vehicles.find((x) => x.id === vehicleId);
  const driver = db.persons.find((p) => p.id === (v?.mainDriverId ?? party.id));
  const prevQuote = db.quotes.filter((q) => q.line === "auto" && (q.request as AutoQuoteRequest).vehicleId === vehicleId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const prevReq = prevQuote?.request as AutoQuoteRequest | undefined;
  const [driverAge, setDriverAge] = useState(driver ? ageOn(driver.birthDate, today) : 35);
  const [bonus, setBonus] = useState(prevReq?.bonusClass ?? (prevPolicy ? 1 : 0));
  const [young, setYoung] = useState(false);
  const [usage, setUsage] = useState<Vehicle["usage"]>(v?.usage ?? "particular");
  const [garageHome, setGarageHome] = useState(v?.garage.home ?? true);
  const [garageWork, setGarageWork] = useState(v?.garage.work ?? false);
  const [casco, setCasco] = useState<AutoQuoteRequest["coverages"]["casco"]>("100%");
  const [rcfDm, setRcfDm] = useState(200000);
  const [rcfDc, setRcfDc] = useState(300000);
  const [app, setApp] = useState(20000);
  const [vidros, setVidros] = useState(true);
  const [reserva, setReserva] = useState<0 | 7 | 15 | 30>(15);
  const [ded, setDed] = useState<AutoQuoteRequest["deductible"]>("normal");
  const [running, setRunning] = useState<{ insurerId: string; status: "pending" | "done" | "error"; result?: QuoteResult }[] | null>(null);
  const [newV, setNewV] = useState({ make: "", model: "", year: "", plate: "", fipe: "" });

  async function run() {
    if (!v) return;
    const req: AutoQuoteRequest = { line: "auto", vehicleId: v.id, mainDriverId: driver?.id, driverAge, overnightCep: v.overnightCep, usage, garage: { home: garageHome, work: garageWork }, bonusClass: bonus, youngDriver: young, deductible: ded, coverages: { casco, rcfDanosMateriais: rcfDm, rcfDanosCorporais: rcfDc, app, vidros, carroReserva: reserva } };
    const adapters = adaptersFor("auto");
    setRunning(adapters.map((a) => ({ insurerId: a.insurerId, status: "pending" })));
    const results = await Promise.all(adapters.map(async (a) => {
      try {
        const r = await a.quoteAuto!(req, { vehicle: { ...v, usage } });
        setRunning((cur) => cur?.map((x) => (x.insurerId === a.insurerId ? { ...x, status: "done", result: r } : x)) ?? null);
        return r;
      } catch {
        setRunning((cur) => cur?.map((x) => (x.insurerId === a.insurerId ? { ...x, status: "error" } : x)) ?? null);
        return { id: uid("qr"), insurerId: a.insurerId, productName: "Auto", annualPremium: 0, coverages: [], assistance: [], commissionPct: 0, status: "erro" as const, message: "Falha na integração", source: { adapter: a.adapterName, method: a.method, receivedAt: new Date().toISOString() } };
      }
    }));
    results.push(...manualPlaceholders(db.insurers, "auto"));
    const opp = renewalOf ? db.opportunities.find((o) => o.renewalOfPolicyId === renewalOf)?.id : undefined;
    let id = "";
    update((d, u) => { const r = saveQuote(d, u, { party, line: "auto", status: "calculado", request: req, results, opportunityId: opp }); id = r.id; return r.db; });
    toast(`Multicálculo concluído: ${results.filter((r) => r.status === "ok").length} cotações`);
    setTimeout(() => router.push(`/cotacoes/${id}`), 600);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card title="3. Veículo" subtitle={prevPolicy ? `Renovação da apólice ${prevPolicy.number} — dados anteriores recuperados` : "Veículos já cadastrados do cliente e da família"}>
          {vehicles.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {vehicles.map((x) => (
                <button key={x.id} onClick={() => setVehicleId(x.id)} className={cn("rounded-lg border p-3 text-left", vehicleId === x.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-brand-300")}>
                  <div className="font-medium">{x.make} {x.model} {x.yearModel}</div>
                  <div className="text-xs text-ink-muted">{x.version} · placa {x.plate}</div>
                  <div className="mt-1 text-xs">FIPE {x.fipeCode} · <b>{money0(x.fipeValue)}</b></div>
                  <div className="mt-1 text-2xs text-ink-muted">Pernoite CEP {x.overnightCep} · {partyName(db, x.owner)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm text-ink-muted">Nenhum veículo cadastrado. Informe os dados (na produção: busca por placa + FIPE via provedor autorizado).</p>
              <div className="grid gap-2 sm:grid-cols-5">
                <Input placeholder="Marca" value={newV.make} onChange={(e) => setNewV({ ...newV, make: e.target.value })} />
                <Input placeholder="Modelo" value={newV.model} onChange={(e) => setNewV({ ...newV, model: e.target.value })} />
                <Input placeholder="Ano" value={newV.year} onChange={(e) => setNewV({ ...newV, year: e.target.value })} />
                <Input placeholder="Placa" value={newV.plate} onChange={(e) => setNewV({ ...newV, plate: e.target.value.toUpperCase() })} />
                <Input placeholder="Valor FIPE" type="number" value={newV.fipe} onChange={(e) => setNewV({ ...newV, fipe: e.target.value })} />
              </div>
              <Button className="mt-2" variant="secondary" disabled={!newV.make || !newV.model || !newV.plate || !newV.fipe} onClick={() => {
                const id = uid("v");
                const ownerAddr = db.addresses.find((a) => a.id === (party.type === "person" ? db.persons.find((p) => p.id === party.id)?.addressId : db.companies.find((c) => c.id === party.id)?.addressId));
                update((d) => ({ ...d, assets: [...d.assets, { id, owner: party, type: "vehicle", make: newV.make, model: newV.model, version: "", yearModel: Number(newV.year) || new Date().getFullYear(), plate: newV.plate, fipeCode: "—", fipeValue: Number(newV.fipe), usage: "particular", garage: { home: true, work: false }, overnightCep: ownerAddr?.cep ?? "20000-000", mainDriverId: party.type === "person" ? party.id : undefined, demo: true }] }));
                setVehicleId(id);
                toast("Veículo cadastrado no cliente — será reaproveitado na renovação");
              }}>Cadastrar veículo</Button>
            </div>
          )}
        </Card>
        {v && <>
          <Card title="4. Perfil e condutores" subtitle={prevReq ? "Respostas da última cotação reaproveitadas — confirme se continuam iguais" : undefined}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Condutor principal" known={!!driver}><Input disabled value={driver?.name ?? "—"} /></Field>
              <Field label="Idade do condutor" known={!!driver}><Input type="number" value={driverAge} onChange={(e) => setDriverAge(Number(e.target.value))} /></Field>
              <Field label="Classe de bônus (0–10)" known={!!prevReq}><Input type="number" min={0} max={10} value={bonus} onChange={(e) => setBonus(Number(e.target.value))} /></Field>
              <Field label="Uso"><Select value={usage} onChange={(e) => setUsage(e.target.value as Vehicle["usage"])}><option value="particular">Particular</option><option value="comercial">Comercial</option><option value="aplicativo">Aplicativo</option></Select></Field>
              <Field label="CEP de pernoite" known><Input disabled value={v.overnightCep} /></Field>
              <div className="space-y-2 pt-5"><Toggle checked={garageHome} onChange={setGarageHome} label="Garagem em casa" /><Toggle checked={garageWork} onChange={setGarageWork} label="Garagem no trabalho" /></div>
              <div className="sm:col-span-3"><Toggle checked={young} onChange={setYoung} label="Condutor entre 18 e 25 anos dirige o veículo" /></div>
            </div>
          </Card>
          <Card title="5. Coberturas">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Casco"><Segmented size="sm" value={casco} onChange={setCasco} options={[{ value: "100%", label: "100% FIPE" }, { value: "110%", label: "110%" }, { value: "sem", label: "Sem casco" }]} /></Field>
              <Field label="Franquia"><Segmented size="sm" value={ded} onChange={setDed} options={[{ value: "reduzida", label: "Reduzida" }, { value: "normal", label: "Normal" }, { value: "majorada", label: "Majorada" }]} /></Field>
              <Field label="Carro reserva"><Select value={reserva} onChange={(e) => setReserva(Number(e.target.value) as 0 | 7 | 15 | 30)}><option value={0}>Não</option><option value={7}>7 dias</option><option value={15}>15 dias</option><option value={30}>30 dias</option></Select></Field>
              <Field label="RCF danos materiais"><Select value={rcfDm} onChange={(e) => setRcfDm(Number(e.target.value))}>{[100000, 200000, 300000, 500000].map((x) => <option key={x} value={x}>{money0(x)}</option>)}</Select></Field>
              <Field label="RCF danos corporais"><Select value={rcfDc} onChange={(e) => setRcfDc(Number(e.target.value))}>{[100000, 200000, 300000, 500000].map((x) => <option key={x} value={x}>{money0(x)}</option>)}</Select></Field>
              <Field label="APP por passageiro"><Select value={app} onChange={(e) => setApp(Number(e.target.value))}>{[0, 10000, 20000, 50000].map((x) => <option key={x} value={x}>{x ? money0(x) : "Sem APP"}</option>)}</Select></Field>
              <div className="pt-1"><Toggle checked={vidros} onChange={setVidros} label="Vidros, faróis e retrovisores" /></div>
            </div>
          </Card>
        </>}
      </div>
      <div className="space-y-4">
        <Card title="Multicálculo" subtitle="Preenche uma vez e consulta todas as seguradoras via adapters">
          {!running ? (
            <>
              <div className="space-y-1.5">
                {adaptersFor("auto").map((a) => { const ins = db.insurers.find((i) => i.id === a.insurerId)!; return (
                  <div key={a.insurerId} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full" style={{ background: ins.color }} /><span className="flex-1">{ins.name}</span><Badge tone={a.automatic ? "brand" : "neutral"}>{a.automatic ? "automático (DEMO)" : "manual"}</Badge></div>); })}
              </div>
              {manualPlaceholders(db.insurers, "auto").length > 0 && <div className="mt-2 text-xs text-ink-muted">+ {manualPlaceholders(db.insurers, "auto").length} seguradoras do catálogo entram como cotação manual ({db.insurers.filter((i) => i.lines.includes("auto") && !adaptersFor("auto").some((a) => a.insurerId === i.id)).map((i) => i.short).join(", ")})</div>}
              <p className="mt-3 text-2xs text-ink-muted">DEMO: valores simulados (não são tarifas reais). Integração própria: cada seguradora terá seu adapter; enquanto não estiver pronta, entra como cotação manual. Meios permitidos — API oficial ou liberada pela seguradora, integração autorizada, importação ou entrada manual. Nunca scraping.</p>
              <Button className="mt-4 w-full" disabled={!v} onClick={run} icon={<Icons.Zap className="h-4 w-4" />}>Calcular em {adaptersFor("auto").length} seguradoras</Button>
            </>
          ) : (
            <div className="space-y-2">
              {running.map((r) => { const ins = db.insurers.find((i) => i.id === r.insurerId)!; return (
                <div key={r.insurerId} className="flex items-center gap-2 text-sm">
                  {r.status === "pending" ? <Icons.Loader2 className="h-4 w-4 animate-spin text-brand-600" /> : r.result?.status === "ok" ? <Icons.CheckCircle2 className="h-4 w-4 text-ok" /> : <Icons.MinusCircle className="h-4 w-4 text-ink-faint" />}
                  <span className="flex-1">{ins.short}</span>
                  <span className="text-xs tabular-nums text-ink-soft">{r.result?.status === "ok" ? money0(r.result.annualPremium) : r.result?.status === "manual_pendente" ? "manual" : r.result?.status === "recusado" ? "recusou" : ""}</span>
                </div>); })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────── GENÉRICO ─────────────────────────────
function GenericFlow({ party, line, renewalOf }: { party: PartyRef; line: ProductLine; renewalOf?: string }) {
  const { db, update, toast } = useStore();
  const router = useRouter();
  const mod = PRODUCT[line];
  const prev = renewalOf ? db.policies.find((p) => p.id === renewalOf) : undefined;
  const [vals, setVals] = useState<Record<string, string | number | boolean>>(() => {
    const init: Record<string, string | number | boolean> = {};
    if (line === "vida" && prev?.capitalInsured) init.capital = prev.capitalInsured;
    if (line === "empresarial" && party.type === "company") init.atividade = db.companies.find((c) => c.id === party.id)?.sector ?? "";
    if (line === "residencial" && party.type === "person") { const prop = db.assets.find((a) => a.type === "property" && sameParty(a.owner, party)); if (prop && prop.type === "property") init.incendio = prop.value; }
    return init;
  });
  const [desc, setDesc] = useState(prev ? `Renovação ${prev.productName} (${prev.number})` : "");
  const [running, setRunning] = useState(false);
  const insuredValue = Number(Object.entries(vals).find(([k]) => mod.fields.find((f) => f.key === k)?.type === "money")?.[1] ?? 0) || undefined;
  async function run() {
    setRunning(true);
    const req: GenericQuoteRequest = { line: line as GenericQuoteRequest["line"], description: desc || `${mod.label} — ${partyName(db, party)}`, insuredValue, fields: vals };
    const adapters = adaptersFor(line);
    const results = [...(await Promise.all(adapters.map((a) => a.quoteGeneric!(req)))), ...manualPlaceholders(db.insurers, line)];
    const opp = renewalOf ? db.opportunities.find((o) => o.renewalOfPolicyId === renewalOf)?.id : undefined;
    let id = "";
    update((d, u) => { const r = saveQuote(d, u, { party, line, status: results.some((r) => r.status === "ok") ? "calculado" : "rascunho", request: req, results, opportunityId: opp }); id = r.id; return r.db; });
    toast(results.some((r) => r.status === "ok") ? `${results.filter((r) => r.status === "ok").length} cotações recebidas` : "Cotação salva — sem seguradora integrada para este ramo; registre resultados manualmente");
    setTimeout(() => router.push(`/cotacoes/${id}`), 50);
  }
  return (
    <Card title={`3. Dados do seguro ${mod.label}`} subtitle="Formulário do módulo (registro de produtos). Ramos sem fluxo dedicado usam campos parametrizados — o core funciona igual para todos.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Descrição da necessidade" className="sm:col-span-3"><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: proteção da sede, estoque e RC" /></Field>
        {mod.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "boolean" ? <div className="pt-1.5"><Toggle checked={!!vals[f.key]} onChange={(x) => setVals({ ...vals, [f.key]: x })} /></div>
              : f.type === "select" ? <Select value={String(vals[f.key] ?? "")} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}><option value="">Selecione</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</Select>
              : <Input type={f.type === "text" ? "text" : "number"} value={String(vals[f.key] ?? "")} onChange={(e) => setVals({ ...vals, [f.key]: f.type === "text" ? e.target.value : Number(e.target.value) })} />}
          </Field>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-ink-muted">{adaptersFor(line).length} seguradora(s) com cotação automática (simulada) para {mod.label}; as demais do catálogo entram como cotação manual.</span>
        <Button onClick={run} disabled={running} icon={running ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Zap className="h-4 w-4" />}>Cotar</Button>
      </div>
    </Card>
  );
}

export default function Page() {
  return <Suspense><NovaCotacao /></Suspense>;
}
