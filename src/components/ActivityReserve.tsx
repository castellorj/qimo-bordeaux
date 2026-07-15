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
  const { guest, guestParty, reserve, cancel } = useReservations();
  const allowedNames = guestParty.length
    ? guestParty.map((p) => p.fullName).filter(Boolean)
    : [guest?.name?.trim() || "Convidado"];
  const [names, setNames] = useState<string[]>(() => {
    const saved = my?.party?.filter((name) => allowedNames.includes(name)) || [];
    return saved.length ? saved : [allowedNames[0]].filter(Boolean);
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleName = (name: string) => {
    setNames((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      return [...current, name];
    });
  };

  const submit = async () => {
    const party = names.map((n) => n.trim()).filter(Boolean);
    if (!party.length) { setErr("Selecione ao menos uma pessoa."); return; }
    if (conflict && !my) {
      setErr(`Você já reservou "${conflict.title}" neste mesmo horário. Cancele ou altere a outra escolha antes de reservar esta opção.`);
      return;
    }

    setBusy(true);
    setErr("");
    const res = await reserve(rv.activityId, party);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "phone" ? "Entre no guia com seu telefone pessoal para confirmar." : "Não foi possível reservar agora. Tente de novo.");
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
            <p className="mt-1 text-muted">Você já tem reserva para <strong>{conflict.title}</strong>. Para trocar, cancele a reserva anterior primeiro.</p>
          </div>
        )}

        <div className="mt-5">
          <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Quem vai a este passeio</p>
          <p className="mt-0.5 font-sans text-[12px] text-muted">Você só pode reservar para você e para o par vinculado ao mesmo Grupo Bordeaux.</p>
          <div className="mt-3 space-y-2">
            {allowedNames.map((name, i) => (
              <label key={`${name}-${i}`} className="flex cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2.5" style={{ borderColor: names.includes(name) ? "var(--gold)" : "var(--line)", background: names.includes(name) ? "color-mix(in srgb, var(--gold) 8%, transparent)" : "transparent" }}>
                <input type="checkbox" checked={names.includes(name)} onChange={() => toggleName(name)} />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.04] text-gold-deep">
                  <Icon name={i === 0 ? "User" : "UserPlus"} size={16} />
                </span>
                <span className="min-w-0 flex-1 font-sans text-sm">{name}</span>
                {i === 0 && <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide2 text-muted">Você</span>}
              </label>
            ))}
          </div>
        </div>

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
          Sua reserva fica registrada pelo seu telefone pessoal. As vagas disponíveis são atualizadas ao vivo para a equipe QIMO.
        </p>
      </div>
    </div>
  );
}
