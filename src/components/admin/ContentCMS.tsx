"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  CONTENT_KINDS, listContent, upsertContent, setPublished, deleteContent, importAllContent,
  uploadImage, updateSort,
  type ContentRow,
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

  const move = async (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    await Promise.all([updateSort(a.id, b.sort), updateSort(b.id, a.sort)]);
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
            rows.map((r, i) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir" className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={14} className="rotate-180" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Descer" className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={14} /></button>
                </div>
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
