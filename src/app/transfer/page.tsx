"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useReservations } from "@/components/providers";

// Transfer do navio ao aeroporto (BOD) no desembarque (1º nov).
// 3 horários, 2 ônibus por horário (40 cada) = 80 lugares por horário.
// Escolha única por grupo: selecionar outro horário troca o anterior.
const SLOTS = [
  { key: "transfer-0600", time: "06h00" },
  { key: "transfer-0730", time: "07h30" },
  { key: "transfer-0900", time: "09h00" },
];

export default function TransferPage() {
  const { reservableByKey, mine, guest, guestParty, reserve, cancel } = useReservations();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const slots = SLOTS.map((s) => {
    const rv = reservableByKey.get(s.key);
    const my = rv ? mine.get(rv.activityId) : undefined;
    return { ...s, rv, my };
  });
  const current = slots.find((s) => s.my);

  const party = (guestParty.length ? guestParty.map((p) => p.fullName) : [guest?.name || ""]).filter(Boolean);

  const choose = async (slot: (typeof slots)[number]) => {
    if (!slot.rv || busy) return;
    setErr("");
    setBusy(slot.key);
    // Escolha única: cancela o horário anterior antes de marcar o novo.
    if (current && current.rv && current.rv.activityId !== slot.rv.activityId) {
      await cancel(current.rv.activityId);
    }
    const res = await reserve(slot.rv.activityId, party);
    setBusy(null);
    if (!res.ok) {
      setErr(res.error === "phone" ? "Entre no guia com seu telefone pessoal para escolher o horário." : "Não foi possível agora. Tente de novo.");
    }
  };

  const removeChoice = async () => {
    if (!current?.rv || busy) return;
    setBusy(current.key);
    await cancel(current.rv.activityId);
    setBusy(null);
  };

  return (
    <>
      <div className="container-editorial pt-10">
        <p className="kicker">Desembarque · 1º de novembro</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Transfer ao aeroporto</h1>
        <p className="prose-luxe mt-3 max-w-xl">
          A QIMO oferece transfer do navio ao aeroporto (BOD) em três horários. São{" "}
          <strong>2 ônibus por horário</strong> — até 40 pessoas em cada, já considerando as malas —, ou seja,{" "}
          <strong>80 lugares por horário</strong>. Escolha o que melhor se encaixa no seu voo.
        </p>
      </div>

      <div className="container-editorial mt-6 space-y-3">
        {slots.map((s) => {
          const available = s.rv?.available ?? null;
          const full = available != null && available <= 0;
          const selected = !!s.my;
          return (
            <div
              key={s.key}
              className="card p-5"
              style={selected ? { borderColor: "var(--olive)", background: "color-mix(in srgb, var(--olive) 8%, transparent)" } : undefined}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-petrol-600/10 text-petrol-600">
                    <Icon name="Bus" size={21} />
                  </span>
                  <div>
                    <p className="font-serif text-2xl font-light leading-none">{s.time}</p>
                    <p className="mt-1 font-sans text-[12px] text-muted">2 ônibus · até 80 pessoas</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {selected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-olive/15 px-3 py-1 font-sans text-[12px] font-semibold text-olive-deep">
                      <Icon name="CircleCheck" size={14} /> Selecionado
                    </span>
                  ) : full ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-sans text-[12px] text-muted" style={{ background: "color-mix(in srgb, var(--text) 5%, transparent)" }}>
                      <Icon name="CircleMinus" size={14} /> Esgotado
                    </span>
                  ) : available != null ? (
                    <span className="font-sans text-[12px] text-muted">{available} lugares livres</span>
                  ) : null}
                </div>
              </div>

              {!selected && !full && (
                <button
                  type="button"
                  disabled={!s.rv || busy === s.key}
                  onClick={() => choose(s)}
                  className="btn-primary mt-4 w-full !rounded-[10px] !py-3 text-[12px] disabled:opacity-50"
                >
                  {busy === s.key ? "Salvando..." : (<><Icon name="Bus" size={15} /> Escolher este horário</>)}
                </button>
              )}

              {selected && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                  <p className="min-w-0 font-sans text-[12px] text-muted">
                    Para: {(s.my?.party?.length ? s.my.party : party).join(" · ")}
                  </p>
                  <button
                    type="button"
                    disabled={busy === s.key}
                    onClick={removeChoice}
                    className="shrink-0 font-sans text-[12px] text-muted hover:text-[#8f2f2f] disabled:opacity-50"
                  >
                    Cancelar meu transfer
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {err && <p className="font-sans text-[12px] text-[#8f2f2f]">{err}</p>}

        <p className="mt-4 flex items-start gap-1.5 font-sans text-[12px] leading-relaxed text-muted">
          <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-gold-deep" />
          A escolha vale para todo o seu grupo. Precisa de horários diferentes para pessoas do mesmo quarto? Fale com a equipe QIMO.
        </p>
      </div>
      <div className="h-16" />
    </>
  );
}
