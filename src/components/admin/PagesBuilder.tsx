"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { BlockRenderer } from "@/components/BlockRenderer";
import {
  BLOCK_LIBRARY,
  cloneBlock,
  newBlock,
  type Block,
  type BlockButton,
  type BlockCard,
  type BlockFaq,
  type BlockType,
} from "@/lib/blocks";
import {
  listPages, createPage, savePage, setPagePublished, deletePage,
  uploadImage, type PageRow,
} from "@/lib/supabase/content-admin";
import clsx from "clsx";

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

function SelectInput({ label, value, onChange, options }: { label: string; value?: string | number; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="kicker-muted">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ImageInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f)); } catch { alert("Falha no upload."); }
    setBusy(false);
  };
  return (
    <div>
      <span className="kicker-muted">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? <img src={value} alt="" className="h-14 w-20 rounded-[8px] object-cover" /> : <div className="h-14 w-20 rounded-[8px] bg-black/5" />}
        <label className="btn-ghost cursor-pointer !px-3 !py-1.5"><Icon name="Camera" size={14} /> {busy ? "Enviando..." : "Foto"}<input type="file" accept="image/*" hidden onChange={onFile} /></label>
      </div>
    </div>
  );
}

function ListEditor<T>({ label, items, empty, render, onChange }: {
  label: string;
  items: T[];
  empty: T;
  render: (item: T, setItem: (item: T) => void) => ReactNode;
  onChange: (items: T[]) => void;
}) {
  const setItem = (index: number, item: T) => onChange(items.map((current, i) => (i === index ? item : current)));
  const move = (index: number, dir: number) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };
  return (
    <div>
      <span className="kicker-muted">{label}</span>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="rounded-[10px] border p-3" style={{ borderColor: "var(--line)" }}>
            <div className="mb-2 flex justify-end gap-1">
              <button onClick={() => move(index, -1)} disabled={index === 0} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={14} className="rotate-180" /></button>
              <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={14} /></button>
              <button onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={14} /></button>
            </div>
            {render(item, (next) => setItem(index, next))}
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, structuredClone(empty)])} className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-semibold text-petrol-600 hover:text-petrol-500">
        <Icon name="Plus" size={14} /> Adicionar
      </button>
    </div>
  );
}

