"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { itinerary as FILE_DAYS } from "@/content";
import { listContent, upsertContent, deleteContent, uploadImage, type ContentRow } from "@/lib/supabase/content-admin";
import { supabase } from "@/lib/supabase/client";
import type { Activity, ActivityType, Day, ShipSchedule } from "@/lib/types";
import clsx from "clsx";

const TYPES: { v: ActivityType; l: string }[] = [
  { v: "experience", l: "Experiência" }, { v: "winery", l: "Vinícola" }, { v: "tasting", l: "Degustação" },
  { v: "walk", l: "Passeio a pé" }, { v: "active", l: "Ativo (bike…)" }, { v: "entertainment", l: "Entretenimento" },
  { v: "lecture", l: "Palestra" }, { v: "meal", l: "Refeição" }, { v: "leisure", l: "Lazer" }, { v: "transfer", l: "Transfer (logística)" },
];

const inputCls = "mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold";
const lineStyle = { borderColor: "var(--line)" } as const;

function isOffShipReservable(a: Activity) {
  return a.type !== "transfer" && a.reservable !== false && Boolean(a.location?.trim());
}

/* Sincroniza os passeios reserváveis (bordeaux_activities) com as atividades do dia.
   Reservável = atividade marcada como "precisa reservar" (a.reservable !== false) e que
   não é transfer. As demais (ex.: shows para todos, palestras) ficam ocultas das reservas.
   Capacidade já editada no painel é preservada. */
async function syncActivities(day: Day) {
  const sb = supabase();
  const { data: existing } = await sb.from("bordeaux_activities").select("id,content_key").eq("day_number", day.n);
  const keep = new Set<string>();
  for (let i = 0; i < day.activities.length; i++) {
    const a = day.activities[i];
    if (!isOffShipReservable(a)) continue;
    keep.add(a.id);
    const st = a.time ? String(a.time).split(/[–—-]/)[0].trim() : null;
    const patch = { title: a.title, day_number: day.n, date: day.date, start_time: st, qimo_select: !!a.qimoSelect, sort: day.n * 100 + i, status: "available" };
    const local = (existing || []).find((e: any) => e.content_key === a.id);
    if (local) {
      await sb.from("bordeaux_activities").update(patch).eq("id", local.id);
    } else {
      const { data: global } = await sb.from("bordeaux_activities").select("id").eq("content_key", a.id).maybeSingle();
      if (global) await sb.from("bordeaux_activities").update(patch).eq("id", (global as any).id);
      else await sb.from("bordeaux_activities").insert({ content_key: a.id, capacity_total: a.capacity ?? null, ...patch });
    }
  }
  for (const e of (existing || []) as any[]) {
    if (e.content_key && !keep.has(e.content_key)) {
      await sb.from("bordeaux_activities").update({ status: "hidden" }).eq("id", e.id);
    }
  }
}

