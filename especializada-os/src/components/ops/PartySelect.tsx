"use client";
import { useMemo } from "react";
import type { PartyRef } from "@/domain/types";
import { useStore } from "@/data/store";
import { Select } from "@/components/ui";

export const partyKey = (ref?: PartyRef) => (ref ? `${ref.type}:${ref.id}` : "");
export function parsePartyKey(k: string): PartyRef | undefined {
  const [type, id] = k.split(":");
  return type && id && (type === "person" || type === "company") ? { type, id } : undefined;
}

/** Seleção de cliente (pessoas e empresas) respeitando a visibilidade de carteira. */
export function PartySelect({ value, onChange, placeholder = "Selecione o cliente…", includeRelated = false, className }: { value?: PartyRef; onChange: (v: PartyRef | undefined) => void; placeholder?: string; includeRelated?: boolean; className?: string }) {
  const { db, visible } = useStore();
  const { persons, companies } = useMemo(() => {
    const persons = db.persons
      .filter((p) => (includeRelated || p.clientStatus != null) && visible({ type: "person", id: p.id }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const companies = db.companies.filter((c) => visible({ type: "company", id: c.id })).sort((a, b) => a.tradeName.localeCompare(b.tradeName, "pt-BR"));
    return { persons, companies };
  }, [db, visible, includeRelated]);
  // garante que o valor atual apareça mesmo que não seja "cliente" (ex.: dependente identificado por CPF)
  const current = value && value.type === "person" && !persons.some((p) => p.id === value.id) ? db.persons.find((p) => p.id === value.id) : undefined;
  return (
    <Select value={partyKey(value)} onChange={(e) => onChange(parsePartyKey(e.target.value))} className={className}>
      <option value="">{placeholder}</option>
      {current && <option value={`person:${current.id}`}>{current.name}</option>}
      <optgroup label="Pessoas">
        {persons.map((p) => (
          <option key={p.id} value={`person:${p.id}`}>{p.name}{p.clientStatus === "lead" ? " (lead)" : ""}</option>
        ))}
      </optgroup>
      <optgroup label="Empresas">
        {companies.map((c) => (
          <option key={c.id} value={`company:${c.id}`}>{c.tradeName}</option>
        ))}
      </optgroup>
    </Select>
  );
}
