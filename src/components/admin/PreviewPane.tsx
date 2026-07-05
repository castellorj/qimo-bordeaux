"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { updateContentField } from "@/lib/supabase/content-admin";
import clsx from "clsx";

const DEVICES = [
  { key: "mobile", label: "Mobile", icon: "Smartphone", w: 390 },
  { key: "tablet", label: "Tablet", icon: "Tablet", w: 768 },
  { key: "desktop", label: "Desktop", icon: "Monitor", w: 0 },
] as const;

const ROUTES = [
  { path: "/", label: "Início" },
  { path: "/programacao", label: "Programação" },
  { path: "/cidades", label: "Cidades" },
  { path: "/cidades/bordeaux", label: "· Bordeaux (detalhe)" },
  { path: "/vinicolas", label: "Vinícolas" },
  { path: "/restaurantes", label: "Restaurantes" },
  { path: "/vinhos", label: "Vinhos" },
  { path: "/experiencias", label: "Experiências" },
];

interface EditTarget {
  kind: string; slug: string; field: string; label: string;
  value: string | string[]; isArray: boolean; multiline: boolean;
}

export function PreviewPane() {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("mobile");
  const [route, setRoute] = useState("/cidades/bordeaux");
  const [editMode, setEditMode] = useState(true);
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [undo, setUndo] = useState<{ kind: string; slug: string; field: string; prev: string | string[]; label: string } | null>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  const dev = DEVICES.find((d) => d.key === device)!;

  const src = (p: string) => (editMode ? `${p}${p.includes("?") ? "&" : "?"}qimoedit=1` : p);
  const reload = () => { if (ref.current) ref.current.src = src(route); };

  // Recebe cliques em campos editáveis vindos do guia (dentro do iframe).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source !== "qimo-guide") return;
      const d = e.data as any;
      if (d.type === "edit-field") {
        setTarget({ kind: d.kind, slug: d.slug, field: d.field, label: d.label, value: d.value, isArray: !!d.isArray, multiline: !!d.multiline });
        setDraft(Array.isArray(d.value) ? d.value.join("\n") : String(d.value ?? ""));
      } else if (d.type === "reorder-section") {
        updateContentField(d.kind, d.slug, "sectionOrder", d.order).then(() => {
          ref.current?.contentWindow?.postMessage({ source: "qimo-admin", type: "qimo-refresh" }, "*");
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const refreshGuide = () => ref.current?.contentWindow?.postMessage({ source: "qimo-admin", type: "qimo-refresh" }, "*");

  const save = async () => {
    if (!target) return;
    setSaving(true);
    const val = target.isArray ? draft.split("\n").map((s) => s.trim()).filter(Boolean) : draft;
    await updateContentField(target.kind, target.slug, target.field, val);
    refreshGuide();
    setSaving(false);
    setUndo({ kind: target.kind, slug: target.slug, field: target.field, prev: target.value, label: target.label });
    setTarget(null);
  };

  const doUndo = async () => {
    if (!undo) return;
    await updateContentField(undo.kind, undo.slug, undo.field, undo.prev);
    refreshGuide();
    setUndo(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {DEVICES.map((d) => (
            <button key={d.key} onClick={() => setDevice(d.key)}
              className={clsx("flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] transition-colors",
                device === d.key ? "border-gold text-gold-deep" : "text-muted hover:text-petrol-600")}
              style={{ borderColor: device === d.key ? undefined : "var(--line)" }}>
              <Icon name={d.icon} size={14} /> {d.label}
            </button>
          ))}
          <button onClick={() => { setEditMode((v) => { const nv = !v; if (ref.current) ref.current.src = nv ? `${route}${route.includes("?") ? "&" : "?"}qimoedit=1` : route; return nv; }); }}
            className={clsx("ml-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] transition-colors",
              editMode ? "border-petrol-600 bg-petrol-600 text-white" : "text-muted hover:text-petrol-600")}
            style={{ borderColor: editMode ? undefined : "var(--line)" }}>
            <Icon name="Pencil" size={13} /> {editMode ? "Editando" : "Modo edição"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={route} onChange={(e) => { setRoute(e.target.value); if (ref.current) ref.current.src = editMode ? `${e.target.value}${e.target.value.includes("?") ? "&" : "?"}qimoedit=1` : e.target.value; }}
            className="rounded-full border bg-transparent px-3 py-1.5 font-sans text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            {ROUTES.map((r) => <option key={r.path} value={r.path}>{r.label}</option>)}
          </select>
          <button onClick={reload} className="btn-ghost !px-3 !py-1.5"><Icon name="ArrowRight" size={13} /> Recarregar</button>
        </div>
      </div>

      {editMode ? (
        <div className="mt-3 rounded-[10px] bg-petrol-600/10 px-4 py-3">
          <p className="flex items-center gap-2 font-sans text-[13px] font-medium text-petrol-600"><Icon name="Pencil" size={14} /> Você está editando o guia de verdade — tudo salva na hora.</p>
          <ul className="mt-1.5 space-y-0.5 font-sans text-[12px] text-petrol-600/90">
            <li>• <strong>Clique em qualquer texto tracejado</strong> para editá-lo.</li>
            <li>• Use as setas <strong>↑ / ↓</strong> no canto das seções para <strong>reordená-las</strong>.</li>
          </ul>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 rounded-[10px] bg-black/[0.04] px-4 py-2.5 font-sans text-[12px] text-muted">
          <Icon name="Eye" size={13} /> Apenas visualizando. Ligue o <strong>Modo edição</strong> acima para clicar e editar.
        </p>
      )}

      <div className={clsx("mt-4 grid gap-4", target ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
        <div className="grid place-items-center rounded-[16px] bg-black/[0.03] p-4 sm:p-6">
          <div className="overflow-hidden rounded-[20px] border bg-white shadow-lg transition-all"
            style={{ width: dev.w ? dev.w : "100%", maxWidth: "100%", borderColor: "var(--line)" }}>
            <iframe ref={ref} src={src(route)} title="Pré-visualização do guia" className="block w-full border-0"
              style={{ height: device === "desktop" ? 720 : 760 }} />
          </div>
        </div>

        {target && (
          <div className="card h-fit p-5 lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <p className="kicker">Editar campo</p>
              <button onClick={() => setTarget(null)} className="text-muted hover:text-gold-deep"><Icon name="X" size={16} /></button>
            </div>
            <p className="mt-2 font-serif text-lg font-light">{target.label}</p>
            <p className="font-sans text-[11px] text-muted">{target.kind} · {target.slug}</p>
            {target.multiline ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={target.isArray ? 6 : 8}
                className="mt-3 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm leading-relaxed outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            ) : (
              <input value={draft} onChange={(e) => setDraft(e.target.value)}
                className="mt-3 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            )}
            {target.isArray && <p className="mt-1 font-sans text-[11px] text-muted">Um item por linha.</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "Salvando…" : "Salvar"}</button>
              <button onClick={() => setTarget(null)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-center font-sans text-[11px] text-muted">
        As edições aparecem no guia em tempo real — o painel recarrega o conteúdo automaticamente ao salvar.
      </p>

      {undo && (
        <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2.5 shadow-float"
          style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <Icon name="CircleCheck" size={16} className="text-olive-deep" />
          <span className="font-sans text-[13px]">“{undo.label}” salvo</span>
          <button onClick={doUndo} className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-petrol-600 hover:text-petrol-500">
            <Icon name="ArrowLeft" size={14} /> Desfazer
          </button>
          <button onClick={() => setUndo(null)} className="text-muted hover:text-gold-deep"><Icon name="X" size={15} /></button>
        </div>
      )}
    </div>
  );
}
