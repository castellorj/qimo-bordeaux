"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { BlockRenderer } from "@/components/BlockRenderer";
import { BLOCK_LIBRARY, newBlock, type Block, type BlockType } from "@/lib/blocks";
import {
  listPages, createPage, savePage, setPagePublished, deletePage,
  uploadImage, type PageRow,
} from "@/lib/supabase/content-admin";
import clsx from "clsx";

/* ---------- inputs ---------- */
function TextInput({ label, value, onChange, area }: { label: string; value?: string; onChange: (v: string) => void; area?: boolean }) {
  return (
    <label className="block">
      <span className="kicker-muted">{label}</span>
      {area ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={4}
          className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm leading-relaxed outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
      )}
    </label>
  );
}
function ImageInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); try { onChange(await uploadImage(f)); } catch { alert("Falha no upload."); } setBusy(false);
  };
  return (
    <div>
      <span className="kicker-muted">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? <img src={value} alt="" className="h-14 w-20 rounded-[8px] object-cover" /> : <div className="h-14 w-20 rounded-[8px] bg-black/5" />}
        <label className="btn-ghost cursor-pointer !px-3 !py-1.5"><Icon name="Camera" size={14} /> {busy ? "Enviando…" : "Foto"}<input type="file" accept="image/*" hidden onChange={onFile} /></label>
      </div>
    </div>
  );
}

