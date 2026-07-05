"use client";

import React from "react";
import { useEditMode } from "@/components/GuideContent";
import { Icon } from "@/components/Icon";

/**
 * Envolve uma seção reordenável de uma página. No site normal é transparente
 * (apenas um wrapper). No modo edição (preview do painel), mostra controles
 * ↑/↓ que avisam o painel para salvar a nova ordem das seções.
 */
export function Section({
  kind, slug, sectionKey, order, className, children,
}: {
  kind: string;
  slug: string;
  sectionKey: string;
  order: string[];
  className?: string;
  children: React.ReactNode;
}) {
  const editMode = useEditMode();
  if (!editMode) return <div className={className}>{children}</div>;

  const idx = order.indexOf(sectionKey);
  const move = (dir: number) => {
    const to = idx + dir;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [m] = next.splice(idx, 1);
    next.splice(to, 0, m);
    window.parent?.postMessage({ source: "qimo-guide", type: "reorder-section", kind, slug, order: next }, "*");
  };

  return (
    <div className={className} style={{ position: "relative", outline: "1.5px dashed rgba(139,58,74,.35)", outlineOffset: 8, borderRadius: 2 }}>
      <div style={{ position: "absolute", top: -13, right: 0, display: "flex", gap: 4, zIndex: 6 }}>
        <button onClick={() => move(-1)} disabled={idx <= 0} title="Mover para cima"
          style={{ display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 999, background: "#8b3a4a", color: "#fff", opacity: idx <= 0 ? 0.35 : 1, border: "none", cursor: idx <= 0 ? "default" : "pointer" }}>
          <Icon name="ChevronDown" size={14} className="rotate-180" />
        </button>
        <button onClick={() => move(1)} disabled={idx >= order.length - 1} title="Mover para baixo"
          style={{ display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 999, background: "#8b3a4a", color: "#fff", opacity: idx >= order.length - 1 ? 0.35 : 1, border: "none", cursor: idx >= order.length - 1 ? "default" : "pointer" }}>
          <Icon name="ChevronDown" size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}