export function RoteiroEditor() {
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    let r = await listContent("day");
    if (!r.length) {
      // Primeira vez: importa o roteiro do código para o banco (edição livre a partir daí).
      setSeeding(true);
      for (const d of FILE_DAYS) await upsertContent("day", `dia-${d.n}`, d, d.n * 10, true);
      r = await listContent("day");
      setSeeding(false);
    }
    const sorted = r.sort((a, b) => (a.data?.n ?? 0) - (b.data?.n ?? 0));
    setRows(sorted);
    setSelectedId((current) => current && sorted.some((row) => row.id === current) ? current : sorted[0]?.id ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addDay = async () => {
    const maxN = rows?.reduce((m, r) => Math.max(m, r.data?.n ?? 0), 0) ?? 0;
    const n = maxN + 1;
    const last = rows?.[rows.length - 1]?.data as Day | undefined;
    const nextDate = last?.date
      ? new Date(new Date(last.date + "T00:00:00").getTime() + 86400000).toISOString().slice(0, 10)
      : "2026-10-25";
    const d: Day = { n, date: nextDate, title: `Dia ${n}`, ports: [], ship: [], activities: [] };
    await upsertContent("day", `dia-${n}`, d, n * 10, true);
    load();
  };

  const syncAllReservations = async () => {
    if (!rows?.length) return;
    setSyncingAll(true);
    try {
      for (const row of rows) {
        await syncActivities(row.data as Day);
      }
      alert("Reservas sincronizadas. Atividades fora do barco com local preenchido aparecem para reserva.");
    } finally {
      setSyncingAll(false);
    }
  };

  if (rows === null) return <p className="text-muted">{seeding ? "Importando o roteiro para edicao..." : "Carregando..."}</p>;
  const selected = rows.find((row) => row.id === selectedId) || rows[0];

  return (
    <div>
      <div className="rounded-[14px] border p-4" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">Roteiro</p>
            <h2 className="font-serif text-2xl font-light">Escolha um dia para editar</h2>
            <p className="mt-1 max-w-2xl font-sans text-[12px] text-muted">
              Edite titulo, foto, portos, agenda do navio e atividades. Ao salvar, os passeios reservaveis sao sincronizados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={syncAllReservations} disabled={syncingAll} className="btn-ghost !px-4 !py-2 text-[12px]">
              <Icon name="CalendarCheck" size={14} /> {syncingAll ? "Sincronizando..." : "Sincronizar reservas"}
            </button>
            <button onClick={addDay} className="btn-primary !px-4 !py-2 text-[12px]"><Icon name="Plus" size={14} /> Adicionar dia</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => {
            const day = row.data as Day;
            const active = row.id === selectedId;
            return (
              <button
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                className={clsx(
                  "rounded-[12px] border p-4 text-left transition-colors hover:border-gold",
                  active ? "bg-petrol-600 text-cream" : "bg-white/35"
                )}
                style={{ borderColor: active ? "transparent" : "var(--line)" }}
              >
                <span className={clsx("inline-grid h-9 w-9 place-items-center rounded-full font-serif text-base", active ? "bg-cream/15" : "bg-petrol-600/10 text-petrol-600")}>
                  {String(day.n).padStart(2, "0")}
                </span>
                <span className="mt-3 block truncate font-serif text-lg font-light leading-tight">{day.title || `Dia ${day.n}`}</span>
                <span className={clsx("mt-1 block truncate font-sans text-[12px]", active ? "text-cream/75" : "text-muted")}>
                  {day.date} - {day.activities.length} atividade(s)
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        {selected && <DayEditor key={selected.id} row={selected} onChange={load} initiallyOpen />}
      </div>
    </div>
  );
}
/* -------------------- Editor de um dia -------------------- */
function DayEditor({ row, onChange, initiallyOpen = false }: { row: ContentRow; onChange: () => void; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [d, setD] = useState<Day>(row.data as Day);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(row.data);

  const set = (patch: Partial<Day>) => setD((prev) => ({ ...prev, ...patch }));
  const setAct = (i: number, patch: Partial<Activity>) =>
    setD((prev) => ({ ...prev, activities: prev.activities.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const moveAct = (i: number, dir: number) =>
    setD((prev) => {
      const arr = [...prev.activities];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, activities: arr };
    });
  const removeAct = (i: number) => setD((prev) => ({ ...prev, activities: prev.activities.filter((_, j) => j !== i) }));
  const addAct = () =>
    setD((prev) => ({
      ...prev,
      activities: [...prev.activities, { id: `d${prev.n}-${Math.random().toString(36).slice(2, 7)}`, title: "", type: "experience", time: null } as Activity],
    }));

  const setShip = (i: number, patch: Partial<ShipSchedule>) =>
    setD((prev) => ({ ...prev, ship: prev.ship.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const removeShip = (i: number) => setD((prev) => ({ ...prev, ship: prev.ship.filter((_, j) => j !== i) }));
  const addShip = () => setD((prev) => ({ ...prev, ship: [...prev.ship, { city: "", eta: null, etd: null }] }));

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgBusy(true);
    try { set({ heroImage: await uploadImage(file) }); } catch { alert("Não foi possível enviar a foto."); }
    setImgBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    setBusy(true);
    await upsertContent("day", row.slug, d, (d.n ?? 0) * 10, row.published);
    await syncActivities(d);
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 1800);
    onChange();
  };

  const removeDay = async () => {
    if (!confirm(`Excluir o Dia ${d.n} — "${d.title}"? As atividades dele saem do guia.`)) return;
    setBusy(true);
    await deleteContent(row.id);
    await supabase().from("bordeaux_activities").update({ status: "hidden" }).eq("day_number", d.n);
    setBusy(false);
    onChange();
  };

  return (
    <div className="card overflow-hidden">
      {/* Cabeçalho do dia */}
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-petrol-600/10 font-serif text-lg text-petrol-600">{String(d.n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[18px] font-light">{d.title || `Dia ${d.n}`}</span>
          <span className="font-sans text-[12px] text-muted">{d.date} · {d.activities.length} atividade(s)</span>
        </span>
        {dirty && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-gold-deep">não salvo</span>}
        <Icon name="ChevronDown" size={17} className={clsx("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t px-5 pb-5 pt-4" style={lineStyle}>
          {/* Campos do dia */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Título do dia</span>
              <input value={d.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} style={lineStyle} />
            </label>
            <label className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Subtítulo (frase curta)</span>
              <input value={d.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} className={inputCls} style={lineStyle} />
            </label>
            <label className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Data</span>
              <input type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} style={lineStyle} />
            </label>
            <label className="block">
              <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Portos (separados por vírgula)</span>
              <input value={(d.ports || []).join(", ")}
                onChange={(e) => set({ ports: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                className={inputCls} style={lineStyle} />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Nota do dia (aparece em destaque, opcional)</span>
            <textarea value={d.note || ""} onChange={(e) => set({ note: e.target.value })} rows={2} className={inputCls} style={lineStyle} />
          </label>

          {/* Foto do dia */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="h-16 w-28 overflow-hidden rounded-[8px] bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.heroImage ? <img src={d.heroImage} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-sans text-[10px] text-muted">automática</div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={imgBusy} className="btn-ghost !px-3 !py-2 text-[12px]">
              <Icon name="Image" size={14} /> {imgBusy ? "Enviando…" : "Foto do dia"}
            </button>
            {d.heroImage && <button onClick={() => set({ heroImage: undefined })} className="font-sans text-[12px] text-muted hover:text-[#8f2f2f]">Usar foto automática</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
          </div>

          {/* Atividades */}
          <p className="kicker mt-6">Atividades do dia</p>
          <div className="mt-2 space-y-3">
            {d.activities.map((a, i) => (
              <div key={a.id} className="rounded-[12px] border p-3" style={lineStyle}>
                <div className="grid gap-2 sm:grid-cols-[110px_1fr_170px]">
                  <label className="block">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Horário</span>
                    <input value={a.time || ""} onChange={(e) => setAct(i, { time: e.target.value || null })} placeholder="10:00–11:00" className={inputCls} style={lineStyle} />
                  </label>
                  <label className="block">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Título</span>
                    <input value={a.title} onChange={(e) => setAct(i, { title: e.target.value })} className={inputCls} style={lineStyle} />
                  </label>
                  <label className="block">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Tipo</span>
                    <select value={a.type} onChange={(e) => setAct(i, { type: e.target.value as ActivityType })} className={inputCls} style={lineStyle}>
                      {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_130px]">
                  <label className="block">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Local</span>
                    <input value={a.location || ""} onChange={(e) => setAct(i, { location: e.target.value })} className={inputCls} style={lineStyle} />
                  </label>
                  <label className="block">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Vagas (0 = livre)</span>
                    <input type="number" min={0} value={a.capacity ?? 0}
                      onChange={(e) => setAct(i, { capacity: parseInt(e.target.value) || undefined })} className={inputCls} style={lineStyle} />
                  </label>
                </div>
                <label className="mt-2 block">
                  <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Descrição</span>
                  <textarea value={a.description || ""} onChange={(e) => setAct(i, { description: e.target.value })} rows={2} className={inputCls} style={lineStyle} />
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 font-sans text-[12px] text-muted">
                    <input type="checkbox" checked={!!a.qimoSelect} onChange={(e) => setAct(i, { qimoSelect: e.target.checked })} /> Seleção QIMO
                  </label>
                  <label className={clsx("flex items-center gap-1.5 font-sans text-[12px]", a.type === "transfer" ? "text-muted opacity-50" : "text-muted")}>
                    <input type="checkbox" disabled={a.type === "transfer"}
                      checked={a.type !== "transfer" && a.reservable !== false}
                      onChange={(e) => setAct(i, { reservable: e.target.checked })} /> Precisa reservar
                  </label>
                  {a.type === "transfer" && <span className="font-sans text-[11px] text-muted">Transfer não entra nas reservas</span>}
                  <span className="ml-auto flex items-center gap-1">
                    <button onClick={() => moveAct(i, -1)} disabled={i === 0} aria-label="Subir" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-petrol-600 disabled:opacity-30"><Icon name="ChevronDown" size={15} className="rotate-180" /></button>
                    <button onClick={() => moveAct(i, 1)} disabled={i === d.activities.length - 1} aria-label="Descer" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-petrol-600 disabled:opacity-30"><Icon name="ChevronDown" size={15} /></button>
                    <button onClick={() => removeAct(i)} aria-label="Excluir atividade" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-[#8f2f2f]"><Icon name="X" size={15} /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addAct} className="mt-3 flex items-center gap-1.5 font-sans text-[12px] font-semibold text-petrol-600 hover:text-petrol-500">
            <Icon name="Plus" size={14} /> Adicionar atividade
          </button>

          {/* Agenda do navio */}
          <p className="kicker mt-6">Agenda do navio</p>
          <div className="mt-2 space-y-2">
            {d.ship.map((s, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <label className="block min-w-[10rem] flex-1">
                  <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Cidade / porto</span>
                  <input value={s.city} onChange={(e) => setShip(i, { city: e.target.value })} className={inputCls} style={lineStyle} />
                </label>
                <label className="block w-28">
                  <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Chegada</span>
                  <input value={s.eta || ""} onChange={(e) => setShip(i, { eta: e.target.value || null })} placeholder="11:00" className={inputCls} style={lineStyle} />
                </label>
                <label className="block w-28">
                  <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Saída</span>
                  <input value={s.etd || ""} onChange={(e) => setShip(i, { etd: e.target.value || null })} placeholder="17:30" className={inputCls} style={lineStyle} />
                </label>
                <button onClick={() => removeShip(i)} aria-label="Remover linha" className="mb-1 grid h-8 w-8 place-items-center rounded-md text-muted hover:text-[#8f2f2f]"><Icon name="X" size={15} /></button>
              </div>
            ))}
          </div>
          <button onClick={addShip} className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-semibold text-petrol-600 hover:text-petrol-500">
            <Icon name="Plus" size={14} /> Adicionar linha
          </button>

          {/* Ações do dia */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4" style={lineStyle}>
            <button onClick={save} disabled={!dirty || busy} className={clsx("btn-primary !px-5 !py-2.5 text-[13px]", (!dirty || busy) && "opacity-50")}>
              {busy ? "Salvando…" : "Salvar dia"}
            </button>
            {saved && <span className="font-sans text-[12px] text-olive-deep">✓ Salvo — reservas sincronizadas</span>}
            {dirty && !busy && <button onClick={() => setD(row.data as Day)} className="btn-ghost !px-3 !py-2 text-[12px]">Descartar mudanças</button>}
            <button onClick={removeDay} disabled={busy} className="ml-auto flex items-center gap-1.5 font-sans text-[12px] text-muted hover:text-[#8f2f2f]">
              <Icon name="X" size={14} /> Excluir dia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
