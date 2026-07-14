"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useReservations } from "./providers";
import { type Reservable, type MyReservation } from "@/lib/supabase/reservations";

export function ActivityReserve({ contentKey }: { contentKey: string }) {
  const { reservableByKey, mine } = useReservations();
  const [open, setOpen] = useState(false);
  const rv = reservableByKey.get(contentKey);
  if (!rv) return null;

  const my = mine.get(rv.activityId);
  const conflict = Array.from(mine.values()).find((r) =>
    r.activityId !== rv.activityId &&
    r.dayNumber === rv.dayNumber &&
    r.startTime === rv.startTime
  );
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
      ) : conflict ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border px-3 py-2 font-sans text-[12px] font-semibold"
          style={{ borderColor: "var(--line)", color: "var(--text-muted)", background: "rgba(0,0,0,.025)" }}
        >
          <Icon name="CircleCheck" size={15} />
          Horário já escolhido
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
        createPortal(<ReserveSheet rv={rv} my={my} conflict={conflict} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ReserveSheet({
  rv,
  my,
  conflict,
  onClose,
}: {
  rv: Reservable;
  my?: MyReservation;
  conflict?: MyReservation;
  onClose: () => void;
}) {
  const { guest, setGuestRoom, reserve, cancel } = useReservations();
  const [names, setNames] = useState<string[]>(() =>
    my?.party?.length ? my.party : [guest?.name?.trim() || ""]
  );
  const [room, setRoom] = useState(guest?.room || "");
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
    if (conflict && !my) {
      setErr(`Este quarto já reservou "${conflict.title}" neste mesmo horário. Cancele ou altere a outra escolha antes de reservar esta opção.`);
      return;
    }
    if (!room.trim()) { setErr("Informe o número do quarto para confirmar."); return; }

    setBusy(true);
    setErr("");
    if (room.trim() !== guest?.room) setGuestRoom(room.trim());
    const res = await reserve(rv.activityId, party);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "room" || res.error === "phone" ? "Informe o número do quarto para confirmar." : "Não foi possível reservar agora. Tente de novo.");
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

        {conflict && !my && (
          <div className="mt-5 rounded-[12px] border p-4 font-sans text-[12px] leading-relaxed" style={{ borderColor: "var(--gold)", background: "color-mix(in srgb, var(--gold) 10%, transparent)", color: "var(--text)" }}>
            <p className="flex items-center gap-1.5 font-semibold"><Icon name="Info" size={14} className="text-gold-deep" /> Escolha uma opção neste horário</p>
            <p className="mt-1 text-muted">Este quarto já tem reserva para <strong>{conflict.title}</strong>. Para trocar, cancele a reserva anterior primeiro.</p>
          </div>
        )}

        <div className="mt-5">
          <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Quem vai a este passeio</p>
          <p className="mt-0.5 font-sans text-[12px] text-muted">Você e seus acompanhantes.</p>
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
                  className="min-w-0 flex-1 rounded-[10px] border bg-transparent px-3 py-2.5 font-sans text-base outline-none focus:border-gold"
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

        <label className="mt-5 block">
          <span className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Número do quarto</span>
          <span className="mb-1 block font-sans text-[12px] text-muted">Confirme seu quarto para evitar duas reservas no mesmo horário.</span>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            inputMode="text"
            placeholder="Ex: 302"
            className="mt-1 w-full rounded-[10px] border bg-transparent px-3 py-2.5 font-sans text-base outline-none focus:border-gold"
            style={{ borderColor: "var(--line)" }}
          />
        </label>

        {err && <p className="mt-3 font-sans text-[12px] text-[#8f2f2f]">{err}</p>}

        <button disabled={busy || (!!conflict && !my)} onClick={submit} className="btn-primary mt-5 w-full !py-3.5 disabled:opacity-50">
          {busy ? "Salvando..." : my ? `Atualizar reserva · ${total} ${total > 1 ? "pessoas" : "pessoa"}` : `Confirmar · ${total} ${total > 1 ? "pessoas" : "pessoa"}`}
          {!busy && <Icon name="ArrowRight" size={15} />}
        </button>

        {my && (
          <button disabled={busy} onClick={doCancel} className="mt-3 w-full py-2 font-sans text-[12px] text-muted hover:text-[#8f2f2f]">
            Cancelar minha reserva
          </button>
        )}

        <p className="mt-4 flex items-start gap-1.5 font-sans text-[11px] leading-relaxed text-muted">
          <Icon name="Info" size={13} className="mt-0.5 shrink-0 text-gold-deep" />
          Sua reserva fica registrada por quarto com a equipe QIMO. Você pode ajustar os acompanhantes ou cancelar a qualquer momento.
        </p>
      </div>
    </div>
  );
}
