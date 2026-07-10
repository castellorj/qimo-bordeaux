"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { conciergeContacts as BASE } from "@/content";
import {
  uploadImage, upsertSetting, listSettings,
  upsertContent, listContent, deleteContent, setPublished, updateSort,
  type ContentRow,
} from "@/lib/supabase/content-admin";
import type { ConciergeContact } from "@/lib/types";
import clsx from "clsx";

const CONTACT_TYPES = [
  { v: "whatsapp", l: "WhatsApp" }, { v: "call", l: "Ligação" }, { v: "emergency", l: "Emergência" },
  { v: "maps", l: "Mapa / endereço" }, { v: "link", l: "Link / site" }, { v: "info", l: "Informação" },
];
const CONTACT_ICONS = ["MessageCircle", "Phone", "Siren", "Ambulance", "Shield", "Cross", "Landmark", "MapPin", "Globe", "Mail", "Info", "Bell", "Navigation", "Coins", "Car"];

/* Telas cujas fotos de fundo podem ser trocadas (chave em bordeaux_settings) */
const SCREENS = [
  { key: "img.hero.viagem", label: "Tela Viagem (entrada)", hint: "A primeira tela que o cliente vê.", def: "/photos/hero-dordogne-sunset.jpg" },
  { key: "img.hero.hoje", label: "Tela Hoje", hint: "Foto de fundo da saudação.", def: "/photos/hero-bordeaux.jpg" },
];

export function TelasConcierge() {
  return (
    <div className="space-y-10">
      <ScreenPhotos />
      <div className="hairline" />
      <ConciergeContactsEditor />
    </div>
  );
}

