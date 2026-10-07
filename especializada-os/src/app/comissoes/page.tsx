"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { Badge, Button, Card, Empty, Icons, LineBadge, PageHeader, Select, Stat, Table, Td, Th } from "@/components/ui";
import { BarList, Columns } from "@/components/charts";
import type { Commission, Policy } from "@/domain/types";
import { insurerName, partyName, userName } from "@/domain/engines/queries";
import { groupSum } from "@/domain/engines/metrics";
import { PRODUCT, lineLabel } from "@/domain/products";
import { downloadCSV, monthLabel } from "@/components/commercial/helpers";
import { money, money0, moneyK, n } from "@/lib/format";
import { addMonths } from "@/lib/dates";
import { cn } from "@/lib/cn";

const STATUS_TONE = { prevista: "neutral", recebida: "ok", divergente: "warn", atrasada: "danger" } as const;
const STATUS_LABEL: Record<Commission["status"], string> = { prevista: "Prevista", recebida: "Recebida", divergente: "Divergente", atrasada: "Atrasada" };
interface Row { c: Commission; p: Policy; diff: number | null }

/** Diferença recebida − prevista (atrasada = nada recebido; prevista = ainda sem diferença). */
function diffOf(c: Commission): number | null {
  if (c.received != null) return Math.round((c.received - c.expected) * 100) / 100;
  if (c.status === "atrasada") return -c.expected;
  return null;
}

