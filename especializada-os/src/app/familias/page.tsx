"use client";
import Link from "next/link";
import { useStore } from "@/data/store";
import { Avatar, Card, Icons, LineIcon, PageHeader } from "@/components/ui";
import { householdPolicies } from "@/domain/engines/queries";
import { money0 } from "@/lib/format";
import { ageOn } from "@/lib/dates";

export default function Familias() {
  const { db, today, visible } = useStore();
  const list = db.households.filter((h) => h.members.some((m) => visible({ type: "person", id: m.personId })));
  return (
    <div>
      <PageHeader icon={<Icons.HeartHandshake className="h-5 w-5" />} title="Famílias" subtitle="Household: membros, seguros, ativos e vencimentos em uma única visão" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((h) => {
          const pols = householdPolicies(db, h.id).filter((p) => p.status === "vigente");
          const ad = db.addresses.find((a) => a.id === h.addressId);
          return (
            <Link key={h.id} href={`/familias/${h.id}`}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-pop">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold">{h.name}</div>
                    <div className="text-xs text-ink-muted">{h.members.length} membros · {ad?.district}</div>
                  </div>
                  <div className="flex -space-x-2">{h.members.map((m) => { const p = db.persons.find((x) => x.id === m.personId)!; return <span key={m.personId} className="rounded-full ring-2 ring-white"><Avatar name={p.name} size="sm" /></span>; })}</div>
                </div>
                <div className="mt-3 text-xs text-ink-soft">{h.members.map((m) => { const p = db.persons.find((x) => x.id === m.personId)!; return `${p.name.split(" ")[0]} (${ageOn(p.birthDate, today)})`; }).join(" · ")}</div>
                <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
                  <div className="flex gap-1">{[...new Set(pols.map((p) => p.line))].map((l) => <span key={l} className="rounded-md bg-canvas p-1"><LineIcon line={l} className="h-3.5 w-3.5" /></span>)}</div>
                  <span className="text-sm font-medium tabular-nums">{money0(pols.reduce((s, p) => s + p.annualPremium, 0))}<span className="text-2xs font-normal text-ink-muted">/ano</span></span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
