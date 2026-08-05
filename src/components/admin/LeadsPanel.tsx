"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { fetchVisitsSummary, type VisitSummary } from "@/lib/supabase/visits";
import { addParticipant, type BxParticipant } from "@/lib/supabase/bordeaux";

const norm = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
const digits = (s?: string | null) => (s || "").replace(/\D/g, "");

function fmt(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
function csvCell(v: string | number) { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

// Quem ENTROU no guia (acessos) mas NÃO está no cadastro de clientes.
export function LeadsPanel({ parts, onChange }: { parts: BxParticipant[]; onChange?: () => void }) {
  const [visits, setVisits] = useState<VisitSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const keyOf = (l: VisitSummary) => digits(l.phone) || norm(l.name);
  const cadastrar = async (l: VisitSummary) => {
    const k = keyOf(l);
    setSaving(k);
    try {
      await addParticipant({ full_name: l.name || "(sem nome)", phone: l.phone || null });
      setDone((s) => new Set(s).add(k));
      onChange?.(); // recarrega os clientes no painel -> o lead sai da lista
    } catch { alert("Não foi possível cadastrar. Tente de novo."); }
    setSaving(null);
  };

  const load = useCallback(async () => {
    setError(false);
    try { setVisits(await fetchVisitsSummary()); }
    catch { setError(true); setVisits([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const leads = useMemo(() => {
    const nameSet = new Set(parts.map((p) => norm(p.full_name)).filter(Boolean));
    const phoneSet = new Set(parts.map((p) => digits(p.phone)).filter((d) => d.length >= 8));
    const lastFirst = new Set([...nameSet].map((n) => { const p = n.split(" "); return p.length > 1 ? p[0] + "|" + p[p.length - 1] : n; }));
    const isClient = (v: VisitSummary) => {
      const nk = norm(v.name);
      if (nk && nameSet.has(nk)) return true;
      if (nk) { const p = nk.split(" "); const fl = p.length > 1 ? p[0] + "|" + p[p.length - 1] : nk; if (lastFirst.has(fl)) return true; }
      const d = digits(v.phone);
      if (d.length >= 8 && phoneSet.has(d)) return true;
      return false;
    };
    return (visits || []).filter((v) => !isClient(v));
  }, [visits, parts]);

  const q = norm(query);
  const visible = q ? leads.filter((l) => norm(`${l.name} ${l.phone}`).includes(q)) : leads;

  const exportCsv = () => {
    const header = ["Nome", "Telefone", "Acessos", "Primeiro acesso", "Ultimo acesso"];
    const lines = leads.map((l) => [l.name || "", l.phone || "", l.visits, fmt(l.first_seen), fmt(l.last_seen)].map(csvCell).join(";"));
    const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `leads-qimo-bordeaux-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-light">Leads — entraram mas não são clientes</h3>
          <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
            Pessoas que <strong>abriram o guia</strong> (fizeram login) mas <strong>não constam no cadastro de Clientes</strong>.
            Útil para achar quem acessou por engano, com outro número, ou quem ainda falta cadastrar. Compara por nome e telefone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={!leads.length} className="btn-ghost !px-3 !py-2 text-[12px] disabled:opacity-40"><Icon name="Download" size={14} /> Exportar CSV</button>
          <button onClick={load} className="btn-ghost !px-3 !py-2 text-[12px]"><Icon name="ArrowRight" size={14} /> Atualizar</button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[10px] border border-dashed p-5" style={{ borderColor: "var(--line)" }}>
          <p className="flex items-start gap-2 font-sans text-[13px] text-muted">
            <Icon name="AlertTriangle" size={15} className="mt-0.5 shrink-0 text-gold-deep" />
            <span>O registro de acessos ainda não está ativo no banco (migration <strong>0005_bordeaux_visits.sql</strong>). Depois de aplicá-la, os leads aparecem aqui.</span>
          </p>
        </div>
      ) : visits === null ? (
        <p className="mt-5 text-muted">Carregando…</p>
      ) : leads.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-dashed p-6 text-center" style={{ borderColor: "var(--line)" }}>
          <Icon name="CircleCheck" size={20} className="text-olive-deep" />
          <p className="mt-2 font-sans text-[13px] text-muted">Todo mundo que entrou no guia consta no cadastro. ✅</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-gold/15 px-3 py-1 font-sans text-[12px] text-gold-deep">{leads.length} {leads.length === 1 ? "lead" : "leads"}</span>
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
                  {["Nome (no login)", "Telefone", "Acessos", "Primeiro acesso", "Último acesso", ""].map((h, i) => (
                    <th key={i} className="border-b px-4 py-2.5 font-sans text-[11px] uppercase tracking-wide2 text-muted" style={{ borderColor: "var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((l, i) => (
                  <tr key={i}>
                    <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>{l.name || "—"}</td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{l.phone || "—"}</td>
                    <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)", color: "var(--text)" }}>
                      <span className="rounded-full bg-petrol-600/10 px-2.5 py-0.5 font-semibold text-petrol-600">{l.visits}</span>
                    </td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{fmt(l.first_seen)}</td>
                    <td className="border-b px-4 py-2.5 align-top text-muted" style={{ borderColor: "var(--line)" }}>{fmt(l.last_seen)}</td>
                    <td className="border-b px-4 py-2.5 align-top" style={{ borderColor: "var(--line)" }}>
                      {done.has(keyOf(l)) ? (
                        <span className="inline-flex items-center gap-1.5 font-sans text-[12px] text-olive-deep"><Icon name="CircleCheck" size={13} /> Cadastrado</span>
                      ) : (
                        <button onClick={() => cadastrar(l)} disabled={saving === keyOf(l)} className="btn-ghost !px-3 !py-1.5 text-[12px] disabled:opacity-50">
                          <Icon name="UserPlus" size={13} /> {saving === keyOf(l) ? "…" : "Cadastrar"}
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
    </div>
  );
}
