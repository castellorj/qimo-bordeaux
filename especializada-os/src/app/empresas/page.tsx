"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/data/store";
import { Avatar, Button, Card, Icons, LineIcon, PageHeader, Table, Td, Th } from "@/components/ui";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { activePolicies, peopleOf, policiesOfParty, userName } from "@/domain/engines/queries";
import { maskCNPJ, money0 } from "@/lib/format";

export default function Empresas() {
  const { db, visible, can } = useStore();
  const [open, setOpen] = useState(false);
  const list = db.companies.filter((c) => visible({ type: "company", id: c.id }));
  return (
    <div>
      <PageHeader icon={<Icons.Building2 className="h-5 w-5" />} title="Empresas" subtitle="Sócios, funcionários e seguros corporativos" actions={can("clients.edit") && <Button icon={<Icons.Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nova empresa</Button>} />
      <Card padded={false}>
        <Table>
          <thead><tr><Th>Empresa</Th><Th>CNPJ</Th><Th>Setor</Th><Th>Funcionários</Th><Th>Sócios</Th><Th>Seguros</Th><Th className="text-right">Prêmio/ano</Th><Th>Corretor</Th></tr></thead>
          <tbody>
            {list.map((c) => {
              const ref = { type: "company" as const, id: c.id };
              const pols = activePolicies(policiesOfParty(db, ref));
              const partners = peopleOf(db, c.id).filter((p) => p.rel.role === "sócio");
              return (
                <tr key={c.id} className="hover:bg-canvas">
                  <Td><Link href={`/empresas/${c.id}`} className="flex items-center gap-2.5"><Avatar name={c.tradeName} tone="neutral" /><div><div className="font-medium">{c.tradeName}</div><div className="text-xs text-ink-muted">{c.legalName}</div></div></Link></Td>
                  <Td className="font-mono text-xs">{maskCNPJ(c.cnpj)}</Td>
                  <Td className="text-sm text-ink-soft">{c.sector}</Td>
                  <Td className="tabular-nums">{c.employees}</Td>
                  <Td className="text-xs text-ink-soft">{partners.map((p) => p.person.name.split(" ")[0]).join(", ")}</Td>
                  <Td><div className="flex gap-1">{[...new Set(pols.map((p) => p.line))].map((l) => <span key={l} className="rounded-md bg-canvas p-1"><LineIcon line={l} className="h-3.5 w-3.5" /></span>)}</div></Td>
                  <Td className="text-right tabular-nums">{money0(pols.reduce((s, p) => s + p.annualPremium, 0))}</Td>
                  <Td className="text-xs text-ink-soft">{userName(db, c.ownerId)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <NewClientDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
