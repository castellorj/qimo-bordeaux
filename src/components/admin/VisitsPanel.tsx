"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { fetchVisitsSummary, fetchVisitsTotals, type VisitSummary, type VisitTotals } from "@/lib/supabase/visits";

function fmt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function fmtFull(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Escapa um campo para CSV (aspas, vírgulas, quebras de linha).
function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadVisitsCsv(rows: VisitSummary[]) {
  const header = ["Hospede", "Telefone", "Acessos", "Primeiro acesso", "Ultimo acesso"];
  const lines = rows.map((r) => [r.name || "", r.phone || "", r.visits, fmtFull(r.first_seen), fmtFull(r.last_seen)].map(csvCell).join(";"));
  // BOM (﻿) + ; como separador → abre certinho no Excel em PT-BR, com acentos.
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `acessos-qimo-bordeaux-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function VisitsPanel() {
  const [rows, setRows] = useState<VisitSummary[] | null>(null);
  const [totals, setTotals] = useState<VisitTotals | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(false);
    try {
      const [s, t] = await Promise.all([fetchVisitsSummary(), fetchVisitsTotals()]);
      setRows(s);
      setTotals(t);
    } catch {
      setError(true);
      setRows([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const q = query.trim().toLowerCase();
  const visible = (rows || []).filter((r) =>
    !q || `${r.name} ${r.phone}`.toLowerCase().includes(q)
  );

  const Card = ({ label, value, icon }: { label: string; value: number | string; icon: string }) => (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/[0.04] text-gold-deep"><Icon name={icon} size={18} /></span>
      <div>
        <p className="font-serif text-2xl font-light leading-none" style={{ color: "var(--text)" }}>{value}</p>
        <p className="mt-1 font-sans text-[11px] uppercase tracking-wide2 text-muted">{label}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-light">Acessos ao guia</h3>
          <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
            Quem abriu o guia e quantas vezes. Cada sessão do navegador conta como um acesso; o hóspede é identificado pelo nome/telefone do login.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadVisitsCsv(visible)} disabled={!rows || rows.length === 0}
            className="btn-ghost !px-3 !py-2 text-[12px] disabled:opacity-40">
            <Icon name="Download" size={14} /> Exportar CSV
          </button>
          <button onClick={load} className="btn-ghost !px-3 !py-2 text-[12px]"><Icon name="ArrowRight" size={14} /> Atualizar</button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[10px] border border-dashed p-5" style={{ borderColor: "var(--line)" }}>
          <p className="flex items-start gap-2 font-sans text-[13px] text-muted">
            <Icon name="AlertTriangle" size={15} className="mt-0.5 shrink-0 text-gold-deep" />
            <span>
              O registro de acessos ainda não está ativo no banco. É preciso rodar a migration
              <strong> 0005_bordeaux_visits.sql</strong> no Supabase uma única vez. Depois disso, os acessos passam a aparecer aqui.
            </span>
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card label="Acessos totais" value={totals?.total_visits ?? "…"} icon="TrendingUp" />
            <Card label="Hóspedes únicos" value={totals?.unique_guests ?? "…"} icon="Users" />
            <Card label="Acessos (7 dias)" value={totals?.visits_7d ?? "…"} icon="CalendarDays" />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="kicker-muted">{visible.length} {visible.length === 1 ? "hóspede" : "hóspedes"}</p>
            <label className="flex min-w-[220px] items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: "var(--line)" }}>
              <Icon name="Search" size={14} className="text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome ou telefone"
                className="w-full bg-transparent font-sans text-[12px] outline-none placeholder:text-muted" />
            </label>
          </div>

          <div className="mt-3 overflow-x-auto rounded-[10px] border" style={{ borderColor: "var(--line)" }}>
            <table className="w-full border-collapse text-left font-sans text-[13px]">
              <thead className="bg-black/[0.03]">
                <tr>
                  {["Hóspede", "Telefone", "Acessos", "Primeiro acesso", "Último acesso"].map((h) => (
                    <th key={h} className="border-b px-4 py-2.5 font-sans text-[11px] uppercase tracking-wide2 text-muted" style={{ borderColor: "var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows === null ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Carregando…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Nenhum acesso registrado ainda.</td></tr>
                ) : (
                  visible.map((r, i) => (
                    <tr key={i}>
                      <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>{r.name || "—"}</td>
                      <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{r.phone || "—"}</td>
                      <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>
                        <span className="rounded-full bg-petrol-600/10 px-2.5 py-0.5 font-semibold text-petrol-600">{r.visits}</span>
                      </td>
                      <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{fmt(r.first_seen)}</td>
                      <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{fmt(r.last_seen)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
