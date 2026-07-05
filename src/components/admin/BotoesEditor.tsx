"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ui } from "@/lib/i18n";
import { primaryNav } from "@/lib/nav";
import { listSettings, upsertSetting } from "@/lib/supabase/content-admin";
import clsx from "clsx";

const ICON_OPTIONS = [
  "Home", "CalendarDays", "Grape", "Heart", "Menu", "Map", "Ship", "FileText",
  "Wine", "UtensilsCrossed", "Sparkles", "ShoppingBag", "Landmark", "Bell",
  "Info", "Compass", "Star", "Camera", "MapPin", "Ticket", "BookOpen", "Coffee",
  "Users", "Globe", "Anchor", "Martini", "Navigation",
];

interface Row { key: string; label: string; icon: string; hidden: boolean }

export function BotoesEditor() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [iconPickFor, setIconPickFor] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await listSettings();
      setRows(primaryNav.map((item) => ({
        key: item.key,
        label: s[`nav.${item.key}`]?.pt ?? (ui as any)[`nav.${item.key}`]?.pt ?? item.key,
        icon: s[`navicon.${item.key}`]?.pt ?? item.icon,
        hidden: s[`navhide.${item.key}`]?.pt === "1",
      })));
      setLoading(false);
    })();
  }, []);

  const patch = (key: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const saveRow = async (row: Row) => {
    await Promise.all([
      upsertSetting(`nav.${row.key}`, { pt: row.label }, "Menu"),
      upsertSetting(`navicon.${row.key}`, { pt: row.icon }, "nav"),
      upsertSetting(`navhide.${row.key}`, { pt: row.hidden ? "1" : "0" }, "nav"),
    ]);
    setSavedKey(row.key);
    setTimeout(() => setSavedKey(null), 1500);
  };

  const toggleHide = async (row: Row) => {
    const next = { ...row, hidden: !row.hidden };
    patch(row.key, { hidden: next.hidden });
    await upsertSetting(`navhide.${row.key}`, { pt: next.hidden ? "1" : "0" }, "nav");
  };

  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <p className="kicker mb-1">Barra de navegação</p>
      <p className="mb-4 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
        Configure as 5 abas principais do guia: <strong>nome</strong>, <strong>ícone</strong> e <strong>visibilidade</strong>.
        As mudanças aparecem no site em instantes, sem republicar.
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className={clsx("card p-4 transition-opacity", row.hidden && "opacity-55")}>
            <div className="flex flex-wrap items-center gap-3">
              {/* Ícone atual + picker */}
              <div className="relative">
                <button onClick={() => setIconPickFor(iconPickFor === row.key ? null : row.key)}
                  className="grid h-11 w-11 place-items-center rounded-[10px] border text-petrol-600 transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }}
                  title="Trocar ícone">
                  <Icon name={row.icon} size={20} />
                </button>
                {iconPickFor === row.key && (
                  <>
                    <button className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setIconPickFor(null)} />
                    <div className="absolute left-0 top-12 z-50 grid w-64 grid-cols-6 gap-1 rounded-[12px] border p-2 shadow-float" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
                      {ICON_OPTIONS.map((ic) => (
                        <button key={ic} onClick={() => { patch(row.key, { icon: ic }); setIconPickFor(null); }}
                          className={clsx("grid h-9 w-9 place-items-center rounded-[8px] transition-colors hover:bg-cream", row.icon === ic && "bg-cream text-petrol-600")}
                          title={ic}>
                          <Icon name={ic} size={17} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <span className="hidden w-24 shrink-0 truncate font-mono text-[11px] text-muted sm:block">nav.{row.key}</span>
              <input value={row.label} onChange={(e) => patch(row.key, { label: e.target.value })}
                className="min-w-0 flex-1 rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />

              <button onClick={() => toggleHide(row)}
                className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px]", row.hidden ? "bg-black/5 text-muted" : "bg-olive/15 text-olive-deep")}>
                <Icon name={row.hidden ? "EyeOff" : "Eye"} size={13} /> {row.hidden ? "Oculto" : "Visível"}
              </button>

              <button onClick={() => saveRow(row)} className="btn-primary !px-4 !py-2">
                {savedKey === row.key ? "✓ Salvo" : "Salvar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
