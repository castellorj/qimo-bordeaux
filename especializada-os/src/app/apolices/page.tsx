"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Button, Card, Empty, Icons, Input, LineBadge, PageHeader, Select, Table, Td, Th } from "@/components/ui";
import { DaysBadge, PolicyStatusBadge } from "@/components/status";
import type { Policy, PolicyStatus, ProductLine } from "@/domain/types";
import { insurerName, partyHref, partyName, userName } from "@/domain/engines/queries";
import { PRODUCTS, lineLabel } from "@/domain/products";
import { date, money0, n, pct } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { downloadCSV } from "@/components/commercial/helpers";
import { cn } from "@/lib/cn";

const STATUS: { value: PolicyStatus | "ativas" | "todas"; label: string }[] = [
  { value: "ativas", label: "Ativas (vigente/em emissão)" },
  { value: "todas", label: "Todos os status" },
  { value: "vigente", label: "Vigente" },
  { value: "em_emissao", label: "Em emissão" },
  { value: "vencida", label: "Vencida" },
  { value: "renovada", label: "Renovada" },
  { value: "cancelada", label: "Cancelada" },
];
type SortKey = "vencimento" | "premio";

function ApolicesInner() {
  const { db, today, visible, can } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "vencimento", dir: 1 });

  const ramo = sp.get("ramo") ?? "";
  const seguradora = sp.get("seguradora") ?? "";
  const corretor = sp.get("corretor") ?? "";
  const status = (sp.get("status") ?? "ativas") as (typeof STATUS)[number]["value"];
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const showComm = can("commissions.view");
  const base = useMemo(() => db.policies.filter((p) => visible(p.holder)), [db.policies, visible]);
  const term = q.trim().toLowerCase();
  const rows = base
    .filter((p) => !ramo || p.line === ramo)
    .filter((p) => !seguradora || p.insurerId === seguradora)
    .filter((p) => !corretor || p.ownerId === corretor)
    .filter((p) => (status === "todas" ? true : status === "ativas" ? p.status === "vigente" || p.status === "em_emissao" : p.status === status))
    .filter((p) => !term || p.number.toLowerCase().includes(term) || partyName(db, p.holder).toLowerCase().includes(term) || p.productName.toLowerCase().includes(term))
    .sort((a, b) => (sort.key === "vencimento" ? a.end.localeCompare(b.end) : a.annualPremium - b.annualPremium) * sort.dir);

  const total = rows.reduce((s, p) => s + p.annualPremium, 0);
  const totalComm = rows.reduce((s, p) => s + p.annualPremium * p.commissionPct, 0);
  const lines = Array.from(new Set(base.map((p) => p.line)));
  const insurers = db.insurers.filter((i) => base.some((p) => p.insurerId === i.id));
  const owners = db.users.filter((u) => base.some((p) => p.ownerId === u.id));
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "premio" ? -1 : 1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");
  const anyFilter = ramo || seguradora || corretor || status !== "ativas" || term;

  const exportCsv = () =>
    downloadCSV(`apolices-${today}`, ["Número", "Cliente", "Ramo", "Seguradora", "Produto", "Início", "Fim", "Dias p/ vencer", "Prêmio anual", ...(showComm ? ["Comissão %"] : []), "Status", "Corretor"],
      rows.map((p: Policy) => [p.number, partyName(db, p.holder), lineLabel(p.line), insurerName(db, p.insurerId), p.productName, date(p.start), date(p.end), daysBetween(today, p.end), p.annualPremium, ...(showComm ? [Math.round(p.commissionPct * 1000) / 10] : []), p.status, userName(db, p.ownerId)]));

  return (
    <div>
      <PageHeader
        icon={<Icons.ShieldCheck className="h-5 w-5" />}
        title="Apólices"
        subtitle={<>{n(rows.length)} apólice{rows.length === 1 ? "" : "s"} · {money0(total)} em prêmio anual{showComm ? ` · ${money0(totalComm)} de comissão estimada` : ""}</>}
        actions={<Button variant="secondary" onClick={exportCsv} icon={<Icons.Download className="h-4 w-4" />}>Exportar CSV</Button>}
      />

      <Card padded={false}>
        <div className="grid gap-2 border-b border-line-soft p-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Icons.Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Número, cliente ou produto…" className="pl-8" />
          </div>
          <Select value={ramo} onChange={(e) => setParam("ramo", e.target.value)} aria-label="Ramo">
            <option value="">Todos os ramos</option>
            {PRODUCTS.filter((p) => lines.includes(p.line)).map((p) => <option key={p.line} value={p.line}>{p.label}</option>)}
          </Select>
          <Select value={seguradora} onChange={(e) => setParam("seguradora", e.target.value)} aria-label="Seguradora">
            <option value="">Todas as seguradoras</option>
            {insurers.map((i) => <option key={i.id} value={i.id}>{i.short}</option>)}
          </Select>
          <Select value={corretor} onChange={(e) => setParam("corretor", e.target.value)} aria-label="Corretor">
            <option value="">Todos os corretores</option>
            {owners.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setParam("status", e.target.value === "ativas" ? "" : e.target.value)} aria-label="Status">
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {anyFilter && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-ink-muted">
            Filtros ativos{ramo && <> · {lineLabel(ramo as ProductLine)}</>}{seguradora && <> · {insurerName(db, seguradora)}</>}{corretor && <> · {userName(db, corretor)}</>}
            <button onClick={() => { setQ(""); router.replace(pathname, { scroll: false }); }} className="ml-1 font-medium text-brand-700 hover:underline">Limpar</button>
          </div>
        )}
        <Table className="max-h-[70vh]">
          <thead>
            <tr>
              <Th>Número</Th>
              <Th>Cliente</Th>
              <Th>Ramo</Th>
              <Th>Seguradora</Th>
              <Th>Produto</Th>
              <Th onClick={() => toggleSort("vencimento")} active={sort.key === "vencimento"}>Vigência{arrow("vencimento")}</Th>
              <Th>Dias p/ vencer</Th>
              <Th onClick={() => toggleSort("premio")} active={sort.key === "premio"} className="text-right">Prêmio anual{arrow("premio")}</Th>
              {showComm && <Th className="text-right">Comissão</Th>}
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const days = daysBetween(today, p.end);
              const active = p.status === "vigente" || p.status === "em_emissao";
              return (
                <tr key={p.id} className="hover:bg-canvas">
                  <Td><Link href={`/apolices/${p.id}`} className="font-mono text-xs font-medium text-ink hover:text-brand-700">{p.number}</Link></Td>
                  <Td><Link href={partyHref(p.holder)} className="text-ink-soft hover:text-ink">{partyName(db, p.holder)}</Link></Td>
                  <Td><LineBadge line={p.line} /></Td>
                  <Td className="whitespace-nowrap"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: db.insurers.find((i) => i.id === p.insurerId)?.color }} />{insurerName(db, p.insurerId)}</Td>
                  <Td className="max-w-[200px] truncate text-xs text-ink-soft">{p.productName}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink-muted">{date(p.start)} – {date(p.end)}</Td>
                  <Td>{active ? <DaysBadge days={days} /> : <span className="text-2xs text-ink-faint">—</span>}</Td>
                  <Td className="text-right font-medium tabular-nums">{money0(p.annualPremium)}</Td>
                  {showComm && <Td className="text-right tabular-nums text-ink-soft">{pct(p.commissionPct, 1)}</Td>}
                  <Td><PolicyStatusBadge status={p.status} /></Td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-canvas font-medium">
                <Td colSpan={7} className="text-xs text-ink-muted">Total · {n(rows.length)} apólices</Td>
                <Td className="text-right tabular-nums">{money0(total)}</Td>
                {showComm && <Td className={cn("text-right tabular-nums text-ink-soft")}>{total ? pct(totalComm / total, 1) : "—"}<div className="text-2xs font-normal text-ink-faint">{money0(totalComm)}</div></Td>}
                <Td />
              </tr>
            </tfoot>
          )}
        </Table>
        {!rows.length && <Empty icon={<Icons.ShieldOff className="h-5 w-5" />} title="Nenhuma apólice encontrada">Ajuste os filtros ou a busca.</Empty>}
      </Card>
    </div>
  );
}

export default function ApolicesPage() {
  return (
    <Suspense fallback={null}>
      <ApolicesInner />
    </Suspense>
  );
}
