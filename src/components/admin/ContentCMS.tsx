"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  CONTENT_KINDS, listContent, upsertContent, setPublished, deleteContent, importAllContent,
  uploadImage, updateSort, listVersions, restoreVersion,
  type ContentRow, type VersionRow,
} from "@/lib/supabase/content-admin";
import clsx from "clsx";

const LONG = 70;

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f)); } catch { alert("Falha no upload da foto."); }
    setBusy(false);
  };
  return (
    <div>
      <span className="kicker-muted">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-24 rounded-[8px] object-cover" />
        ) : (
          <div className="h-16 w-24 rounded-[8px] bg-black/5" />
        )}
        <label className="btn-ghost cursor-pointer !px-3 !py-1.5">
          <Icon name="Camera" size={14} /> {busy ? "Enviando…" : "Trocar foto"}
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </label>
        {value && <button onClick={() => onChange("")} className="font-sans text-[11px] text-muted hover:text-[#8f2f2f]">remover</button>}
      </div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL da imagem"
        className="mt-2 w-full rounded-[8px] border bg-transparent px-3 py-1.5 font-sans text-[11px] text-muted outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
    </div>
  );
}

function GalleryField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onChange([...(value || []), await uploadImage(f)]); } catch { alert("Falha no upload."); }
    setBusy(false);
  };
  return (
    <div>
      <span className="kicker-muted">galeria</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {(value || []).map((u, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-16 w-24 rounded-[8px] object-cover" />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#8f2f2f] text-white"><Icon name="X" size={11} /></button>
          </div>
        ))}
        <label className="grid h-16 w-24 cursor-pointer place-items-center rounded-[8px] border text-muted" style={{ borderColor: "var(--line)" }}>
          <Icon name={busy ? "Clock" : "Plus"} size={18} />
          <input type="file" accept="image/*" hidden onChange={add} />
        </label>
      </div>
    </div>
  );
}

function FieldEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([k, v]) => {
        if (k === "slug") return null;
        if (k === "gallery" && Array.isArray(v))
          return <GalleryField key={k} value={v as string[]} onChange={(val) => set(k, val)} />;
        if (typeof v === "string" && /image|hero|photo|foto/i.test(k))
          return <ImageField key={k} label={k} value={v} onChange={(val) => set(k, val)} />;
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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [showHist, setShowHist] = useState(false);

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

  const doRestore = async (v: VersionRow) => {
    if (!confirm("Restaurar esta versão? A versão atual será guardada no histórico.")) return;
    setBusy(true);
    await restoreVersion(v);
    setDraft(structuredClone(v.data));
    setVersions(await listVersions(v.kind, v.slug));
    setBusy(false);
    await load();
  };

  const fmtWhen = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Reordena localmente (otimista) e persiste sort = índice*10 para todos.
  const reorder = async (from: number, to: number) => {
    if (from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    await Promise.all(next.map((r, i) => (r.sort === i * 10 ? null : updateSort(r.id, i * 10))).filter(Boolean) as Promise<any>[]);
    await load();
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={busy} className="btn-primary">{busy ? "Salvando…" : "Salvar"}</button>
            <button onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
            <button onClick={() => setShowHist((v) => !v)} className="ml-auto flex items-center gap-1.5 font-sans text-[12px] text-muted hover:text-gold-deep">
              <Icon name="Clock" size={14} /> Histórico ({versions.length})
            </button>
          </div>

          {showHist && (
            <div className="mt-4 rounded-[10px] border p-4" style={{ borderColor: "var(--line)" }}>
              <p className="kicker mb-2">Histórico de versões</p>
              {versions.length === 0 ? (
                <p className="font-sans text-[12px] text-muted">Nenhuma versão anterior ainda. O histórico é criado a cada alteração salva.</p>
              ) : (
                <div className="space-y-1.5">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 py-1">
                      <Icon name="Clock" size={13} className="text-muted" />
                      <span className="min-w-0 flex-1 truncate font-sans text-[13px]" style={{ color: "var(--text)" }}>
                        {v.data?.name || v.slug}
                        {v.saved_by && <span className="text-muted"> · {v.saved_by}</span>}
                      </span>
                      <span className="shrink-0 font-sans text-[11px] text-muted">{fmtWhen(v.created_at)}</span>
                      <button onClick={() => doRestore(v)} className="btn-ghost !px-3 !py-1"><Icon name="ArrowLeft" size={12} /> Restaurar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <>
              <p className="mb-1 flex items-center gap-1.5 font-sans text-[11px] text-muted"><Icon name="GripVertical" size={12} /> Arraste os cards para reordenar como aparecem no guia.</p>
              {rows.map((r, i) => (
                <div key={r.id}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragEnter={() => setOverIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => { if (dragIdx !== null && overIdx !== null) reorder(dragIdx, overIdx); setDragIdx(null); setOverIdx(null); }}
                  onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
                  className={clsx("card flex items-center gap-3 p-4 transition-all",
                    dragIdx === i && "opacity-40",
                    overIdx === i && dragIdx !== i && "ring-2 ring-gold")}>
                  <span className="cursor-grab text-muted active:cursor-grabbing" aria-label="Arrastar"><Icon name="GripVertical" size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[17px] font-light">{label(r)}</p>
                    <p className="truncate font-sans text-[12px] text-muted">{r.data?.tagline || r.data?.subtitle || r.slug}</p>
                  </div>
                  <button onClick={() => setPublished(r.id, !r.published).then(load)}
                    className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", r.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                    <Icon name={r.published ? "Eye" : "EyeOff"} size={12} /> {r.published ? "Publicado" : "Oculto"}
                  </button>
                  <button onClick={() => { setEditing(r); setDraft(structuredClone(r.data)); setShowHist(false); listVersions(r.kind, r.slug).then(setVersions); }} className="btn-ghost !px-3 !py-1.5"><Icon name="Pencil" size={14} /> Editar</button>
                  <button onClick={() => { if (confirm(`Excluir "${label(r)}"?`)) deleteContent(r.id).then(load); }} aria-label="Excluir" className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