/* -------------------- Fotos das telas -------------------- */
function ScreenPhotos() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSettings().then((s) => {
      const v: Record<string, string> = {};
      SCREENS.forEach((sc) => (v[sc.key] = s[sc.key]?.pt || ""));
      setVals(v);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h3 className="font-serif text-xl font-light">Fotos das telas</h3>
      <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
        Troque a foto de fundo das telas principais. A mudança aparece no guia em instantes, <strong>sem republicar</strong>.
      </p>
      {loading ? (
        <p className="mt-4 text-muted">Carregando…</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SCREENS.map((sc) => (
            <ScreenPhotoCard key={sc.key} sc={sc} current={vals[sc.key]}
              onChange={(url) => setVals((v) => ({ ...v, [sc.key]: url }))} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenPhotoCard({ sc, current, onChange }: {
  sc: (typeof SCREENS)[number]; current: string; onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = current || sc.def;

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      await upsertSetting(sc.key, { pt: url }, "Fotos");
      onChange(url); flash();
    } catch { alert("Não foi possível enviar a foto. Tente novamente."); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = async () => {
    setBusy(true);
    await upsertSetting(sc.key, { pt: "" }, "Fotos");
    onChange(""); flash(); setBusy(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[16/9] bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shown} alt={sc.label} className="h-full w-full object-cover" />
        {busy && <div className="absolute inset-0 grid place-items-center bg-black/40 font-sans text-[12px] text-white">Enviando…</div>}
      </div>
      <div className="p-4">
        <p className="font-serif text-[17px] font-light">{sc.label}</p>
        <p className="font-sans text-[12px] text-muted">{sc.hint}{!current && " · foto padrão"}</p>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary !px-4 !py-2 text-[12px]">
            <Icon name="Image" size={14} /> Trocar foto
          </button>
          {current && (
            <button onClick={reset} disabled={busy} className="btn-ghost !px-3 !py-2 text-[12px]">Restaurar padrão</button>
          )}
          {saved && <span className="font-sans text-[12px] text-olive-deep">✓ Salvo</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
      </div>
    </div>
  );
}

/* -------------------- Concierge: contatos (CRUD completo) -------------------- */
function ConciergeContactsEditor() {
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    let r = await listContent("concierge");
    // Semente: na primeira vez, importa os contatos do código para o banco,
    // para que a equipe possa editar/ocultar/excluir/incluir livremente.
    if (!r.length) {
      setSeeding(true);
      for (let i = 0; i < BASE.length; i++) {
        await upsertContent("concierge", BASE[i].slug, BASE[i], i * 10, true);
      }
      r = await listContent("concierge");
      setSeeding(false);
    }
    setRows(r);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addNew = async () => {
    const slug = "contato-" + Math.random().toString(36).slice(2, 7);
    const sort = (rows?.reduce((m, r) => Math.max(m, r.sort), 0) ?? 0) + 10;
    await upsertContent("concierge", slug, { slug, label: "Novo contato", type: "call", value: "", hint: "", icon: "Phone" }, sort, true);
    load();
  };

  const move = async (idx: number, dir: number) => {
    if (!rows) return;
    const a = rows[idx], b = rows[idx + dir];
    if (!a || !b) return;
    await Promise.all([updateSort(a.id, b.sort), updateSort(b.id, a.sort)]);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-light">Concierge — contatos</h3>
          <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
            Edite, oculte, exclua, reordene e adicione contatos do balão e da página Concierge. Salva na hora, <strong>sem republicar</strong>.
          </p>
        </div>
        <button onClick={addNew} className="btn-primary !px-4 !py-2 text-[12px]"><Icon name="Plus" size={14} /> Adicionar contato</button>
      </div>

      {rows === null ? (
        <p className="mt-4 text-muted">{seeding ? "Preparando contatos…" : "Carregando…"}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row, idx) => (
            <ContactRow key={row.id} row={row} onChange={load}
              canUp={idx > 0} canDown={idx < rows.length - 1} onMove={(dir) => move(idx, dir)} />
          ))}
          {rows.length === 0 && <p className="text-muted">Nenhum contato. Use “Adicionar contato”.</p>}
        </div>
      )}
    </div>
  );
}

function ContactRow({ row, onChange, canUp, canDown, onMove }: {
  row: ContentRow; onChange: () => void; canUp: boolean; canDown: boolean; onMove: (dir: number) => void;
}) {
  const d = (row.data || {}) as ConciergeContact;
  const [label, setLabel] = useState(d.label || "");
  const [hint, setHint] = useState(d.hint || "");
  const [value, setValue] = useState(d.value || "");
  const [type, setType] = useState(d.type || "call");
  const [icon, setIcon] = useState(d.icon || "Phone");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = label !== (d.label || "") || hint !== (d.hint || "") || value !== (d.value || "") || type !== (d.type || "call") || icon !== (d.icon || "Phone");
  const valueLabel = type === "maps" ? "Endereço / local" : type === "link" ? "Link (URL)" : "Telefone / valor";

  const save = async () => {
    setBusy(true);
    await upsertContent("concierge", row.slug, { ...d, slug: row.slug, label, hint, value, type, icon }, row.sort, row.published);
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
    onChange();
  };
  const toggleHide = async () => { setBusy(true); await setPublished(row.id, !row.published); setBusy(false); onChange(); };
  const remove = async () => {
    if (!confirm(`Excluir o contato “${d.label || row.slug}”? Esta ação some com ele do guia.`)) return;
    setBusy(true); await deleteContent(row.id); setBusy(false); onChange();
  };

  return (
    <div className={clsx("card p-4", !row.published && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[0.04] text-gold-deep"><Icon name={icon} size={15} /></span>
          <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{row.slug}</span>
          {!row.published && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-muted">oculto</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={!canUp} aria-label="Subir" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-petrol-600 disabled:opacity-30"><Icon name="ChevronDown" size={15} className="rotate-180" /></button>
          <button onClick={() => onMove(1)} disabled={!canDown} aria-label="Descer" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-petrol-600 disabled:opacity-30"><Icon name="ChevronDown" size={15} /></button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_160px]">
        <label className="block">
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Título</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
        </label>
        <label className="block">
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Descrição</span>
          <input value={hint} onChange={(e) => setHint(e.target.value)}
            className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
        </label>
        <label className="block">
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">{valueLabel}</span>
          <input value={value} onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
        </label>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr]">
        <label className="block">
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Tipo (ação do botão)</span>
          <select value={type} onChange={(e) => setType(e.target.value as any)}
            className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            {CONTACT_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Ícone</span>
          <select value={icon} onChange={(e) => setIcon(e.target.value)}
            className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }}>
            {CONTACT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={!dirty || busy} className={clsx("btn-primary !px-4 !py-1.5 text-[12px]", (!dirty || busy) && "opacity-50")}>
          {busy ? "…" : "Salvar"}
        </button>
        {saved && <span className="font-sans text-[12px] text-olive-deep">✓ Salvo</span>}
        <button onClick={toggleHide} disabled={busy} className="btn-ghost !px-3 !py-1.5 text-[12px]">
          <Icon name={row.published ? "EyeOff" : "Eye"} size={13} /> {row.published ? "Ocultar" : "Mostrar"}
        </button>
        <button onClick={remove} disabled={busy} className="ml-auto flex items-center gap-1.5 font-sans text-[12px] text-muted hover:text-[#8f2f2f]">
          <Icon name="X" size={14} /> Excluir
        </button>
      </div>
    </div>
  );
}