/* ---------- editor de um bloco ---------- */
function BlockFields({ b, onChange }: { b: Block; onChange: (b: Block) => void }) {
  const set = (p: Partial<Block>) => onChange({ ...b, ...p });
  const [busy, setBusy] = useState(false);
  const addImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); try { set({ images: [...(b.images || []), await uploadImage(f)] }); } catch { alert("Falha."); } setBusy(false);
  };
  switch (b.type) {
    case "banner":
      return (<div className="space-y-3"><TextInput label="Título" value={b.title} onChange={(v) => set({ title: v })} /><TextInput label="Subtítulo" value={b.subtitle} onChange={(v) => set({ subtitle: v })} /><ImageInput label="Foto de fundo" value={b.image} onChange={(v) => set({ image: v })} /></div>);
    case "heading":
      return (<div className="space-y-3"><TextInput label="Antetítulo (kicker)" value={b.kicker} onChange={(v) => set({ kicker: v })} /><TextInput label="Título" value={b.text} onChange={(v) => set({ text: v })} /></div>);
    case "text":
      return <TextInput label="Texto" value={b.body} onChange={(v) => set({ body: v })} area />;
    case "image":
      return (<div className="space-y-3"><ImageInput label="Imagem" value={b.url} onChange={(v) => set({ url: v })} /><TextInput label="Legenda" value={b.caption} onChange={(v) => set({ caption: v })} /></div>);
    case "gallery":
      return (
        <div>
          <span className="kicker-muted">Fotos</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {(b.images || []).map((u, i) => (
              <div key={i} className="relative"><img src={u} alt="" className="h-14 w-20 rounded-[8px] object-cover" /><button onClick={() => set({ images: (b.images || []).filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#8f2f2f] text-white"><Icon name="X" size={11} /></button></div>
            ))}
            <label className="grid h-14 w-20 cursor-pointer place-items-center rounded-[8px] border text-muted" style={{ borderColor: "var(--line)" }}><Icon name={busy ? "Clock" : "Plus"} size={16} /><input type="file" accept="image/*" hidden onChange={addImg} /></label>
          </div>
        </div>
      );
    case "list":
      return (<div className="space-y-3"><TextInput label="Título" value={b.title} onChange={(v) => set({ title: v })} /><label className="block"><span className="kicker-muted">Itens (um por linha)</span><textarea value={(b.items || []).join("\n")} onChange={(e) => set({ items: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} /></label></div>);
    case "button":
      return (<div className="space-y-3"><TextInput label="Texto do botão" value={b.label} onChange={(v) => set({ label: v })} /><TextInput label="Link (URL ou /rota)" value={b.href} onChange={(v) => set({ href: v })} /><label className="block"><span className="kicker-muted">Estilo</span><select value={b.style || "primary"} onChange={(e) => set({ style: e.target.value as any })} className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}><option value="primary">Destaque</option><option value="ghost">Discreto</option></select></label></div>);
    case "divider":
      return <p className="font-sans text-[12px] text-muted">Linha divisória (sem opções).</p>;
    default:
      return null;
  }
}

/* ---------- construtor principal ---------- */
export function PagesBuilder() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<PageRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [openBlock, setOpenBlock] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setPages(await listPages()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => { const p = await createPage(); if (p) { await load(); setDraft(p); } };
  const save = async () => { if (!draft) return; setBusy(true); await savePage(draft); setBusy(false); await load(); };

  const setBlocks = (blocks: Block[]) => setDraft((d) => (d ? { ...d, blocks } : d));
  const addBlock = (type: BlockType) => draft && setBlocks([...draft.blocks, newBlock(type)]);
  const updateBlock = (id: string, nb: Block) => draft && setBlocks(draft.blocks.map((b) => (b.id === id ? nb : b)));
  const removeBlock = (id: string) => draft && setBlocks(draft.blocks.filter((b) => b.id !== id));
  const moveBlock = (i: number, dir: number) => {
    if (!draft) return;
    const j = i + dir; if (j < 0 || j >= draft.blocks.length) return;
    const next = [...draft.blocks];[next[i], next[j]] = [next[j], next[i]]; setBlocks(next);
  };

  /* -------- editor de página -------- */
  if (draft) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setDraft(null)} className="btn-ghost !px-3 !py-1.5"><Icon name="ArrowLeft" size={14} /> Todas as páginas</button>
          <div className="flex items-center gap-2">
            <a href={`/paginas?p=${draft.slug}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5"><Icon name="Eye" size={14} /> Abrir no guia</a>
            <button onClick={() => setDraft({ ...draft, published: !draft.published })}
              className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[12px]", draft.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
              <Icon name={draft.published ? "Eye" : "EyeOff"} size={13} /> {draft.published ? "Publicada" : "Rascunho"}
            </button>
            <button onClick={save} disabled={busy} className="btn-primary !px-5 !py-2">{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Coluna: composição */}
          <div>
            <div className="card p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="Título da página" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
                <TextInput label="Endereço (slug)" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })} />
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">/paginas?p={draft.slug}</p>
            </div>

            <div className="mt-4 space-y-3">
              {draft.blocks.length === 0 && <p className="card p-6 text-center font-sans text-[13px] text-muted">Nenhum bloco ainda. Adicione blocos abaixo. 👇</p>}
              {draft.blocks.map((b, i) => {
                const lib = BLOCK_LIBRARY.find((l) => l.type === b.type);
                const open = openBlock === b.id;
                return (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-petrol-600/10 text-petrol-600"><Icon name={lib?.icon || "FileText"} size={15} /></span>
                      <button onClick={() => setOpenBlock(open ? null : b.id)} className="min-w-0 flex-1 text-left">
                        <p className="font-serif text-[16px] font-light">{lib?.label}</p>
                        <p className="truncate font-sans text-[12px] text-muted">{b.title || b.text || b.body || b.label || b.caption || `${(b.items || b.images || []).length} itens`}</p>
                      </button>
                      <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={15} className="rotate-180" /></button>
                      <button onClick={() => moveBlock(i, 1)} disabled={i === draft.blocks.length - 1} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={15} /></button>
                      <button onClick={() => removeBlock(b.id)} className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
                    </div>
                    {open && <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--line)" }}><BlockFields b={b} onChange={(nb) => updateBlock(b.id, nb)} /></div>}
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="kicker mb-2">Adicionar bloco</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_LIBRARY.map((l) => (
                  <button key={l.type} onClick={() => addBlock(l.type)} title={l.hint}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] text-muted transition-colors hover:border-gold hover:text-petrol-600" style={{ borderColor: "var(--line)" }}>
                    <Icon name={l.icon} size={14} /> {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna: preview ao vivo */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="kicker mb-2">Pré-visualização</p>
            <div className="overflow-hidden rounded-[16px] border bg-paper" style={{ borderColor: "var(--line)" }}>
              <div className="max-h-[70vh] overflow-y-auto py-6">
                {draft.blocks.length ? <BlockRenderer blocks={draft.blocks} /> : <p className="px-6 text-center font-sans text-[13px] text-muted">Adicione blocos para ver aqui.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------- lista de páginas -------- */
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker">Construtor de páginas</p>
          <p className="max-w-xl font-sans text-[13px] text-muted">Crie páginas novas montando blocos — sem código. Publique e elas aparecem no guia na hora.</p>
        </div>
        <button onClick={create} className="btn-primary !px-4 !py-2"><Icon name="Plus" size={15} /> Nova página</button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? <p className="text-muted">Carregando…</p> : pages.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-sans text-[14px] text-muted">Nenhuma página criada ainda.</p>
            <button onClick={create} className="btn-primary mt-4"><Icon name="Plus" size={15} /> Criar primeira página</button>
          </div>
        ) : (
          pages.map((p, i) => (
            <div key={p.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-petrol-600/10 text-petrol-600"><Icon name={p.icon || "FileText"} size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[17px] font-light">{p.title}</p>
                <p className="truncate font-mono text-[11px] text-muted">/paginas?p={p.slug} · {p.blocks?.length || 0} blocos</p>
              </div>
              <button onClick={() => setPagePublished(p.id, !p.published).then(load)}
                className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", p.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                <Icon name={p.published ? "Eye" : "EyeOff"} size={12} /> {p.published ? "Publicada" : "Rascunho"}
              </button>
              <button onClick={() => setDraft(p)} className="btn-ghost !px-3 !py-1.5"><Icon name="Pencil" size={14} /> Editar</button>
              <button onClick={() => { if (confirm(`Excluir "${p.title}"?`)) deletePage(p.id).then(load); }} className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
