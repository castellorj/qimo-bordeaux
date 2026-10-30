"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useReservations } from "@/components/providers";
import { CANCEL_DEADLINE } from "@/lib/supabase/reservations";

// Transfer do navio ao aeroporto (BOD) no desembarque (1º nov).
// 3 horários, 2 ônibus por horário (40 cada) = 80 lugares por horário.
// Cada pessoa do grupo escolhe o SEU horário — podem ir juntos ou separados.
const SLOTS = [
  { key: "transfer-0600", time: "06h00" },
  { key: "transfer-0730", time: "07h30" },
  { key: "transfer-0900", time: "09h00" },
];

function shortName(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ") || name;
}

export default function TransferPage() {
  const { reservableByKey, mine, guest, guestParty, reserve } = useReservations();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const slots = SLOTS.map((s) => {
    const rv = reservableByKey.get(s.key);
    const my = rv ? mine.get(rv.activityId) : undefined;
    return { ...s, rv, my };
  });

  const party = (guestParty.length ? guestParty.map((p) => p.fullName) : [guest?.name || ""]).filter(Boolean);

  // Horário atual de cada pessoa (qual slot tem a pessoa no party).
  const slotOf = (name: string) => slots.find((s) => s.my?.party?.includes(name))?.key || null;
  const partyOf = (key: string) => {
    const rv = reservableByKey.get(key);
    return rv ? (mine.get(rv.activityId)?.party || []) : [];
  };

  const choose = async (name: string, slotKey: string) => {
    if (busy) return;
    // Horário já escolhido não pode ser trocado nem desmarcado pelo guia (só pela equipe QIMO).
    if (slotOf(name)) {
      setErr(`Este horário já está confirmado. ${CANCEL_DEADLINE}`);
      return;
    }
    const rv = reservableByKey.get(slotKey);
    if (!rv) return;

    setBusy(name);
    setErr("");
    const res = await reserve(rv.activityId, [...partyOf(slotKey).filter((p) => p !== name), name]);
    if (!res.ok) {
      setErr(res.error === "phone" ? "Entre no guia com seu telefone pessoal para escolher o horário." : "Não foi possível agora. Tente de novo.");
    }
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
          <strong>80 lugares por horário</strong>. <strong>Cada pessoa escolhe o seu horário</strong>: vocês podem ir juntos ou em horários diferentes.
        </p>
      </div>

      {/* Vagas por horário */}
      <div className="container-editorial mt-5 flex flex-wrap gap-2">
        {slots.map((s) => {
          const available = s.rv?.available ?? null;
          const full = available != null && available <= 0;
          return (
            <span key={s.key} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px]" style={{ borderColor: "var(--line)" }}>
              <Icon name="Bus" size={14} className="text-gold-deep" />
              <strong>{s.time}</strong>
              <span className="text-muted">· {full ? "esgotado" : available != null ? `${available} livres` : "—"}</span>
            </span>
          );
        })}
      </div>

      {/* Escolha por pessoa */}
      <div className="container-editorial mt-6">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide2 text-muted">Escolha o horário de cada pessoa</p>
        <div className="mt-3 space-y-3">
          {party.map((name) => {
            const chosen = slotOf(name);
            return (
              <div key={name} className="card p-4">
                <p className="font-serif text-lg font-light leading-snug">{shortName(name)}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {slots.map((s) => {
                    const available = s.rv?.available ?? null;
                    const isChosen = chosen === s.key;
                    const full = !isChosen && available != null && available <= 0;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={!s.rv || full || busy === name || (!!chosen && !isChosen)}
                        onClick={() => choose(name, s.key)}
                        className="flex items-center justify-center gap-1.5 rounded-[10px] border-2 px-2 py-2.5 font-sans text-[13px] font-semibold transition-colors disabled:opacity-50"
                        style={isChosen
                          ? { borderColor: "var(--olive)", color: "var(--olive-deep)", background: "color-mix(in srgb, var(--olive) 12%, transparent)" }
                          : { borderColor: "var(--line)", color: "var(--text)" }}
                      >
                        {isChosen && <Icon name="Check" size={14} />}
                        {full ? "Esgotado" : s.time}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 font-sans text-[11px] text-muted">
                  {chosen ? `Horário confirmado. ${CANCEL_DEADLINE}` : "Toque para escolher o horário (ou deixe em branco se não vai de transfer)."}
                </p>
              </div>
            );
          })}
        </div>

        {err && <p className="mt-3 font-sans text-[12px] text-[#8f2f2f]">{err}</p>}

        <p className="mt-5 flex items-start gap-1.5 font-sans text-[12px] leading-relaxed text-muted">
          <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-gold-deep" />
          Cada pessoa do grupo pode escolher um horário diferente. Precisa de algo fora dos três horários? Fale com a equipe QIMO pelo concierge.
        </p>
      </div>
      <div className="h-16" />
    </>
  );
}
