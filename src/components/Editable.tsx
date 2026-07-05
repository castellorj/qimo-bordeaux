"use client";

import React from "react";
import { useEditMode } from "@/components/GuideContent";

/**
 * Envolve um campo de conteúdo. No site normal é totalmente transparente.
 * Dentro do preview do painel (modo edição), destaca no hover e, ao clicar,
 * avisa o painel para abrir o editor daquele campo.
 */
export function Editable({
  kind, slug, field, value, label, multiline = false,
  as: Tag = "span", className, style, children,
}: {
  kind: string;
  slug: string;
  field: string;
  value: string | string[];
  label?: string;
  multiline?: boolean;
  as?: any;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const editMode = useEditMode();
  if (!editMode) {
    return <Tag className={className} style={style}>{children}</Tag>;
  }
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.parent?.postMessage({
      source: "qimo-guide", type: "edit-field",
      kind, slug, field, value, label: label || field, multiline: multiline || Array.isArray(value),
      isArray: Array.isArray(value),
    }, "*");
  };
  return (
    <Tag
      className={className}
      onClick={onClick}
      style={{ ...style, cursor: "pointer", outline: "1.5px dashed rgba(139,58,74,.5)", outlineOffset: 3, borderRadius: 2 }}
      data-qimo-editable
      title={`Editar: ${label || field}`}
    >
      {children}
    </Tag>
  );
}
