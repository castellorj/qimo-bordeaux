"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Avatar, Badge, Button, Card, Icons, Input, LineIcon, PageHeader, Select, Table, Td, Th, Tabs } from "@/components/ui";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { activePolicies, clientValue, householdOf, policiesOfParty, userName } from "@/domain/engines/queries";
import { hideCPF, maskCNPJ, money0, phone, date } from "@/lib/format";
import { includesNorm } from "@/lib/text";
import { digits } from "@/lib/format";
import type { PartyRef, ProductLine } from "@/domain/types";
import { daysBetween } from "@/lib/dates";
import { DaysBadge } from "@/components/status";

function Clientes() {
  const { db, today, visible, can } = useStore();
  const params = useSearchParams();
  const [tab, setTab] = useState<"todos" | "pf" | "pj" | "leads">("todos");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [open, setOpen] = useState(params.get("novo") === "1");

  const rows = useMemo(() => {
    const all: { ref: PartyRef; name: string; doc: string; sub: string; phone?: string; ownerId?: string; status: string; since?: string }[] = [
      ...db.persons.filter((p) => p.clientStatus).map((p) => ({ ref: { type: "person" as const, id: p.id }, name: p.name, doc: hideCPF(p.cpf), sub: [p.profession, householdOf(db, p.id)?.name].filter(Boolean).join(" · "), phone: p.whatsapp ?? p.phone, ownerId: p.ownerId, status: p.clientStatus!, since: p.clientSince })),
      ...db.companies.filter((c) => c.clientStatus).map((c) => ({ ref: { type: "company" as const, id: c.id }, name: c.tradeName, doc: maskCNPJ(c.cnpj), sub: `${c.sector} · ${c.employees} funcionários`, phone: c.phone, ownerId: c.ownerId, status: c.clientStatus!, since: c.clientSince })),
    ];
    return all
      .filter((r) => visible(r.ref))
      .filter((r) => (tab === "pf" ? r.ref.type === "person" : tab === "pj" ? r.ref.type === "company" : tab === "leads" ? r.status === "lead" : true))
      .filter((r) => !owner || r.ownerId === owner)
      .filter((r) => !q || includesNorm(r.name, q) || (digits(q).length >= 3 && (digits(r.doc).includes(digits(q)) || digits(r.phone ?? "").includes(digits(q)))))
      .map((r) => {
        const pols = activePolicies(policiesOfParty(db, r.ref));
        const next = pols.map((p) => daysBetween(today, p.end)).filter((d) => d >= -30).sort((a, b) => a - b)[0];
        return { ...r, lines: [...new Set(pols.map((p) => p.line))] as ProductLine[], value: clientValue(db, r.ref), next };
      })
      .sort((a, b) => b.value - a.value);
  }, [db, visible, tab, owner, q, today]);

  const href = (r: PartyRef) => (r.type === "person" ? `/clientes/${r.id}` : `/empresas/${r.id}`);
  return (
    <div>
      <PageHeader icon={<Icons.Users className="h-5 w-5" />} title="Clientes" subtitle={`${rows.length} registros · pessoas e empresas em um cadastro único`} actions={can("clients.edit") && <Button icon={<Icons.UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>Novo cliente</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 px-4 pt-3">
          <div className="flex-1"><Tabs value={tab} onChange={setTab} tabs={[{ value: "todos", label: "Todos" }, { value: "pf", label: "Pessoas" }, { value: "pj", label: "Empresas" }, { value: "leads", label: "Leads" }]} /></div>
          <div className="relative w-64"><Icons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, CPF, CNPJ, telefone" className="pl-8" /></div>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-44"><option value="">Todos os corretores</option>{db.users.filter((u) => ["corretor", "admin", "gestor"].includes(u.role)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        </div>
        <Table className="mt-2">
          <thead><tr><Th>Cliente</Th><Th>Documento</Th><Th>Contato</Th><Th>Seguros ativos</Th><Th className="text-right">Prêmio/ano</Th><Th>Próx. vencimento</Th><Th>Corretor</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref.id} className="hover:bg-canvas">
                <Td>
                  <Link href={href(r.ref)} className="flex items-center gap-2.5">
                    <Avatar name={r.name} tone={r.ref.type === "company" ? "neutral" : "brand"} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-ink">{r.name}{r.status === "lead" && <Badge tone="warn">Lead</Badge>}{r.ref.type === "company" && <Icons.Building2 className="h-3.5 w-3.5 text-ink-faint" />}</div>
                      <div className="truncate text-xs text-ink-muted">{r.sub || `cliente desde ${date(r.since)}`}</div>
                    </div>
                  </Link>
                </Td>
                <Td className="font-mono text-xs text-ink-soft">{r.doc}</Td>
                <Td className="text-xs text-ink-soft">{phone(r.phone)}</Td>
                <Td><div className="flex gap-1">{r.lines.map((l) => <span key={l} title={l} className="rounded-md bg-canvas p-1"><LineIcon line={l} className="h-3.5 w-3.5" /></span>)}{!r.lines.length && <span className="text-xs text-ink-faint">—</span>}</div></Td>
                <Td className="text-right tabular-nums">{r.value ? money0(r.value) : "—"}</Td>
                <Td>{r.next != null ? <DaysBadge days={r.next} /> : <span className="text-xs text-ink-faint">—</span>}</Td>
                <Td className="text-xs text-ink-soft">{userName(db, r.ownerId)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <NewClientDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
export default function Page() {
  return <Suspense><Clientes /></Suspense>;
}
