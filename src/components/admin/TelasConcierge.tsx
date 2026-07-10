"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { conciergeContacts as BASE } from "@/content";
import { uploadImage, upsertSetting, listSettings, upsertContent, listContent } from "@/lib/supabase/content-admin";
import type { ConciergeContact } from "@/lib/types";
import clsx from "clsx";

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

/* -------------------- Concierge: contatos -------------------- */
function ConciergeContactsEditor() {
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listContent("concierge").then((rows) => {
      const m: Record<string, any> = {};
      rows.forEach((r) => (m[r.slug] = r.data));
      setOverrides(m);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h3 className="font-serif text-xl font-light">Concierge — contatos</h3>
      <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
        Edite os textos e telefones que aparecem no balão do concierge e na página Concierge. Salva na hora, <strong>sem republicar</strong>.
      </p>
      {loading ? (
        <p className="mt-4 text-muted">Carregando…</p>
      ) : (
        <div className="mt-4 space-y-2">
          {BASE.map((c, i) => (
            <ContactRow key={c.slug} base={c} data={overrides[c.slug]} sort={i * 10} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({ base, data, sort }: { base: ConciergeContact; data: any; sort: number }) {
  const merged = { ...base, ...(data || {}) } as ConciergeContact;
  const [label, setLabel] = useState(merged.label);
  const [hint, setHint] = useState(merged.hint || "");
  const [value, setValue] = useState(merged.value);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = label !== merged.label || hint !== (merged.hint || "") || value !== merged.value;
  const valueLabel = base.type === "whatsapp" || base.type === "call" || base.type === "emergency" ? "Telefone" : "Valor / endereço";

  const save = async () => {
    setBusy(true);
    await upsertContent("concierge", base.slug, { ...base, ...(data || {}), label, hint, value }, sort);
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[0.04] text-gold-deep"><Icon name={base.icon} size={15} /></span>
        <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{base.slug}</span>
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
      <div className="mt-2 flex items-center gap-2">
        <button onClick={save} disabled={!dirty || busy} className={clsx("btn-primary !px-4 !py-1.5 text-[12px]", (!dirty || busy) && "opacity-50")}>
          {busy ? "…" : "Salvar"}
        </button>
        {saved && <span className="font-sans text-[12px] text-olive-deep">✓ Salvo</span>}
      </div>
    </div>
  );
}