function BlockFields({ b, onChange }: { b: Block; onChange: (b: Block) => void }) {
  const set = (p: Partial<Block>) => onChange({ ...b, ...p });
  const [busy, setBusy] = useState(false);
  const addImg = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); try { set({ images: [...(b.images || []), await uploadImage(f)] }); } catch { alert("Falha."); } setBusy(false);
  };
  const changeType = (type: string) => {
    if (type === b.type) return;
    const next = newBlock(type as BlockType);
    onChange({ ...next, id: b.id, width: b.width, align: b.align, tone: b.tone, spacing: b.spacing });
  };
  const numberOptions = (max: number) => Array.from({ length: max }, (_, i) => String(i + 1)).map((value) => ({ value, label: value }));

  const content = (() => {
    switch (b.type) {
      case "banner":
        return <div className="space-y-3"><TextInput label="Titulo" value={b.title} onChange={(title) => set({ title })} /><TextInput label="Subtitulo" value={b.subtitle} onChange={(subtitle) => set({ subtitle })} /><ImageInput label="Foto de fundo" value={b.image} onChange={(image) => set({ image })} /></div>;
      case "heading":
        return <div className="space-y-3"><TextInput label="Antetitulo" value={b.kicker} onChange={(kicker) => set({ kicker })} /><TextInput label="Titulo" value={b.text} onChange={(text) => set({ text })} /></div>;
      case "text":
        return <TextInput label="Texto" value={b.body} onChange={(body) => set({ body })} area />;
      case "image":
        return <div className="space-y-3"><ImageInput label="Imagem" value={b.url} onChange={(url) => set({ url })} /><TextInput label="Legenda / alt text" value={b.caption} onChange={(caption) => set({ caption })} /></div>;
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
        return <div className="space-y-3"><TextInput label="Titulo" value={b.title} onChange={(title) => set({ title })} /><label className="block"><span className="kicker-muted">Itens (um por linha)</span><textarea value={(b.items || []).join("\n")} onChange={(e) => set({ items: e.target.value.split("\n").filter(Boolean) })} rows={4} className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} /></label></div>;
      case "button":
        return <div className="space-y-3"><TextInput label="Texto do botao" value={b.label} onChange={(label) => set({ label })} /><TextInput label="Link" value={b.href} onChange={(href) => set({ href })} /><SelectInput label="Estilo" value={b.style || "primary"} onChange={(style) => set({ style: style as any })} options={[{ value: "primary", label: "Destaque" }, { value: "ghost", label: "Discreto" }]} /></div>;
      case "cta":
        return (
          <div className="space-y-3">
            <TextInput label="Antetitulo" value={b.kicker} onChange={(kicker) => set({ kicker })} />
            <TextInput label="Titulo" value={b.title} onChange={(title) => set({ title })} />
            <TextInput label="Texto" value={b.body} onChange={(body) => set({ body })} area />
            <ListEditor<BlockButton> label="Botoes" items={b.buttons || []} empty={{ label: "Botao", href: "", style: "primary" }} onChange={(buttons) => set({ buttons })}
              render={(button, setButton) => <div className="grid gap-2 sm:grid-cols-[1fr_1fr_130px]"><TextInput label="Texto" value={button.label} onChange={(label) => setButton({ ...button, label })} /><TextInput label="Link" value={button.href} onChange={(href) => setButton({ ...button, href })} /><SelectInput label="Estilo" value={button.style || "primary"} onChange={(style) => setButton({ ...button, style: style as any })} options={[{ value: "primary", label: "Destaque" }, { value: "ghost", label: "Discreto" }]} /></div>}
            />
          </div>
        );
      case "cards":
        return (
          <div className="space-y-3">
            <TextInput label="Titulo da grade" value={b.title} onChange={(title) => set({ title })} />
            <ListEditor<BlockCard> label="Cards" items={b.cards || []} empty={{ title: "Novo card", text: "", icon: "Sparkles", href: "" }} onChange={(cards) => set({ cards })}
              render={(card, setCard) => <div className="space-y-2"><div className="grid gap-2 sm:grid-cols-2"><TextInput label="Titulo" value={card.title} onChange={(title) => setCard({ ...card, title })} /><TextInput label="Icone" value={card.icon} onChange={(icon) => setCard({ ...card, icon })} /></div><TextInput label="Texto" value={card.text} onChange={(text) => setCard({ ...card, text })} area /><div className="grid gap-2 sm:grid-cols-2"><ImageInput label="Imagem opcional" value={card.image} onChange={(image) => setCard({ ...card, image })} /><TextInput label="Link opcional" value={card.href} onChange={(href) => setCard({ ...card, href })} /></div></div>}
            />
          </div>
        );
      case "faq":
        return (
          <div className="space-y-3">
            <TextInput label="Titulo" value={b.title} onChange={(title) => set({ title })} />
            <ListEditor<BlockFaq> label="Perguntas" items={b.faqs || []} empty={{ q: "Pergunta", a: "Resposta." }} onChange={(faqs) => set({ faqs })}
              render={(faq, setFaq) => <div className="space-y-2"><TextInput label="Pergunta" value={faq.q} onChange={(q) => setFaq({ ...faq, q })} /><TextInput label="Resposta" value={faq.a} onChange={(a) => setFaq({ ...faq, a })} area /></div>}
            />
          </div>
        );
      case "video":
        return <div className="space-y-3"><TextInput label="Titulo" value={b.title} onChange={(title) => set({ title })} /><TextInput label="Link do video" value={b.videoUrl} onChange={(videoUrl) => set({ videoUrl })} /><ImageInput label="Poster opcional" value={b.poster} onChange={(poster) => set({ poster })} /></div>;
      case "spacer":
        return <p className="font-sans text-[12px] text-muted">Use o campo de espacamento para criar respiro entre secoes.</p>;
      case "divider":
        return <p className="font-sans text-[12px] text-muted">Linha divisoria.</p>;
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-5">
      <div className="rounded-[10px] border p-3" style={{ borderColor: "var(--line)" }}>
        <p className="kicker-muted mb-3">Estrutura e layout</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectInput label="Tipo de bloco" value={b.type} onChange={changeType} options={BLOCK_LIBRARY.map((item) => ({ value: item.type, label: item.label }))} />
          <SelectInput label="Largura" value={b.width || "normal"} onChange={(width) => set({ width: width as any })} options={[{ value: "normal", label: "Padrao" }, { value: "narrow", label: "Estreita" }, { value: "wide", label: "Larga" }, { value: "full", label: "Tela cheia" }]} />
          <SelectInput label="Alinhamento" value={b.align || "left"} onChange={(align) => set({ align: align as any })} options={[{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }]} />
          <SelectInput label="Tema" value={b.tone || "default"} onChange={(tone) => set({ tone: tone as any })} options={[{ value: "default", label: "Padrao" }, { value: "soft", label: "Fundo suave" }, { value: "dark", label: "Escuro" }]} />
          <SelectInput label="Espacamento" value={b.spacing || "normal"} onChange={(spacing) => set({ spacing: spacing as any })} options={[{ value: "compact", label: "Compacto" }, { value: "normal", label: "Normal" }, { value: "spacious", label: "Amplo" }]} />
          <div className="grid grid-cols-3 gap-2">
            <SelectInput label="Desk" value={String(b.columnsDesktop || 3)} onChange={(v) => set({ columnsDesktop: Number(v) })} options={numberOptions(4)} />
            <SelectInput label="Tablet" value={String(b.columnsTablet || 2)} onChange={(v) => set({ columnsTablet: Number(v) })} options={numberOptions(3)} />
            <SelectInput label="Mobile" value={String(b.columnsMobile || 1)} onChange={(v) => set({ columnsMobile: Number(v) })} options={numberOptions(2)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 font-sans text-[12px] text-muted">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!b.hideDesktop} onChange={(e) => set({ hideDesktop: e.target.checked })} /> Ocultar desktop</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!b.hideTablet} onChange={(e) => set({ hideTablet: e.target.checked })} /> Ocultar tablet</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!b.hideMobile} onChange={(e) => set({ hideMobile: e.target.checked })} /> Ocultar mobile</label>
        </div>
      </div>
      <div className="rounded-[10px] border p-3" style={{ borderColor: "var(--line)" }}>
        <p className="kicker-muted mb-3">Conteudo</p>
        {content}
      </div>
    </div>
  );
}

const PAGE_TEMPLATES: { key: string; label: string; blocks: Block[] }[] = [
  { key: "blank", label: "Em branco", blocks: [] },
  { key: "landing", label: "Landing page", blocks: [newBlock("banner"), newBlock("text"), newBlock("cards"), newBlock("cta"), newBlock("faq")] },
  { key: "guide", label: "Guia simples", blocks: [newBlock("heading"), newBlock("text"), newBlock("gallery"), newBlock("list"), newBlock("button")] },
];

function cloneBlocks(blocks: Block[]) {
  return blocks.map((block) => cloneBlock(block));
}

function pageCopyTitle(title: string) {
  return `${title || "Pagina"} - copia`;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function uniqueSlug(base: string) {
  return `${slugify(base) || "pagina"}-${Date.now().toString(36).slice(-5)}`;
}

function pageSummary(page: PageRow) {
  return `${page.blocks?.length || 0} bloco(s)`;
}

function DevicePreview({ draft }: { draft: PageRow }) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const width = device === "mobile" ? "max-w-[390px]" : device === "tablet" ? "max-w-[720px]" : "max-w-full";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="kicker">Pre-visualizacao</p>
        <div className="flex rounded-full border p-1" style={{ borderColor: "var(--line)" }}>
          {(["desktop", "tablet", "mobile"] as const).map((item) => (
            <button key={item} onClick={() => setDevice(item)}
              className={clsx("grid h-7 w-8 place-items-center rounded-full text-muted", device === item && "bg-petrol-600 text-cream")}
              title={item}>
              <Icon name={item === "desktop" ? "Monitor" : item === "tablet" ? "Tablet" : "Smartphone"} size={14} />
            </button>
          ))}
        </div>
      </div>
      <div className={clsx("mx-auto overflow-hidden rounded-[16px] border bg-paper transition-all", width)} style={{ borderColor: "var(--line)" }}>
        <div className="max-h-[70vh] overflow-y-auto py-4">
          {draft.blocks.length ? <BlockRenderer blocks={draft.blocks} /> : <p className="px-6 text-center font-sans text-[13px] text-muted">Adicione blocos para ver aqui.</p>}
        </div>
      </div>
    </div>
  );
}

