"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { BxReservation, BxParticipant } from "@/lib/supabase/bordeaux";
import { CadastroClienteModal } from "./CadastroClienteModal";

const norm = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (s?: string | null) => (s || "").replace(/\D/g, "");

interface Row {
  name: string;
  phone: string;
  phoneIsClient: boolean;
  source: string;
  activities: string[];
}

// Lista pessoas que aparecem em reservas mas NÃO constam no cadastro (Clientes),
// comparando por nome normalizado. Mostra também se o telefone da reserva bate
// com algum cliente (indício de que é a mesma pessoa cadastrada com outro nome).
export function ReservasSemCadastro({ res, parts, onChange }: { res: BxReservation[]; parts: BxParticipant[]; onChange?: () => void }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const rows = useMemo<Row[]>(() => {
    const nameSet = new Set(parts.map((p) => norm(p.full_name)).filter(Boolean));
    const phoneSet = new Set(parts.map((p) => digits(p.phone)).filter((d) => d.length >= 8));
    const active = res.filter((r) => r.status !== "cancelled");
    const found = new Map<string, Row>();

    const lastFirst = new Set([...nameSet].map((n) => { const p = n.split(" "); return p.length > 1 ? p[0] + "|" + p[p.length - 1] : n; }));
    const isClientName = (nk: string) => {
      if (!nk) return false;
      if (nameSet.has(nk)) return true;
      const p = nk.split(" ");
      const fl = p.length > 1 ? p[0] + "|" + p[p.length - 1] : nk;
      return lastFirst.has(fl); // casa "Alceu Pinto Junior" com "Alceu ... Junior" (1o+último nome)
    };
    for (const r of active) {
      const rPhone = digits(r.guest_phone);
      // Reserva já coberta por um cliente (vinculada OU telefone de cliente) → não é "sem cadastro"
      if (r.participant_id || (rPhone.length >= 8 && phoneSet.has(rPhone))) continue;
      const people = r.party && r.party.length ? r.party : ([r.guest_name].filter(Boolean) as string[]);
      const actLabel = r.activity ? `Dia ${r.activity.day_number ?? "?"} · ${r.activity.title}` : r.activity_id;
      for (const person of people) {
        const nk = norm(person);
        if (!nk || isClientName(nk)) continue; // já é cliente pelo nome
        const cur = found.get(nk) || {
          name: person,
          phone: r.guest_phone || "",
          phoneIsClient: rPhone.length >= 8 && phoneSet.has(rPhone),
          source: r.source,
          activities: [],
        };
        if (!cur.activities.includes(actLabel)) cur.activities.push(actLabel);
        found.set(nk, cur);
      }
    }
    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [res, parts]);

  const q = norm(query);
  const visible = q ? rows.filter((r) => norm(`${r.name} ${r.phone}`).includes(q)) : rows;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-light">Reservou, mas não é cliente</h3>
          <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
            Pessoas que aparecem em alguma reserva do app mas <strong>não constam no cadastro</strong> (Clientes).
            Já descontamos quem tem <strong>telefone de cliente</strong>, quem a reserva já está <strong>vinculada</strong>
            e quem casa por <strong>1º + último nome</strong> — então aqui ficam só os realmente não cadastrados.
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-[12px] ${rows.length ? "bg-gold/15 text-gold-deep" : "bg-olive/15 text-olive-deep"}`}>
          {rows.length} {rows.length === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-dashed p-6 text-center" style={{ borderColor: "var(--line)" }}>
          <Icon name="CircleCheck" size={20} className="text-olive-deep" />
          <p className="mt-2 font-sans text-[13px] text-muted">Todas as pessoas com reserva constam no cadastro. ✅</p>
        </div>
      ) : (
        <>
          <label className="mt-4 flex min-w-[240px] max-w-sm items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: "var(--line)" }}>
            <Icon name="Search" size={14} className="text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome ou telefone"
              className="w-full bg-transparent font-sans text-[12px] outline-none placeholder:text-muted" />
          </label>

          <div className="mt-3 overflow-x-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
            <table className="w-full border-collapse text-left font-sans text-[13px]">
              <thead className="bg-black/[0.03]">
                <tr>
                  {["Nome (na reserva)", "Telefone da reserva", "Passeios", "Origem", ""].map((h, hi) => (
                    <th key={hi} className="border-b px-4 py-2.5 font-sans text-[11px] uppercase tracking-wide2 text-muted" style={{ borderColor: "var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={i}>
                    <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>{r.name}</td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>
                      {r.phone || "—"}
                      {r.phoneIsClient && <span className="ml-2 rounded-full bg-olive/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-olive-deep">tel. de cliente</span>}
                    </td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{r.activities.join(" · ")}</td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>
                      {r.source === "guest" ? "pelo app" : "equipe"}
                    </td>
                    <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)" }}>
                      {done.has(norm(r.name)) ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-sans text-[12px] text-olive-deep"><Icon name="CircleCheck" size={13} /> Cadastrado</span>
                      ) : (
                        <button onClick={() => setEditing(r)} className="btn-ghost whitespace-nowrap !px-3 !py-1.5 text-[12px]">
                          <Icon name="UserPlus" size={13} /> Cadastrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CadastroClienteModal
        initial={editing ? { name: editing.name, phone: editing.phone } : null}
        onClose={() => setEditing(null)}
        onSaved={() => { if (editing) setDone((s) => new Set(s).add(norm(editing.name))); setEditing(null); onChange?.(); }}
      />
    </div>
  );
}
