"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ui } from "@/lib/i18n";
import { primaryNav, viagemLinks, descobrirLinks, maisLinks, type NavItem } from "@/lib/nav";
import { listSettings, upsertSetting } from "@/lib/supabase/content-admin";
import clsx from "clsx";

const ICON_OPTIONS = [
  "Home", "CalendarDays", "CalendarCheck", "Grape", "Heart", "Menu", "Map", "Ship", "FileText",
  "Wine", "UtensilsCrossed", "Sparkles", "ShoppingBag", "Landmark", "Bell",
  "Info", "Compass", "Star", "Camera", "MapPin", "Ticket", "BookOpen", "Coffee",
  "Users", "Globe", "Anchor", "Martini", "Navigation",
];

// Grupos de menu. Chaves repetidas (ex.: documentos, favoritos) só na 1ª ocorrência.
const seen = new Set<string>();
const GROUPS: { id: string; title: string; items: NavItem[]; showIcon: boolean }[] = [
  { id: "principal", title: "Abas principais", items: primaryNav, showIcon: true },
  { id: "viagem", title: "Menu Viagem", items: viagemLinks, showIcon: true },
  { id: "descobrir", title: "Menu Descobrir", items: descobrirLinks, showIcon: false },
  { id: "mais", title: "Menu Mais", items: maisLinks, showIcon: true },
].map((g) => ({ ...g, items: g.items.filter((it) => (seen.has(it.key) ? false : (seen.add(it.key), true))) }));

interface RowData { label: string; icon: string; hidden: boolean }

function NavRow({
  item, showIcon, initial, canUp, canDown, onMove,
}: {
  item: NavItem; showIcon: boolean; initial: RowData;
  canUp: boolean; canDown: boolean; onMove: (dir: number) => void;
}) {
  const [row, setRow] = useState<RowData>(initial);
  const [saved, setSaved] = useState(false);
  const [pick, setPick] = useState(false);

  const save = async () => {
    const jobs = [
      upsertSetting(`nav.${item.key}`, { pt: row.label }, "Menu"),
      upsertSetting(`navhide.${item.key}`, { pt: row.hidden ? "1" : "0" }, "nav"),
    ];
    if (showIcon) jobs.push(upsertSetting(`navicon.${item.key}`, { pt: row.icon }, "nav"));
    await Promise.all(jobs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleHide = async () => {
    const hidden = !row.hidden;
    setRow((r) => ({ ...r, hidden }));
    await upsertSetting(`navhide.${item.key}`, { pt: hidden ? "1" : "0" }, "nav");
  };

  return (
    <div className={clsx("card p-4 transition-opacity", row.hidden && "opacity-55")}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <button onClick={() => onMove(-1)} disabled={!canUp} title="Subir" className="text-muted hover:text-gold-deep disabled:opacity-25"><Icon name="ChevronDown" size={14} className="rotate-180" /></button>
          <button onClick={() => onMove(1)} disabled={!canDown} title="Descer" className="text-muted hover:text-gold-deep disabled:opacity-25"><Icon name="ChevronDown" size={14} /></button>
        </div>
        {showIcon && (
          <div className="relative">
            <button onClick={() => setPick((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-[10px] border text-petrol-600 transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }} title="Trocar ícone">
              <Icon name={row.icon} size={20} />
            </button>
            {pick && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setPick(false)} />
                <div className="absolute left-0 top-12 z-50 grid w-64 grid-cols-6 gap-1 rounded-[12px] border p-2 shadow-float" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} onClick={() => { setRow((r) => ({ ...r, icon: ic })); setPick(false); }}
                      className={clsx("grid h-9 w-9 place-items-center rounded-[8px] transition-colors hover:bg-cream", row.icon === ic && "bg-cream text-petrol-600")} title={ic}>
                      <Icon name={ic} size={17} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <span className="hidden w-20 shrink-0 truncate font-mono text-[11px] text-muted sm:block">nav.{item.key}</span>
        <input value={row.label} onChange={(e) => setRow((r) => ({ ...r, label: e.target.value }))}
          className="min-w-0 flex-1 rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
        <button onClick={toggleHide}
          className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px]", row.hidden ? "bg-black/5 text-muted" : "bg-olive/15 text-olive-deep")}>
          <Icon name={row.hidden ? "EyeOff" : "Eye"} size={13} /> {row.hidden ? "Oculto" : "Visível"}
        </button>
        <button onClick={save} className="btn-primary !px-4 !py-2">{saved ? "✓ Salvo" : "Salvar"}</button>
      </div>
    </div>
  );
}

export function BotoesEditor() {
  const [settings, setSettings] = useState<Record<string, { pt?: string }> | null>(null);
  const [orders, setOrders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    listSettings().then((s) => {
      setSettings(s as any);
      const init: Record<string, string[]> = {};
      GROUPS.forEach((g) => {
        const keys = g.items.map((it) => it.key);
        const csv = (s as any)[`navorder.${g.id}`]?.pt as string | undefined;
        const saved = csv ? csv.split(",").map((x) => x.trim()).filter((k) => keys.includes(k)) : [];
        init[g.id] = [...saved, ...keys.filter((k) => !saved.includes(k))];
      });
      setOrders(init);
    });
  }, []);

  if (!settings) return <p className="text-muted">Carregando…</p>;

  const rowFor = (item: NavItem): RowData => ({
    label: settings[`nav.${item.key}`]?.pt ?? (ui as any)[`nav.${item.key}`]?.pt ?? item.key,
    icon: settings[`navicon.${item.key}`]?.pt ?? item.icon,
    hidden: settings[`navhide.${item.key}`]?.pt === "1",
  });

  const move = (groupId: string, index: number, dir: number) => {
    setOrders((prev) => {
      const arr = [...(prev[groupId] || [])];
      const to = index + dir;
      if (to < 0 || to >= arr.length) return prev;
      [arr[index], arr[to]] = [arr[to], arr[index]];
      upsertSetting(`navorder.${groupId}`, { pt: arr.join(",") }, "nav");
      return { ...prev, [groupId]: arr };
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker mb-1">Botões & Menu</p>
        <p className="max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
          Configure cada botão do guia: <strong>ordem</strong> (setas ↑/↓), <strong>nome</strong>, <strong>ícone</strong> e <strong>visibilidade</strong>.
          As mudanças aparecem no site em instantes, sem republicar.
        </p>
      </div>
      {GROUPS.map((g) => {
        const order = orders[g.id] || g.items.map((it) => it.key);
        const byKey = new Map(g.items.map((it) => [it.key, it]));
        return (
          <div key={g.id}>
            <p className="kicker mb-3">{g.title}</p>
            <div className="space-y-2">
              {order.map((key, idx) => {
                const item = byKey.get(key);
                if (!item) return null;
                return (
                  <NavRow key={key} item={item} showIcon={g.showIcon} initial={rowFor(item)}
                    canUp={idx > 0} canDown={idx < order.length - 1}
                    onMove={(dir) => move(g.id, idx, dir)} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
