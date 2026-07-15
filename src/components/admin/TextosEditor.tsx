"use client";

import { useEffect, useState } from "react";
import { EDITABLE_LABELS, ui } from "@/lib/i18n";
import { listSettings, upsertSetting } from "@/lib/supabase/content-admin";
import clsx from "clsx";

const FEATURED_GROUPS = [
  { name: "Menu", icon: "Menu", hint: "abas e navegacao" },
  { name: "Compartilhamento do link", icon: "Link", hint: "titulo e descricao do WhatsApp" },
  { name: "Tela de entrada", icon: "Smartphone", hint: "primeiro acesso do hospede" },
  { name: "ProgramaÃ§Ã£o", icon: "CalendarDays", hint: "botoes do roteiro" },
  { name: "Restaurantes", icon: "Utensils", hint: "titulos, filtros e chamadas" },
  { name: "Documentos", icon: "FileText", hint: "aviso e botoes" },
];

export function TextosEditor() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await listSettings();
      const v: Record<string, string> = {};
      EDITABLE_LABELS.forEach(({ key }) => { v[key] = s[key]?.pt ?? (ui as any)[key]?.pt ?? key; });
      setVals(v);
      setLoading(false);
    })();
  }, []);

  const save = async (key: string, grp: string) => {
    await upsertSetting(key, { pt: vals[key] }, grp);
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  const groups = [...new Set(EDITABLE_LABELS.map((l) => l.grp))];
  const normalizedQuery = query.trim().toLowerCase();
  const labels = EDITABLE_LABELS.filter(({ key, grp }) => {
    if (activeGroup && grp !== activeGroup) return false;
    if (!normalizedQuery) return true;
    const value = vals[key] || (ui as any)[key]?.pt || "";
    return `${grp} ${key} ${value}`.toLowerCase().includes(normalizedQuery);
  });
  const visibleGroups = groups.filter((group) => labels.some((label) => label.grp === group));
  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <div className="space-y-8">
      <div className="rounded-[14px] border p-4" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">Menus e textos</p>
            <h2 className="font-serif text-2xl font-light">Qual texto voce quer editar?</h2>
            <p className="mt-1 font-sans text-[12px] text-muted">As mudancas aparecem no site em instantes, sem republicar. EN/ES seguem a traducao automatica.</p>
          </div>
          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-full border bg-white/40 px-4 py-2.5 sm:max-w-md" style={{ borderColor: "var(--line)" }}>
            <span className="font-sans text-[12px] text-muted">Buscar</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="menu, botao, restaurante..."
              className="w-full bg-transparent font-sans text-[13px] outline-none placeholder:text-muted" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURED_GROUPS.map((group) => {
            const selected = activeGroup === group.name;
            return (
              <button
                key={group.name}
                onClick={() => setActiveGroup(selected ? null : group.name)}
                className={clsx(
                  "rounded-[12px] border p-4 text-left transition-colors hover:border-gold",
                  selected ? "bg-petrol-600 text-cream" : "bg-white/35"
                )}
                style={{ borderColor: selected ? "transparent" : "var(--line)" }}
              >
                <span className="block font-serif text-xl font-light">{group.name}</span>
                <span className={clsx("mt-1 block font-sans text-[12px]", selected ? "text-cream/75" : "text-muted")}>{group.hint}</span>
              </button>
            );
          })}
        </div>
        {(activeGroup || normalizedQuery) && (
          <button onClick={() => { setActiveGroup(null); setQuery(""); }} className="mt-3 font-sans text-[12px] text-muted hover:text-gold-deep">Mostrar todos os textos</button>
        )}
      </div>
      <p className="hidden max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
        Edite os nomes dos botões e itens de menu. As mudanças aparecem no site em instantes, <strong>sem republicar</strong>.
        Os idiomas EN/ES são traduzidos automaticamente a partir do texto em português.
      </p>
      {visibleGroups.length === 0 && (
        <div className="card p-6 text-center font-sans text-[13px] text-muted">Nenhum texto encontrado para esta busca.</div>
      )}
      {visibleGroups.map((g) => (
        <div key={g}>
          <p className="kicker mb-3">{g}</p>
          <div className="space-y-2">
            {labels.filter((l) => l.grp === g).map(({ key, grp }) => (
              <div key={key} className="card flex items-center gap-3 p-3">
                <span className="hidden w-32 shrink-0 truncate font-sans text-[11px] text-muted sm:block">{key.replace(/^.*\./, "")}</span>
                <input value={vals[key] || ""} onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
                  className="flex-1 rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
                <button onClick={() => save(key, grp)} className="btn-ghost !px-3 !py-1.5">
                  {saved === key ? "✓ Salvo" : "Salvar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
