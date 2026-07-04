"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  CONTENT_KINDS, listContent, upsertContent, setPublished, deleteContent, importAllContent,
  type ContentRow,
} from "@/lib/supabase/content-admin";
import clsx from "clsx";

const LONG = 70;

function FieldEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([k, v]) => {
        if (k === "slug") return null;
        if (typeof v === "boolean")
          return (
            <label key={k} className="flex items-center gap-2 font-sans text-[13px]">
              <input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked)} /> {k}
            </label>
          );
        if (typeof v === "number")
          return (
            <label key={k} className="block">
              <span className="kicker-muted">{k}</span>
              <input type="number" value={v} onChange={(e) => set(k, parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
          );
        if (Array.isArray(v) && v.every((x) => typeof x === "string"))
          return (
            <label key={k} className="block">
              <span className="kicker-muted">{k} <span className="normal-case tracking-normal">(um por linha)</span></span>
              <textarea value={(v as string[]).join("\n")} onChange={(e) => set(k, e.target.value.split("\n").filter(Boolean))}
                rows={Math.min(8, Math.max(2, v.length))}
                className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            </label>
          );
        if (typeof v === "string")
          return (
            <label key={k} className="block">
              <span className="kicker-muted">{k}</span>
              {v.length > LONG ? (
                <textarea value={v} onChange={(e) => set(k, e.target.value)} rows={Math.min(8, Math.ceil(v.length / 60))}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm leading-relaxed outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              ) : (
                <input value={v} onChange={(e) => set(k, e.target.value)}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              )}
            </label>
          );
        // objetos/arrays complexos → JSON
        return (
          <label key={k} className="block">
            <span className="kicker-muted">{k} <span className="normal-case tracking-normal">(JSON)</span></span>
            <textarea defaultValue={JSON.stringify(v, null, 2)} rows={5}
              onBlur={(e) => { try { set(k, JSON.parse(e.target.value)); } catch {} }}
              className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          </label>
        );
      })}
    </div>
  );
}

export function ContentCMS() {
  const [kind, setKind] = useState<string>("city");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setRows(await listContent(kind)); setLoading(false);
  }, [kind]);
  useEffect(() => { load(); setEditing(null); }, [load]);

  const doImport = async () => {
    setBusy(true); setMsg("");
    const { inserted } = await importAllContent();
    setMsg(`Importados/atualizados ${inserted} itens.`);
    await load(); setBusy(false);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await upsertContent(editing.kind, editing.slug, draft, editing.sort, editing.published);
    setBusy(false); setEditing(null); await load();
  };

  const label = (r: ContentRow) => r.data?.name || r.slug;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {CONTENT_KINDS.map((c) => (
            <button key={c.kind} onClick={() => setKind(c.kind)}
              className={clsx("shrink-0 rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors",
                kind === c.kind ? "border-gold text-gold-deep" : "text-muted hover:text-petrol-600")}
              style={{ borderColor: kind === c.kind ? undefined : "var(--line)" }}>
              {c.label}
            </button>
          ))}
        </div>
        <button onClick={doImport} disabled={busy} className="btn-ghost !px-4 !py-2">
          <Icon name="Download" size={14} /> Importar conteúdo do guia
        </button>
      </div>
      {msg && <p className="mt-3 font-sans text-[12px] text-olive-deep">{msg}</p>}

      {editing ? (
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-light">Editar · {label(editing)}</h3>
            <button onClick={() => setEditing(null)} className="text-muted hover:text-gold-deep"><Icon name="X" size={18} /></button>
          </div>
          <div className="mt-5">
            <FieldEditor data={draft} onChange={setDraft} />
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={save} disabled={busy} className="btn-primary">{busy ? "Salvando…" : "Salvar"}</button>
            <button onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {loading ? (
            <p className="text-muted">Carregando…</p>
          ) : rows.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-sans text-[14px] text-muted">Nenhum item deste tipo no banco ainda.</p>
              <button onClick={doImport} disabled={busy} className="btn-primary mt-4">Importar conteúdo do guia</button>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[17px] font-light">{label(r)}</p>
                  <p className="truncate font-sans text-[12px] text-muted">{r.data?.tagline || r.data?.subtitle || r.slug}</p>
                </div>
                <button onClick={() => setPublished(r.id, !r.published).then(load)}
                  className={clsx("rounded-full px-3 py-1 font-sans text-[11px]", r.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                  {r.published ? "Publicado" : "Oculto"}
                </button>
                <button onClick={() => { setEditing(r); setDraft(structuredClone(r.data)); }} className="btn-ghost !px-3 !py-1.5"><Icon name="FileText" size={14} /> Editar</button>
                <button onClick={() => deleteContent(r.id).then(load)} aria-label="Excluir" className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
