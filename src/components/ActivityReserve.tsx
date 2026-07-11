"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useReservations } from "./providers";
import { type Reservable, type MyReservation } from "@/lib/supabase/reservations";

/**
 * Botão de reserva de uma atividade da programação.
 * Só aparece nas atividades que a QIMO marcou como reserváveis (bordeaux_activities).
 * Permite reservar para si e para acompanhantes (esposa, filhos…).
 * `contentKey` é o id estável da atividade no conteúdo (ex.: "d2-oysters").
 */
export function ActivityReserve({ contentKey }: { contentKey: string }) {
  const { reservableByKey, mine } = useReservations();
  const [open, setOpen] = useState(false);
  const rv = reservableByKey.get(contentKey);
  if (!rv) return null; // atividade não é reservável

  const my = mine.get(rv.activityId);
  const full = rv.available != null && rv.available <= 0;

  return (
    <>
      {my ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border-2 px-3 py-2 font-sans text-[12px] font-semibold transition-colors"
          style={{ borderColor: "var(--olive)", color: "var(--olive-deep)", background: "color-mix(in srgb, var(--olive) 10%, transparent)" }}
        >
          <Icon name="CircleCheck" size={15} />
          {my.status === "waitlist" ? "Na lista de espera" : "Reservado"} · {my.seats} {my.seats > 1 ? "pessoas" : "pessoa"}
          <Icon name="Pencil" size={12} className="opacity-70" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary mt-3 w-full !rounded-[10px] !px-4 !py-2 !tracking-wide text-[12px]"
        >
          <Icon name="CalendarCheck" size={15} /> Reservar
          {rv.available != null && (
            <span className="font-normal opacity-80">· {full ? "lista de espera" : `${rv.available} ${rv.available === 1 ? "vaga" : "vagas"}`}</span>
          )}
        </button>
      )}
      {open && typeof document !== "undefined" &&
        createPortal(<ReserveSheet rv={rv} my={my} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ReserveSheet({ rv, my, onClose }: { rv: Reservable; my?: MyReservation; onClose: () => void }) {
  const { guest, setGuestPhone, reserve, cancel } = useReservations();
  const [names, setNames] = useState<string[]>(() =>
    my?.party?.length ? my.party : [guest?.name?.trim() || ""]
  );
  const [phone, setPhone] = useState(guest?.phone || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setName = (i: number, v: string) => setNames((n) => n.map((x, j) => (j === i ? v : x)));
  const addCompanion = () => setNames((n) => [...n, ""]);
  const removeName = (i: number) => setNames((n) => n.filter((_, j) => j !== i));

  const submit = async () => {
    const party = names.map((n) => n.trim()).filter(Boolean);
    if (!party.length) { setErr("Informe ao menos um nome."); return; }
    if (!guest?.phone && !phone.trim()) { setErr("Informe seu telefone para confirmar."); return; }
    setBusy(true); setErr("");
    if (!guest?.phone && phone.trim()) setGuestPhone(phone.trim());
    const res = await reserve(rv.activityId, party);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "phone" ? "Informe seu telefone para confirmar." : "Não foi possível reservar agora. Tente de novo.");
      return;
    }
    onClose();
  };

  const doCancel = async () => {
    setBusy(true);
    await cancel(rv.activityId);
    setBusy(false);
    onClose();
  };

  const total = names.filter((n) => n.trim()).length;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" onClick={onClose}
      style={{ background: "rgba(26,10,14,.55)" }}>
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[20px] bg-paper p-6 pb-8 shadow-float sm:rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Reserva de passeio</p>
            <h3 className="mt-1 font-serif text-xl font-light leading-snug">{rv.title}</h3>
            <p className="mt-1 font-sans text-[12px] text-muted">
              Dia {rv.dayNumber}{rv.startTime ? ` · ${rv.startTime}` : ""}
              {rv.available != null && ` · ${rv.available > 0 ? `${rv.available} ${rv.available === 1 ? "vaga" : "vagas"}` : "lista de espera"}`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="shrink-0 text-muted hover:text-gold-deep"><Icon name="X" size={20} /></button>
        </div>

        <div className="mt-5">
          <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Quem vai a este passeio</p>
          <p className="mt-0.5 font-sans text-[12px] text-muted">Você e seus acompanhantes (esposa, marido, filhos…).</p>
          <div className="mt-3 space-y-2">
            {names.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.04] text-gold-deep">
                  <Icon name={i === 0 ? "User" : "UserPlus"} size={16} />
                </span>
                <input
                  value={n}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={i === 0 ? "Seu nome" : "Nome do acompanhante"}
                  className="min-w-0 flex-1 rounded-[10px] border bg-transparent px-3 py-2.5 font-sans text-sm outline-none focus:border-gold"
                  style={{ borderColor: "var(--line)" }}
                />
                {names.length > 1 && (
                  <button onClick={() => removeName(i)} aria-label="Remover" className="shrink-0 text-muted hover:text-[#8f2f2f]"><Icon name="X" size={16} /></button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addCompanion} className="mt-2 flex items-center gap-1.5 font-sans text-[12px] font-semibold text-petrol-600 hover:text-petrol-500">
            <Icon name="Plus" size={14} /> Adicionar acompanhante
          </button>
        </div>

        {!guest?.phone && (
          <label className="mt-5 block">
            <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Seu telefone (WhatsApp)</span>
            <span className="mb-1 block font-sans text-[12px] text-muted">Para a equipe QIMO confirmar sua reserva.</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+55 21 99999-9999"
              className="mt-1 w-full rounded-[10px] border bg-transparent px-3 py-2.5 font-sans text-sm outline-none focus:border-gold"
              style={{ borderColor: "var(--line)" }}
            />
          </label>
        )}

        {err && <p className="mt-3 font-sans text-[12px] text-[#8f2f2f]">{err}</p>}

        <button disabled={busy} onClick={submit} className="btn-primary mt-5 w-full !py-3.5">
          {busy ? "Salvando…" : my ? `Atualizar reserva · ${total} ${total > 1 ? "pessoas" : "pessoa"}` : `Confirmar · ${total} ${total > 1 ? "pessoas" : "pessoa"}`}
          {!busy && <Icon name="ArrowRight" size={15} />}
        </button>

        {my && (
          <button disabled={busy} onClick={doCancel} className="mt-3 w-full py-2 font-sans text-[12px] text-muted hover:text-[#8f2f2f]">
            Cancelar minha reserva
          </button>
        )}

        <p className="mt-4 flex items-start gap-1.5 font-sans text-[11px] leading-relaxed text-muted">
          <Icon name="Info" size={13} className="mt-0.5 shrink-0 text-gold-deep" />
          Sua reserva fica registrada com a equipe QIMO. Você pode ajustar os acompanhantes ou cancelar a qualquer momento.
        </p>
      </div>
    </div>
  );
}
