"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { tooLarge, UPLOAD_LIMITS } from "@/lib/security";
import { Badge, Button, Card, Empty, Field, Icons, Input, PageHeader, Segmented, Select, SourceChip, Table, Tabs, Td, Th } from "@/components/ui";
import type { MapPoint } from "@/components/map/MapView";
import { TYPE_COLOR, TYPE_LABEL } from "@/components/map/MapView";
import { distanceKm, fmtKm } from "@/lib/geo";
import { demoGeocoder } from "@/integrations/maps";
import { insurerName } from "@/domain/engines/queries";
import { COVERAGE_LABEL, REIMB_LABEL, SERVICE_LABEL, networkSource, planProviders, plansForProvider, whatChanges } from "@/domain/engines/health";
import { norm, providerSimilarity } from "@/lib/text";
import { date } from "@/lib/format";
import { parseNetworkCsv } from "@/integrations/health-networks";
import { applyNetworkImport, SAMPLE_NETWORK_CSV, type ReviewedRow } from "@/data/actions-network";
import type { Provider } from "@/domain/types";
import { cn } from "@/lib/cn";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false, loading: () => <div className="flex h-[460px] items-center justify-center rounded-xl border border-line bg-line-soft text-sm text-ink-muted">Carregando mapa…</div> });

type Mode = "endereco" | "plano" | "prestador" | "comparar" | "importar";
const TYPES = ["hospital", "maternidade", "laboratorio", "clinica", "pronto-socorro"];

function Rede() {
  const params = useSearchParams();
  const router = useRouter();
  const { can } = useStore();
  const [mode, setModeState] = useState<Mode>((params.get("modo") as Mode) || "endereco");
  const setMode = (m: Mode) => { setModeState(m); router.replace(`/rede?modo=${m}`, { scroll: false }); };
  return (
    <div>
      <PageHeader icon={<Icons.MapPinned className="h-5 w-5" />} title="Rede Credenciada Inteligente" subtitle="Pesquise pelo endereço do cliente, pelo plano ou pelo hospital — com distância, mapa e fonte de cada dado." />
      <div className="mb-4"><Tabs value={mode} onChange={setMode} tabs={[{ value: "endereco", label: "A · Pelo endereço" }, { value: "plano", label: "B · Pelo plano" }, { value: "prestador", label: "C · Pelo hospital/prestador" }, { value: "comparar", label: "Comparar redes" }, ...(can("network.import") ? [{ value: "importar" as Mode, label: "Importar rede" }] : [])]} /></div>
      {mode === "endereco" && <ByAddress />}
      {mode === "plano" && <ByPlan initialPlan={params.get("plano") ?? undefined} />}
      {mode === "prestador" && <ByProvider initialProvider={params.get("prestador") ?? undefined} />}
      {mode === "comparar" && <ComparePlans initial={params.get("planos")?.split(",").filter(Boolean)} />}
      {mode === "importar" && <Importer />}
    </div>
  );
}

