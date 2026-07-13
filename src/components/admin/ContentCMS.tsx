"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import {
  CONTENT_KINDS, listContent, upsertContent, setPublished, deleteContent, importAllContent,
  uploadImage, updateSort, listVersions, restoreVersion, kindSkeleton,
  type ContentRow, type VersionRow,
} from "@/lib/supabase/content-admin";
import { getContentKindConfig, getFieldConfig, sortContentFields } from "@/lib/adminContentRegistry";
import clsx from "clsx";

const LONG = 70;

// Rótulos amigáveis (PT) — o usuário nunca vê o nome técnico do campo.
const FIELD_LABELS: Record<string, string> = {
  name: "Nome", slug: "Identificador", heroImage: "Foto de capa", gallery: "Galeria de fotos",
  tagline: "Chamada (uma frase)", description: "Descrição", history: "História", region: "Região",
  category: "Categoria", qimoSelect: "Seleção QIMO (selo)", visitedOnDays: "Visitada nos dias",
  coords: "Coordenadas", bestTimes: "Melhores horários", localWines: "Vinhos locais",
  toDo: "O que fazer", photoSpots: "Onde fotografar", curiosities: "Curiosidades",
  restaurants: "Restaurantes", cafes: "Cafés", shops: "Compras",
  appellation: "Denominação", classification: "Classificação", terroir: "Terroir", grapes: "Castas",
  production: "Produção", family: "Proprietários", icons: "Vinhos icônicos", whatToTaste: "O que provar",
  whatToBuy: "O que comprar", scores: "Notas da crítica", averagePrice: "Preço médio",
  visitHours: "Horário de visita", dressCode: "Traje", bookingChannel: "Canal de reserva",
  bookingUrl: "Link de reserva", phone: "Telefone", website: "Site", address: "Endereço",
  email: "E-mail", instagram: "Instagram",
  bank: "Margem", color: "Cor", profile: "Perfil sensorial", pairings: "Harmonizações",
  topProducers: "Principais produtores", serveTemp: "Temperatura de serviço", aging: "Potencial de guarda",
  qimoNote: "Nota QIMO",
  city: "Cidade", chef: "Chef", specialty: "Especialidade", averageTicket: "Ticket médio",
  menuUrl: "Cardápio (link)", days: "Funcionamento", reservationRequired: "Reserva recomendada",
  stars: "Estrelas / distinção",
  whereToTry: "Onde provar", pairing: "Harmonização",
  duration: "Duração", location: "Local", relatedDay: "Dia relacionado", venueUrl: "Site do local",
  whereToBuy: "Onde comprar", priceRange: "Faixa de preço", taxFree: "Tax Free",
  sectionOrder: "Ordem das seções",
};
// Dicas curtas sob alguns campos.
const FIELD_HINTS: Record<string, string> = {
  tagline: "Uma frase curta que aparece sobre a foto.",
  qimoSelect: "Mostra o selo “Seleção QIMO” no card.",
  bookingUrl: "Link oficial de reserva (TheFork, OpenTable ou site próprio).",
  address: "Endereço exato — usado no botão “Como chegar”.",
  heroImage: "Foto grande do topo. Horizontal 16:9 · ~1600×900 px.",
  gallery: "Fotos horizontais, largura mínima ~1200 px.",
  sectionOrder: "Avançado — normalmente ajuste arrastando em “Editar no site”.",
};
function labelFor(k: string): string {
  return FIELD_LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function ImageField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
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
      {hint && <span className="mb-1 block font-sans text-[11px] normal-case tracking-normal text-muted">{hint}</span>}
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

function CoordsField({ label, hint, value, onChange }: { label: string; hint?: string; value: any; onChange: (v: any) => void }) {
  const lat = typeof value?.lat === "number" ? value.lat : "";
  const lng = typeof value?.lng === "number" ? value.lng : "";
  const setCoord = (key: "lat" | "lng", nextValue: string) => {
    onChange({
      ...(value && typeof value === "object" ? value : {}),
      [key]: nextValue === "" ? "" : Number(nextValue),
    });
  };

  return (
    <div>
      <span className="kicker-muted">{label}</span>
      {hint && <span className="mb-1 block font-sans text-[11px] text-muted">{hint}</span>}
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="number" value={lat} onChange={(e) => setCoord("lat", e.target.value)} placeholder="Latitude"
          className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
        <input type="number" value={lng} onChange={(e) => setCoord("lng", e.target.value)} placeholder="Longitude"
          className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
      </div>
    </div>
  );
}

// Editor de objeto aninhado (ex.: informações práticas, notas) — um formulário
// por sub-campo, no lugar de JSON cru. Nesting profundo cai para JSON.
function ObjectField({ label, hint, value, onChange }: { label: string; hint?: string; value: any; onChange: (v: any) => void }) {
  const obj = value && typeof value === "object" ? value : {};
  const set = (k: string, val: any) => onChange({ ...obj, [k]: val });
  const entries = Object.entries(obj);
  return (
    <div className="rounded-[8px] border p-3" style={{ borderColor: "var(--line)" }}>
      <span className="kicker-muted">{label}</span>
      {hint && <span className="mb-1 block font-sans text-[11px] text-muted">{hint}</span>}
      <div className="mt-2 space-y-3">
        {entries.length === 0 && <p className="font-sans text-[12px] text-muted">Sem sub-campos.</p>}
        {entries.map(([k, v]) => {
          const lbl = labelFor(k);
          if (typeof v === "boolean") {
            return (
              <label key={k} className="flex items-center gap-2 font-sans text-[13px]">
                <input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked)} /> {lbl}
              </label>
            );
          }
          if (typeof v === "number") {
            return (
              <label key={k} className="block">
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{lbl}</span>
                <input type="number" value={v} onChange={(e) => set(k, parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              </label>
            );
          }
          if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
            return (
              <label key={k} className="block">
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{lbl} <span className="normal-case">(um por linha)</span></span>
                <textarea value={(v as string[]).join("\n")} onChange={(e) => set(k, e.target.value.split("\n").filter(Boolean))} rows={Math.min(6, Math.max(2, v.length))}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              </label>
            );
          }
          if (v && typeof v === "object") {
            return (
              <label key={k} className="block">
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{lbl} <span className="normal-case">(avançado · JSON)</span></span>
                <textarea defaultValue={JSON.stringify(v, null, 2)} rows={4} onBlur={(e) => { try { set(k, JSON.parse(e.target.value)); } catch {} }}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              </label>
            );
          }
          const long = typeof v === "string" && v.length > LONG;
          return (
            <label key={k} className="block">
              <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{lbl}</span>
              {long ? (
                <textarea value={v as string} onChange={(e) => set(k, e.target.value)} rows={3}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              ) : (
                <input value={(v as string) || ""} onChange={(e) => set(k, e.target.value)}
                  className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FieldEditor({ kind, data, onChange }: { kind: string; data: any; onChange: (d: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const fields = sortContentFields(kind, data)
    .map(([k, v]) => {
      const field = getFieldConfig(kind, k, v);
      const fieldLabel = field.label || labelFor(k);
      const fieldHint = field.hint || FIELD_HINTS[k];
      let node: ReactNode;

      if (k === "slug") return null;
      if (k === "gallery" && Array.isArray(v)) {
        node = <GalleryField key={k} value={v as string[]} onChange={(val) => set(k, val)} />;
      } else if (field.type === "coords") {
        node = <CoordsField key={k} label={fieldLabel} hint={fieldHint} value={v} onChange={(val) => set(k, val)} />;
      } else if (typeof v === "string" && /image|hero|photo|foto/i.test(k)) {
        node = <ImageField key={k} label={fieldLabel} hint={fieldHint} value={v} onChange={(val) => set(k, val)} />;
      } else if (typeof v === "boolean") {
        node = (
          <label key={k} className="flex items-center gap-2 font-sans text-[13px]">
            <input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked)} /> {fieldLabel}
            {fieldHint && <span className="font-sans text-[11px] text-muted">- {fieldHint}</span>}
          </label>
        );
      } else if (typeof v === "number") {
        node = (
          <label key={k} className="block">
            <span className="kicker-muted">{fieldLabel}</span>
            {fieldHint && <span className="mb-1 block font-sans text-[11px] text-muted">{fieldHint}</span>}
            <input type="number" value={v} onChange={(e) => set(k, parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          </label>
        );
      } else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
        node = (
          <label key={k} className="block">
            <span className="kicker-muted">{fieldLabel} <span className="normal-case tracking-normal">(um por linha)</span></span>
            {fieldHint && <span className="mb-1 block font-sans text-[11px] text-muted">{fieldHint}</span>}
            <textarea value={(v as string[]).join("\n")} onChange={(e) => set(k, e.target.value.split("\n").filter(Boolean))}
              rows={Math.min(8, Math.max(2, v.length))}
              className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          </label>
        );
      } else if (typeof v === "string") {
        node = (
          <label key={k} className="block">
            <span className="kicker-muted">{fieldLabel}</span>
            {fieldHint && <span className="mb-1 block font-sans text-[11px] text-muted">{fieldHint}</span>}
            {v.length > LONG ? (
              <textarea value={v} onChange={(e) => set(k, e.target.value)} rows={Math.min(8, Math.ceil(v.length / 60))}
                className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm leading-relaxed outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            ) : (
              <input value={v} onChange={(e) => set(k, e.target.value)}
                className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            )}
          </label>
        );
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        node = <ObjectField key={k} label={fieldLabel} hint={fieldHint} value={v} onChange={(val) => set(k, val)} />;
      } else {
        node = (
          <label key={k} className="block">
            <span className="kicker-muted">{fieldLabel} <span className="normal-case tracking-normal">(avancado · JSON)</span></span>
            {fieldHint && <span className="mb-1 block font-sans text-[11px] text-muted">{fieldHint}</span>}
            <textarea defaultValue={JSON.stringify(v, null, 2)} rows={5}
              onBlur={(e) => { try { set(k, JSON.parse(e.target.value)); } catch {} }}
              className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
          </label>
        );
      }

      return { key: k, section: field.section || "Conteudo", node };
    })
    .filter(Boolean) as Array<{ key: string; section: string; node: ReactNode }>;
  const sections = fields.reduce<Record<string, typeof fields>>((acc, field) => {
    acc[field.section] = [...(acc[field.section] || []), field];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(sections).map(([section, sectionFields]) => (
        <section key={section} className="rounded-[10px] border p-4" style={{ borderColor: "var(--line)" }}>
          <p className="kicker mb-4">{section}</p>
          <div className="space-y-4">
            {sectionFields.map((field) => <div key={field.key}>{field.node}</div>)}
          </div>
        </section>
      ))}
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
  const [query, setQuery] = useState("");
  const kindConfig = getContentKindConfig(kind);

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

  const createContent = async () => {
    setBusy(true); setMsg("");
    const slug = `nova-ficha-${kind}-${Date.now().toString(36)}`;
    // Nasce com TODOS os campos do tipo (esqueleto), não só nome/foto/descrição.
    const data = {
      ...kindSkeleton(kind),
      slug,
      name: `Nova ficha de ${kindConfig?.label || "conteúdo"}`,
    };
    await upsertContent(kind, slug, data, rows.length * 10 + 10, false);
    const nextRows = await listContent(kind);
    setRows(nextRows);
    const created = nextRows.find((row) => row.slug === slug);
    if (created) await openEditor(created);
    setMsg("Ficha criada como oculta. Revise o conteúdo antes de publicar.");
    setBusy(false);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await upsertContent(editing.kind, editing.slug, draft, editing.sort, editing.published);
    setBusy(false); setEditing(null); await load();
  };

  const openEditor = async (row: ContentRow) => {
    setEditing(row);
    // Revela campos faltantes do tipo (o registro pode ter vindo sem campos opcionais).
    setDraft({ ...kindSkeleton(row.kind), ...structuredClone(row.data) });
    setShowHist(false);
    setVersions(await listVersions(row.kind, row.slug));
  };

  const togglePublished = async (row: ContentRow) => {
    await setPublished(row.id, !row.published);
    await load();
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
  const rowIndex = (r: ContentRow) => rows.findIndex((row) => row.id === r.id);
  const normalizedQuery = query.trim().toLowerCase();
  const publishedCount = rows.filter((row) => row.published).length;
  const visibleRows = normalizedQuery
    ? rows.filter((row) => {
        const haystack = [
          label(row),
          row.slug,
          row.data?.tagline,
          row.data?.subtitle,
          row.data?.category,
          row.data?.city,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : rows;

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
        <div className="flex flex-wrap gap-2">
          <button onClick={createContent} disabled={busy} className="btn-primary !px-4 !py-2">
            <Icon name="Plus" size={14} /> Nova ficha
          </button>
          <button onClick={doImport} disabled={busy} className="btn-ghost !px-4 !py-2">
            <Icon name="Download" size={14} /> Importar conteúdo do guia
          </button>
        </div>
      </div>
      {kindConfig && (
        <div className="mt-4 rounded-[10px] border px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="kicker-muted">{kindConfig.label}</p>
              <p className="mt-1 font-sans text-[12px] text-muted">{kindConfig.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 font-sans text-[11px]">
              <span className="rounded-full bg-black/5 px-3 py-1">{rows.length} itens</span>
              <span className="rounded-full bg-olive/15 px-3 py-1 text-olive-deep">{publishedCount} publicados</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-muted">{rows.length - publishedCount} ocultos</span>
            </div>
          </div>
        </div>
      )}
      {msg && <p className="mt-3 font-sans text-[12px] text-olive-deep">{msg}</p>}

      {editing ? (
        <div className="mt-6 card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {draft?.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.heroImage} alt="" className="h-20 w-28 shrink-0 rounded-[10px] object-cover" />
              ) : (
                <div className="grid h-20 w-28 shrink-0 place-items-center rounded-[10px] bg-black/5 text-muted">
                  <Icon name="Image" size={20} />
                </div>
              )}
              <div className="min-w-0">
                <p className="kicker-muted">Editando ficha</p>
                <h3 className="truncate font-serif text-xl font-light">{label(editing)}</h3>
                <p className="mt-1 truncate font-sans text-[12px] text-muted">{editing.slug}</p>
                <span className={clsx("mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", editing.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                  <Icon name={editing.published ? "Eye" : "EyeOff"} size={12} /> {editing.published ? "Publicado" : "Oculto"}
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(null)} className="shrink-0 text-muted hover:text-gold-deep"><Icon name="X" size={18} /></button>
          </div>
          <div className="mt-5">
            <FieldEditor kind={editing.kind} data={draft} onChange={setDraft} />
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
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 font-sans text-[11px] text-muted"><Icon name="GripVertical" size={12} /> Arraste os cards para reordenar como aparecem no guia.</p>
                <label className="flex min-w-[240px] items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: "var(--line)" }}>
                  <Icon name="Search" size={14} className="text-muted" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ficha"
                    className="w-full bg-transparent font-sans text-[12px] outline-none placeholder:text-muted" />
                </label>
              </div>
              {visibleRows.length === 0 && (
                <div className="card p-6 text-center font-sans text-[13px] text-muted">
                  Nenhuma ficha encontrada para esta busca.
                </div>
              )}
              {visibleRows.map((r) => (
                <div key={r.id}
                  draggable
                  onDragStart={() => setDragIdx(rowIndex(r))}
                  onDragEnter={() => setOverIdx(rowIndex(r))}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => { if (dragIdx !== null && overIdx !== null) reorder(dragIdx, overIdx); setDragIdx(null); setOverIdx(null); }}
                  onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) reorder(dragIdx, rowIndex(r)); setDragIdx(null); setOverIdx(null); }}
                  className={clsx("card flex items-center gap-3 p-4 transition-all",
                    dragIdx === rowIndex(r) && "opacity-40",
                    overIdx === rowIndex(r) && dragIdx !== rowIndex(r) && "ring-2 ring-gold")}>
                  <span className="cursor-grab text-muted active:cursor-grabbing" aria-label="Arrastar"><Icon name="GripVertical" size={16} /></span>
                  {r.data?.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.data.heroImage} alt="" className="h-11 w-16 shrink-0 rounded-[8px] object-cover" />
                  ) : (
                    <div className="h-11 w-16 shrink-0 rounded-[8px] bg-black/5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[17px] font-light">{label(r)}</p>
                    <p className="truncate font-sans text-[12px] text-muted">{r.data?.tagline || r.data?.subtitle || r.slug}</p>
                  </div>
                  <button onClick={() => togglePublished(r)}
                    className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px]", r.published ? "bg-olive/15 text-olive-deep" : "bg-black/5 text-muted")}>
                    <Icon name={r.published ? "EyeOff" : "Eye"} size={12} /> {r.published ? "Ocultar" : "Publicar"}
                  </button>
                  <button onClick={() => openEditor(r)} className="btn-ghost !px-3 !py-1.5"><Icon name="Pencil" size={14} /> Editar</button>
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