export function PagesBuilder() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<PageRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [template, setTemplate] = useState("blank");

  const load = useCallback(async () => { setLoading(true); setPages(await listPages()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const p = await createPage();
    if (!p) return;
    const picked = PAGE_TEMPLATES.find((item) => item.key === template) || PAGE_TEMPLATES[0];
    const next = { ...p, blocks: cloneBlocks(picked.blocks), title: picked.key === "blank" ? p.title : picked.label };
    await savePage(next);
    await load();
    setDraft(next);
  };
  const save = async () => { if (!draft) return; setBusy(true); await savePage(draft); setBusy(false); await load(); };
  const duplicatePage = async (page: PageRow) => {
    const p = await createPage();
    if (!p) return;
    const copy = { ...p, title: pageCopyTitle(page.title), slug: uniqueSlug(page.slug), icon: page.icon, blocks: cloneBlocks(page.blocks || []), published: false };
    await savePage(copy);
    await load();
    setDraft(copy);
  };

  const setBlocks = (blocks: Block[]) => setDraft((d) => (d ? { ...d, blocks } : d));
  const addBlock = (type: BlockType) => draft && setBlocks([...draft.blocks, newBlock(type)]);
  const updateBlock = (id: string, nb: Block) => draft && setBlocks(draft.blocks.map((b) => (b.id === id ? nb : b)));
  const removeBlock = (id: string) => draft && setBlocks(draft.blocks.filter((b) => b.id !== id));
  const duplicateBlock = (index: number) => {
    if (!draft) return;
    const next = [...draft.blocks];
    next.splice(index + 1, 0, cloneBlock(next[index]));
    setBlocks(next);
  };
  const moveBlock = (i: number, dir: number) => {
    if (!draft) return;
    const j = i + dir; if (j < 0 || j >= draft.blocks.length) return;
    const next = [...draft.blocks]; [next[i], next[j]] = [next[j], next[i]]; setBlocks(next);
  };

  if (draft) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setDraft(null)} className="btn-ghost !px-3 !py-1.5"><Icon name="ArrowLeft" size={14} /> Todas as paginas</button>
          <div className="flex items-center gap-2">
            <a href={`/paginas?p=${draft.slug}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5"><Icon name="Eye" size={14} /> Abrir no guia</a>
            <button onClick={() => setDraft({ ...draft, published: !draft.published })}
              className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[12px]", draft.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
              <Icon name={draft.published ? "Eye" : "EyeOff"} size={13} /> {draft.published ? "Publicada" : "Rascunho"}
            </button>
            <button onClick={save} disabled={busy} className="btn-primary !px-5 !py-2">{busy ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="card p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextInput label="Titulo da pagina" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
                <TextInput label="Endereco (slug)" value={draft.slug} onChange={(slug) => setDraft({ ...draft, slug: slugify(slug) })} />
                <TextInput label="Icone" value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">/paginas?p={draft.slug}</p>
            </div>

            <div className="mt-4 space-y-3">
              {draft.blocks.length === 0 && <p className="card p-6 text-center font-sans text-[13px] text-muted">Nenhum bloco ainda. Adicione blocos abaixo.</p>}
              {draft.blocks.map((b, i) => {
                const lib = BLOCK_LIBRARY.find((l) => l.type === b.type);
                const open = openBlock === b.id;
                return (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-petrol-600/10 text-petrol-600"><Icon name={lib?.icon || "FileText"} size={15} /></span>
                      <button onClick={() => setOpenBlock(open ? null : b.id)} className="min-w-0 flex-1 text-left">
                        <p className="font-serif text-[16px] font-light">{lib?.label || b.type}</p>
                        <p className="truncate font-sans text-[12px] text-muted">{b.title || b.text || b.body || b.label || b.caption || `${(b.items || b.images || b.cards || b.faqs || []).length} item(ns)`}</p>
                      </button>
                      <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={15} className="rotate-180" /></button>
                      <button onClick={() => moveBlock(i, 1)} disabled={i === draft.blocks.length - 1} className="text-muted hover:text-gold-deep disabled:opacity-30"><Icon name="ChevronDown" size={15} /></button>
                      <button onClick={() => duplicateBlock(i)} className="text-muted hover:text-gold-deep" title="Duplicar bloco"><Icon name="Copy" size={15} /></button>
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

          <div className="lg:sticky lg:top-4 lg:self-start">
            <DevicePreview draft={draft} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Construtor de paginas</p>
          <p className="max-w-xl font-sans text-[13px] text-muted">Crie paginas por blocos, ajuste estrutura, responsivo, ordem e publicacao sem codigo.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <SelectInput label="Modelo" value={template} onChange={setTemplate} options={PAGE_TEMPLATES.map((item) => ({ value: item.key, label: item.label }))} />
          <button onClick={create} className="btn-primary !px-4 !py-2"><Icon name="Plus" size={15} /> Nova pagina</button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? <p className="text-muted">Carregando...</p> : pages.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-sans text-[14px] text-muted">Nenhuma pagina criada ainda.</p>
            <button onClick={create} className="btn-primary mt-4"><Icon name="Plus" size={15} /> Criar primeira pagina</button>
          </div>
        ) : (
          pages.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-petrol-600/10 text-petrol-600"><Icon name={p.icon || "FileText"} size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[17px] font-light">{p.title}</p>
                <p className="truncate font-mono text-[11px] text-muted">/paginas?p={p.slug} - {pageSummary(p)}</p>
              </div>
              <button onClick={() => setPagePublished(p.id, !p.published).then(load)}
                className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", p.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                <Icon name={p.published ? "Eye" : "EyeOff"} size={12} /> {p.published ? "Publicada" : "Rascunho"}
              </button>
              <button onClick={() => duplicatePage(p)} className="btn-ghost !px-3 !py-1.5"><Icon name="Copy" size={14} /> Duplicar</button>
              <button onClick={() => setDraft(p)} className="btn-ghost !px-3 !py-1.5"><Icon name="Pencil" size={14} /> Editar</button>
              <button onClick={() => { if (confirm(`Excluir "${p.title}"?`)) deletePage(p.id).then(load); }} className="text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