function useOrigin() {
  const { db } = useStore();
  const clients = db.persons.filter((p) => p.clientStatus && p.addressId);
  const [clientId, setClientId] = useState("");
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const { toast } = useStore();
  const picker = (
    <div className="flex flex-wrap gap-2">
      <Select value={clientId} onChange={(e) => { setClientId(e.target.value); const p = db.persons.find((x) => x.id === e.target.value); const a = db.addresses.find((x) => x.id === p?.addressId); if (a) setOrigin({ lat: a.lat, lng: a.lng, label: `${p!.name} · ${a.district}` }); }} className="w-56"><option value="">Endereço de um cliente…</option>{clients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      <div className="flex gap-1.5"><Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter") { const g = await demoGeocoder.geocode(q); if (g) { setOrigin(g); setClientId(""); } else toast("Não localizado no geocoder DEMO (use CEP ou bairro do Rio/Niterói)", "warn"); } }} placeholder="ou CEP / bairro" className="w-48" /><Button variant="secondary" onClick={async () => { const g = await demoGeocoder.geocode(q); if (g) { setOrigin(g); setClientId(""); } else toast("Não localizado no geocoder DEMO", "warn"); }}>Localizar</Button></div>
    </div>
  );
  return { origin, setOrigin, picker };
}

function PlanChips({ providerId }: { providerId: string }) {
  const { db } = useStore();
  const list = plansForProvider(db, providerId);
  return <div className="mt-1 flex flex-wrap gap-1">{list.map(({ plan }) => <span key={plan.id} className="rounded bg-line-soft px-1.5 py-0.5 text-2xs text-ink-soft">{plan.name}</span>)}{!list.length && <span className="text-2xs text-ink-faint">nenhum plano cadastrado</span>}</div>;
}

// ───────── A — pelo endereço
function ByAddress() {
  const { db } = useStore();
  const { origin, setOrigin, picker } = useOrigin();
  const [radius, setRadius] = useState(5);
  const [type, setType] = useState("");
  const [spec, setSpec] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sel, setSel] = useState<string>();
  const specialties = [...new Set(db.providers.flatMap((p) => p.specialties))].sort();
  const o = origin ?? { lat: -22.9711, lng: -43.1822, label: "Copacabana (exemplo)" };
  const list = db.providers
    .map((p) => ({ p, d: distanceKm(o, p) }))
    .filter((x) => x.d <= radius && (!type || x.p.type === type) && (!spec || x.p.specialties.includes(spec)) && (!planFilter || db.planProviders.some((l) => l.planId === planFilter && l.providerId === x.p.id)))
    .sort((a, b) => a.d - b.d);
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-2">
        <Card>
          <div className="space-y-3">
            {picker}
            {!origin && <button onClick={() => setOrigin({ ...o })} className="text-2xs text-ink-muted">Usando ponto de exemplo: {o.label}</button>}
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-ink-muted">Raio</span><Segmented size="sm" value={String(radius)} onChange={(v) => setRadius(Number(v))} options={[2, 5, 10, 20].map((r) => ({ value: String(r), label: `${r} km` }))} /></div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</Select>
              <Select value={spec} onChange={(e) => setSpec(e.target.value)}><option value="">Especialidade</option>{specialties.map((s) => <option key={s}>{s}</option>)}</Select>
              <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}><option value="">Qualquer plano</option>{db.healthPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </div>
          </div>
        </Card>
        <Card padded={false} title={`${list.length} prestadores em até ${radius} km`} subtitle={`a partir de ${o.label}`}>
          <div className="max-h-[520px] divide-y divide-line-soft overflow-y-auto">
            {list.map(({ p, d }) => (
              <button key={p.id} onClick={() => setSel(p.id)} className={cn("block w-full px-4 py-2.5 text-left hover:bg-canvas", sel === p.id && "bg-brand-50/60")}>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[p.type] }} /><span className="flex-1 truncate text-sm font-medium">{p.name}</span><span className="text-xs tabular-nums text-ink-muted">{fmtKm(d)}</span></div>
                <div className="pl-4 text-2xs text-ink-muted">{TYPE_LABEL[p.type]} · {p.district} · {p.specialties.slice(0, 3).join(", ")}</div>
                <div className="pl-4"><PlanChips providerId={p.id} /></div>
              </button>
            ))}
            {!list.length && <Empty title="Nenhum prestador no raio">Aumente o raio ou remova filtros.</Empty>}
          </div>
        </Card>
      </div>
      <div className="xl:col-span-3">
        <MapView home={o} radiusKm={radius} selectedId={sel} onSelect={setSel} height={640} points={list.map(({ p, d }) => ({ id: p.id, lat: p.lat, lng: p.lng, color: TYPE_COLOR[p.type], label: p.name, sub: `${TYPE_LABEL[p.type]} · ${fmtKm(d)} · ${plansForProvider(db, p.id).length} planos` }))} />
        <Legend />
      </div>
    </div>
  );
}

function Legend() {
  return <div className="mt-2 flex flex-wrap gap-3 text-2xs text-ink-muted">{TYPES.map((t) => <span key={t} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />{TYPE_LABEL[t]}</span>)}<span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ink" />Cliente / referência</span><span className="ml-auto">Mapa © OpenStreetMap · geocoder DEMO</span></div>;
}