export default function ComissoesPage() {
  const { db, today, visible, can } = useStore();
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const [comp, setComp] = useState<string>(month);
  const [status, setStatus] = useState<Commission["status"] | "">("");
  const [ins, setIns] = useState("");
  const [limit, setLimit] = useState(150);

  const all = useMemo<Row[]>(() => {
    const pol = new Map(db.policies.filter((p) => visible(p.holder)).map((p) => [p.id, p]));
    return db.commissions.filter((c) => pol.has(c.policyId)).map((c) => ({ c, p: pol.get(c.policyId)!, diff: diffOf(c) }));
  }, [db.commissions, db.policies, visible]);

  if (!can("commissions.view")) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não tem acesso ao módulo de comissões. Fale com o gestor da corretora.</Empty>;

  const monthRows = all.filter((r) => r.c.competence === month);
  const expMonth = monthRows.reduce((s, r) => s + r.c.expected, 0);
  const recMonth = monthRows.reduce((s, r) => s + (r.c.received ?? 0), 0);
  const recYear = all.filter((r) => r.c.competence.startsWith(year)).reduce((s, r) => s + (r.c.received ?? 0), 0);
  const pend = all.filter((r) => r.c.status === "divergente" || r.c.status === "atrasada");
  const pendValue = pend.reduce((s, r) => s - (r.diff ?? 0), 0);

  const months = Array.from({ length: 8 }, (_, k) => addMonths(`${month}-01`, k - 5).slice(0, 7));
  const series = months.map((m) => {
    const rs = all.filter((r) => r.c.competence === m);
    return { label: monthLabel(m), values: [rs.reduce((s, r) => s + r.c.expected, 0), rs.reduce((s, r) => s + (r.c.received ?? 0), 0)], highlight: m === month };
  });
  const yearRows = all.filter((r) => r.c.competence.startsWith(year));
  const byIns = groupSum(yearRows, (r) => r.p.insurerId, (r) => r.c.expected);
  const byLine = groupSum(yearRows, (r) => r.p.line, (r) => r.c.expected);
  const byOwner = groupSum(yearRows, (r) => r.p.ownerId, (r) => r.c.expected);

  const comps = Array.from(new Set(all.map((r) => r.c.competence))).sort().reverse();
  const insurers = db.insurers.filter((i) => all.some((r) => r.p.insurerId === i.id));
  const rows = all
    .filter((r) => !comp || r.c.competence === comp)
    .filter((r) => !status || r.c.status === status)
    .filter((r) => !ins || r.p.insurerId === ins)
    .sort((a, b) => b.c.competence.localeCompare(a.c.competence) || partyName(db, a.p.holder).localeCompare(partyName(db, b.p.holder)));
  const tExp = rows.reduce((s, r) => s + r.c.expected, 0);
  const tRec = rows.reduce((s, r) => s + (r.c.received ?? 0), 0);
  const tDiff = rows.reduce((s, r) => s + (r.diff ?? 0), 0);

  const exportCsv = () =>
    downloadCSV(`comissoes-${comp || "todas"}`, ["Competência", "Cliente", "Apólice", "Seguradora", "Ramo", "Corretor", "Prevista", "Recebida", "Diferença", "Status"],
      rows.map((r) => [r.c.competence, partyName(db, r.p.holder), r.p.number, insurerName(db, r.p.insurerId), lineLabel(r.p.line), userName(db, r.p.ownerId), r.c.expected, r.c.received ?? null, r.diff, STATUS_LABEL[r.c.status]]));

  return (
    <div>
      <PageHeader
        icon={<Icons.Wallet className="h-5 w-5" />}
        title="Comissões"
        subtitle="Prevista × recebida por competência, com divergências e atrasos destacados. Importe o extrato de cada seguradora em “Conciliar extrato”."
        actions={<><Link href="/comissoes/conciliacao" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"><Icons.FileSpreadsheet className="h-4 w-4" />Conciliar extrato</Link><Button variant="secondary" onClick={exportCsv} icon={<Icons.Download className="h-4 w-4" />}>Exportar CSV</Button></>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`Prevista · ${monthLabel(month)}`} value={moneyK(expMonth)} sub={`${monthRows.length} parcelas na competência`} icon={<Icons.CalendarClock className="h-4 w-4" />} tone="brand" />
        <Stat label={`Recebida · ${monthLabel(month)}`} value={moneyK(recMonth)} sub={expMonth ? `${Math.round((recMonth / expMonth) * 100)}% do previsto` : "—"} icon={<Icons.CircleDollarSign className="h-4 w-4" />} tone="ok" />
        <Stat label={`Recebida em ${year}`} value={moneyK(recYear)} sub={`${n(yearRows.filter((r) => r.c.received != null).length)} parcelas conciliadas`} icon={<Icons.TrendingUp className="h-4 w-4" />} tone="ok" />
        <Stat label="Diferenças / pendências" value={<span className={cn(pendValue > 0 && "text-danger")}>{moneyK(pendValue)}</span>} sub={`${pend.filter((r) => r.c.status === "divergente").length} divergentes · ${pend.filter((r) => r.c.status === "atrasada").length} atrasadas`} icon={<Icons.AlertTriangle className="h-4 w-4" />} tone="danger" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Prevista × recebida" subtitle="Últimos 6 meses e próximos 2" className="lg:col-span-1">
          <Columns data={series} series={[{ name: "Prevista", color: "#bcd2ff" }, { name: "Recebida", color: "#1f4fe0" }]} format={money0} />
        </Card>
        <Card title="Por seguradora" subtitle={`Previsto em ${year}`}>
          <BarList items={byIns.slice(0, 7).map((x) => ({ label: insurerName(db, x.key), value: x.value, color: db.insurers.find((i) => i.id === x.key)?.color }))} format={moneyK} />
        </Card>
        <Card title="Por produto" subtitle={`Previsto em ${year}`}>
          <BarList items={byLine.slice(0, 7).map((x) => ({ label: lineLabel(x.key as Policy["line"]), value: x.value, color: PRODUCT[x.key as Policy["line"]]?.color }))} format={moneyK} />
        </Card>
      </div>
      {byOwner.length > 1 && (
        <Card title="Por corretor" subtitle={`Previsto em ${year}`} className="mt-4">
          <div className="grid gap-x-8 md:grid-cols-2"><BarList items={byOwner.map((x) => ({ label: userName(db, x.key), value: x.value }))} format={moneyK} /></div>
        </Card>
      )}

      <Card padded={false} className="mt-4" title="Lançamentos" subtitle={`${n(rows.length)} parcelas · prevista ${money0(tExp)} · recebida ${money0(tRec)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={comp} onChange={(e) => { setComp(e.target.value); setLimit(150); }} className="h-8 w-36 text-xs" aria-label="Competência">
              <option value="">Todas as competências</option>
              {comps.map((c) => <option key={c} value={c}>{monthLabel(c)}{c === month ? " (atual)" : ""}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Commission["status"] | "")} className="h-8 w-32 text-xs" aria-label="Status">
              <option value="">Todos os status</option>
              {(Object.keys(STATUS_LABEL) as Commission["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
            <Select value={ins} onChange={(e) => setIns(e.target.value)} className="h-8 w-36 text-xs" aria-label="Seguradora">
              <option value="">Todas as seguradoras</option>
              {insurers.map((i) => <option key={i.id} value={i.id}>{i.short}</option>)}
            </Select>
          </div>
        }
      >
        <Table className="max-h-[65vh]">
          <thead>
            <tr><Th>Competência</Th><Th>Cliente</Th><Th>Apólice</Th><Th>Seguradora</Th><Th>Ramo</Th><Th>Corretor</Th><Th className="text-right">Prevista</Th><Th className="text-right">Recebida</Th><Th className="text-right">Diferença</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((r) => (
              <tr key={r.c.id} className="hover:bg-canvas">
                <Td className="text-xs font-medium">{monthLabel(r.c.competence)}</Td>
                <Td className="max-w-[180px] truncate text-ink-soft">{partyName(db, r.p.holder)}</Td>
                <Td><Link href={`/apolices/${r.p.id}`} className="font-mono text-xs text-ink hover:text-brand-700">{r.p.number}</Link></Td>
                <Td className="text-xs">{insurerName(db, r.p.insurerId)}</Td>
                <Td><LineBadge line={r.p.line} /></Td>
                <Td className="text-xs text-ink-muted">{userName(db, r.p.ownerId)}</Td>
                <Td className="text-right tabular-nums">{money(r.c.expected)}</Td>
                <Td className="text-right tabular-nums">{r.c.received != null ? money(r.c.received) : "—"}</Td>
                <Td className={cn("text-right tabular-nums", r.diff != null && r.diff < 0 && "font-medium text-danger", r.diff != null && r.diff > 0 && "text-ok-strong")}>{r.diff == null ? "—" : r.diff === 0 ? money(0) : `${r.diff > 0 ? "+" : "−"}${money(Math.abs(r.diff))}`}</Td>
                <Td><Badge tone={STATUS_TONE[r.c.status]} dot>{STATUS_LABEL[r.c.status]}</Badge></Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-canvas font-medium">
                <Td colSpan={6} className="text-xs text-ink-muted">Total · {n(rows.length)} parcelas</Td>
                <Td className="text-right tabular-nums">{money(tExp)}</Td>
                <Td className="text-right tabular-nums">{money(tRec)}</Td>
                <Td className={cn("text-right tabular-nums", tDiff < 0 && "text-danger")}>{tDiff === 0 ? money(0) : `${tDiff > 0 ? "+" : "−"}${money(Math.abs(tDiff))}`}</Td>
                <Td />
              </tr>
            </tfoot>
          )}
        </Table>
        {rows.length > limit && (
          <div className="flex justify-center border-t border-line-soft py-3">
            <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 300)}>Mostrar mais ({n(rows.length - limit)} restantes)</Button>
          </div>
        )}
        {!rows.length && <Empty icon={<Icons.Wallet className="h-5 w-5" />} title="Nenhum lançamento">Nenhuma comissão com estes filtros.</Empty>}
      </Card>
    </div>
  );
}