// ───────── B — pelo plano
function ByPlan({ initialPlan }: { initialPlan?: string }) {
  const { db } = useStore();
  const initOp = db.healthPlans.find((p) => p.id === initialPlan)?.insurerId ?? db.healthPlans[0].insurerId;
  const [op, setOp] = useState(initOp);
  const [planId, setPlanId] = useState(initialPlan ?? db.healthPlans.find((p) => p.insurerId === initOp)!.id);
  const [type, setType] = useState("");
  const { origin, picker } = useOrigin();
  const plan = db.healthPlans.find((p) => p.id === planId)!;
  const src = networkSource(db, plan);
  const list = planProviders(db, planId).filter((x) => !type || x.provider.type === type).map((x) => ({ ...x, d: origin ? distanceKm(origin, x.provider) : undefined })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0) || a.provider.name.localeCompare(b.provider.name));
  const operators = db.insurers.filter((i) => i.lines.includes("saude"));
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-2">
        <Card>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Operadora"><Select value={op} onChange={(e) => { setOp(e.target.value); setPlanId(db.healthPlans.find((p) => p.insurerId === e.target.value)!.id); }}>{operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
            <Field label="Plano"><Select value={planId} onChange={(e) => setPlanId(e.target.value)}>{db.healthPlans.filter((p) => p.insurerId === op).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-2xs"><Badge>{plan.accommodation}</Badge><Badge>{COVERAGE_LABEL[plan.coverage]}</Badge><Badge>{plan.coparticipation ? "com coparticipação" : "sem coparticipação"}</Badge><Badge>reembolso {REIMB_LABEL[plan.reimbursement].toLowerCase()}</Badge></div>
          {src && <div className="mt-2"><SourceChip source={`Rede atualizada em ${date(src.importedAt)} · ${src.label} · válida até ${date(src.validUntil)}`} stale={src.status !== "valida"} /></div>}
          {src?.status === "expirada" && <p className="mt-2 rounded-md bg-warn-soft px-2 py-1.5 text-xs text-warn-strong">Fonte expirada: confirme a rede com a operadora antes de apresentar ao cliente.</p>}
          <div className="mt-3 space-y-2">{picker}<Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</Select></div>
        </Card>
        <Card padded={false} title={`${list.length} prestadores na rede`}>
          <div className="max-h-[480px] divide-y divide-line-soft overflow-y-auto">
            {list.map(({ provider: p, link, d }) => (
              <div key={p.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[p.type] }} /><Link href={`/rede?modo=prestador&prestador=${p.id}`} className="flex-1 truncate text-sm font-medium hover:text-brand-700">{p.name}</Link>{d != null && <span className="text-xs text-ink-muted">{fmtKm(d)}</span>}</div>
                <div className="pl-4 text-2xs text-ink-muted">{p.district} · {link.services.map((s) => SERVICE_LABEL[s]).join(", ")}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="xl:col-span-3"><MapView home={origin ?? undefined} height={640} points={list.map(({ provider: p, d }) => ({ id: p.id, lat: p.lat, lng: p.lng, color: TYPE_COLOR[p.type], label: p.name, sub: `${TYPE_LABEL[p.type]}${d != null ? ` · ${fmtKm(d)}` : ""}` }))} /><Legend /></div>
    </div>
  );
}

// ───────── C — pelo prestador
function ByProvider({ initialProvider }: { initialProvider?: string }) {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [pid, setPid] = useState(initialProvider ?? "pr-atlantico");
  const p = db.providers.find((x) => x.id === pid);
  const matches = q.length >= 2 ? db.providers.map((x) => ({ x, s: Math.max(providerSimilarity(q, x.name), ...x.aliases.map((a) => providerSimilarity(q, a)), norm(x.name).includes(norm(q)) ? 0.9 : 0) })).filter((m) => m.s > 0.45).sort((a, b) => b.s - a.s).slice(0, 8) : [];
  const plans = p ? plansForProvider(db, p.id) : [];
  const notIn = p ? db.healthPlans.filter((hp) => !plans.some((x) => x.plan.id === hp.id)) : [];
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-2">
        <Card>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar hospital, laboratório, clínica (aceita grafias diferentes: “Copa Dor”, “Atlantico Dor”…)" autoFocus />
          {matches.length > 0 && <div className="mt-2 space-y-1">{matches.map(({ x, s }) => <button key={x.id} onClick={() => { setPid(x.id); setQ(""); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-line-soft"><span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[x.type] }} /><span className="flex-1">{x.name}</span><span className="text-2xs text-ink-muted">{Math.round(s * 100)}% similar</span></button>)}</div>}
        </Card>
        {p && (
          <Card title={p.name} subtitle={`${TYPE_LABEL[p.type]} · ${p.address} — ${p.district}, ${p.city}`}>
            <div className="mb-3 flex flex-wrap gap-1">{p.specialties.map((s) => <Badge key={s}>{s}</Badge>)}</div>
            {p.aliases.length > 0 && <p className="mb-3 text-2xs text-ink-muted">Também conhecido como: {p.aliases.join(" · ")}</p>}
            <div className="text-xs font-semibold text-ink-soft">{plans.length} plano(s) cadastrado(s) atendem este prestador</div>
            <Table className="mt-2">
              <thead><tr><Th>Plano</Th><Th>Operadora</Th><Th>Serviços</Th><Th>Fonte</Th></tr></thead>
              <tbody>{plans.map(({ plan, link }) => { const s = db.networkSources.find((x) => x.id === link.sourceId); return <tr key={plan.id}><Td><Link href={`/rede?modo=plano&plano=${plan.id}`} className="text-sm font-medium hover:text-brand-700">{plan.name}</Link></Td><Td className="text-xs">{insurerName(db, plan.insurerId)}</Td><Td className="text-xs">{link.services.map((x) => SERVICE_LABEL[x]).join(", ")}</Td><Td>{s && <SourceChip source={date(s.importedAt)} stale={s.status !== "valida"} />}</Td></tr>; })}</tbody>
            </Table>
            {notIn.length > 0 && <p className="mt-3 text-xs text-ink-muted"><b className="font-medium text-ink-soft">Não atendem:</b> {notIn.map((x) => x.name).join(", ")}</p>}
          </Card>
        )}
      </div>
      <div className="xl:col-span-3">{p && <MapView height={560} points={[{ id: p.id, lat: p.lat, lng: p.lng, color: TYPE_COLOR[p.type], label: p.name, size: 10 }, ...db.providers.filter((x) => x.id !== p.id && distanceKm(p, x) < 3).map((x) => ({ id: x.id, lat: x.lat, lng: x.lng, color: "#cbd5e1", label: x.name, sub: `${fmtKm(distanceKm(p, x))} de distância`, size: 5 }))]} />}</div>
    </div>
  );
}

// ───────── Comparar redes
function ComparePlans({ initial }: { initial?: string[] }) {
  const { db } = useStore();
  const [a, setA] = useState(initial?.[0] ?? "hp-vit-prime");
  const [b, setB] = useState(initial?.[1] ?? "hp-car-plus");
  const [type, setType] = useState("hospital");
  const { origin, picker } = useOrigin();
  const pa = db.healthPlans.find((p) => p.id === a)!;
  const pb = db.healthPlans.find((p) => p.id === b)!;
  const setA_ = new Set(planProviders(db, a).map((x) => x.provider.id));
  const setB_ = new Set(planProviders(db, b).map((x) => x.provider.id));
  const all = db.providers.filter((p) => (!type || p.type === type) && (setA_.has(p.id) || setB_.has(p.id)));
  const color = (p: Provider) => (setA_.has(p.id) && setB_.has(p.id) ? "#16a34a" : setA_.has(p.id) ? "#2563eb" : "#f59e0b");
  const points: MapPoint[] = all.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, color: color(p), label: p.name, sub: setA_.has(p.id) && setB_.has(p.id) ? "Nos dois planos" : setA_.has(p.id) ? `Só ${pa.name}` : `Só ${pb.name}` }));
  const both = all.filter((p) => setA_.has(p.id) && setB_.has(p.id));
  const onlyA = all.filter((p) => setA_.has(p.id) && !setB_.has(p.id));
  const onlyB = all.filter((p) => !setA_.has(p.id) && setB_.has(p.id));
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-2">
        <Card>
          <div className="grid grid-cols-2 gap-2">
            <Field label={<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" />Plano A</span>}><Select value={a} onChange={(e) => setA(e.target.value)}>{db.healthPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label={<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Plano B</span>}><Select value={b} onChange={(e) => setB(e.target.value)}>{db.healthPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><Select value={type} onChange={(e) => setType(e.target.value)} className="w-44"><option value="">Todos os tipos</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</Select>{picker}</div>
        </Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Card><div className="text-xl font-semibold text-green-600">{both.length}</div><div className="text-2xs text-ink-muted">nos dois</div></Card>
          <Card><div className="text-xl font-semibold text-blue-600">{onlyA.length}</div><div className="text-2xs text-ink-muted">só {pa.name}</div></Card>
          <Card><div className="text-xl font-semibold text-amber-600">{onlyB.length}</div><div className="text-2xs text-ink-muted">só {pb.name}</div></Card>
        </div>
        <Card title="O que muda?" subtitle="Preço para família de referência (38, 40 e 8 anos) — determinístico">
          <ul className="space-y-1.5 text-sm text-ink-soft">{whatChanges(db, pa, pb, [38, 40, 8]).map((t, i) => <li key={i} className="flex gap-2"><Icons.ArrowRight className="mt-1 h-3 w-3 shrink-0 text-brand-500" />{t}</li>)}</ul>
        </Card>
        <Card padded={false} title="Diferenças de rede">
          <div className="max-h-72 divide-y divide-line-soft overflow-y-auto text-sm">
            {[...onlyA.map((p) => ({ p, w: "A" })), ...onlyB.map((p) => ({ p, w: "B" }))].map(({ p, w }) => <div key={p.id + w} className="flex items-center gap-2 px-4 py-2"><span className={cn("h-2 w-2 rounded-full", w === "A" ? "bg-blue-600" : "bg-amber-500")} /><span className="flex-1">{p.name}</span><span className="text-2xs text-ink-muted">só {w === "A" ? pa.name : pb.name}{origin ? ` · ${fmtKm(distanceKm(origin, p))}` : ""}</span></div>)}
          </div>
        </Card>
      </div>
      <div className="xl:col-span-3"><MapView home={origin ?? undefined} points={points} height={640} /><div className="mt-2 flex gap-3 text-2xs text-ink-muted"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-600" />Nos dois</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Só A</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Só B</span></div></div>
    </div>
  );
}

// ───────── Importador com matching de duplicados
function Importer() {
  const { db, update, toast } = useStore();
  const [text, setText] = useState("");
  const [insurerId, setInsurerId] = useState("ins-amil");
  const [rows, setRows] = useState<ReviewedRow[] | null>(null);
  const [done, setDone] = useState<{ created: number; linked: number } | null>(null);
  const analyze = async (t: string) => {
    const parsed = parseNetworkCsv(t);
    const out: ReviewedRow[] = [];
    for (const row of parsed) {
      const plan = db.healthPlans.find((p) => norm(p.name) === norm(row.plan));
      const best = db.providers.map((p) => ({ p, s: Math.max(providerSimilarity(row.provider, p.name), ...p.aliases.map((a) => providerSimilarity(row.provider, a))) })).sort((x, y) => y.s - x.s)[0];
      const g = (await demoGeocoder.geocode(`${row.district}`)) ?? { lat: -22.95, lng: -43.2 };
      const near = best && distanceKm(best.p, g) < 1.5;
      out.push({ row, planId: plan?.id, providerId: best && best.s >= 0.75 ? best.p.id : undefined, decision: best && best.s >= 0.75 && near ? "vincular" : "novo", lat: g.lat + (Math.random() - 0.5) * 0.004, lng: g.lng + (Math.random() - 0.5) * 0.004 });
    }
    setRows(out);
    setDone(null);
  };
  return (
    <div className="space-y-4">
      <Card title="Importar rede credenciada" subtitle="CSV/XLSX/PDF da operadora → plano → prestador → unidade → endereço → especialidade. DEMO: CSV (XLSX e PDF entram via conversão/OCR na produção).">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Operadora"><Select value={insurerId} onChange={(e) => setInsurerId(e.target.value)}>{db.insurers.filter((i) => i.lines.includes("saude")).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
          <Field label="Arquivo CSV"><Input type="file" accept=".csv,.txt" onChange={async (e) => { const f = e.target.files?.[0]; if (f && tooLarge(f, UPLOAD_LIMITS.spreadsheetBytes)) { toast("Arquivo acima de 5 MB", "warn"); return; } if (f) { const t = await f.text(); setText(t); analyze(t); } }} /></Field>
          <div className="flex items-end"><Button variant="secondary" onClick={() => { setText(SAMPLE_NETWORK_CSV); analyze(SAMPLE_NETWORK_CSV); }} icon={<Icons.FileSpreadsheet className="h-4 w-4" />}>Usar arquivo de exemplo</Button></div>
        </div>
        {text && <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-canvas p-3 text-2xs text-ink-soft">{text}</pre>}
      </Card>
      {rows && (
        <Card padded={false} title="Matching de prestadores" subtitle="Nomes diferentes que provavelmente são o mesmo estabelecimento são sinalizados para validação humana" action={<Button disabled={!!done} onClick={() => { const label = `Importação ${insurerName(db, insurerId)} ${new Date().toLocaleDateString("pt-BR")}`; let res = { created: 0, linked: 0 }; update((d, u) => { const r = applyNetworkImport(d, u, insurerId, label, rows); res = r; return r.db; }); setTimeout(() => setDone(res)); toast("Rede importada com fonte, data e validade registradas"); }}>Confirmar importação</Button>}>
          <Table>
            <thead><tr><Th>Linha do arquivo</Th><Th>Plano</Th><Th>Correspondência na base</Th><Th>Similaridade</Th><Th>Decisão</Th></tr></thead>
            <tbody>
              {rows.map((r, i) => { const match = db.providers.find((p) => p.id === r.providerId); const s = match ? Math.max(providerSimilarity(r.row.provider, match.name), ...match.aliases.map((a) => providerSimilarity(r.row.provider, a))) : 0; return (
                <tr key={i}>
                  <Td><div className="text-sm font-medium">{r.row.provider}</div><div className="text-2xs text-ink-muted">{r.row.type} · {r.row.address} · {r.row.district}</div></Td>
                  <Td className="text-sm">{r.planId ? db.healthPlans.find((p) => p.id === r.planId)!.name : <Badge tone="danger">plano não encontrado</Badge>}</Td>
                  <Td className="text-sm">{match ? <>{match.name}{s < 0.999 && <div className="text-2xs text-warn-strong">possível mesmo estabelecimento — validar</div>}</> : <span className="text-ink-muted">nenhuma</span>}</Td>
                  <Td>{match ? <Badge tone={s >= 0.9 ? "ok" : "warn"}>{Math.round(s * 100)}%</Badge> : "—"}</Td>
                  <Td><Select value={r.decision} disabled={!!done} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, decision: e.target.value as ReviewedRow["decision"] } : x)))} className="h-8 w-48 text-xs">{match && <option value="vincular">Mesmo estabelecimento (vincular)</option>}<option value="novo">Novo prestador</option><option value="ignorar">Ignorar linha</option></Select></Td>
                </tr>); })}
            </tbody>
          </Table>
          {done && <div className="border-t border-line bg-ok-soft px-4 py-3 text-sm text-ok-strong">Importação concluída: {done.created} prestador(es) novo(s), {done.linked} vínculo(s) plano × prestador. Fonte registrada com data e validade de 90 dias. Grafias alternativas viraram “aliases”.</div>}
        </Card>
      )}
      <Card title="Fontes de rede cadastradas">
        <div className="space-y-2">{db.networkSources.map((s) => <div key={s.id} className="flex flex-wrap items-center gap-3 text-sm"><span className="w-56 font-medium">{s.label}</span><span className="text-xs text-ink-muted">{insurerName(db, s.insurerId)} · {s.kind.toUpperCase()} · confiança {Math.round(s.confidence * 100)}%</span><SourceChip source={`importada ${date(s.importedAt)} · válida até ${date(s.validUntil)}`} stale={s.status !== "valida"} /><Badge tone={s.status === "valida" ? "ok" : s.status === "expirando" ? "warn" : "danger"}>{s.status}</Badge></div>)}</div>
      </Card>
    </div>
  );
}

export default function Page() {
  return <Suspense><Rede /></Suspense>;
}
