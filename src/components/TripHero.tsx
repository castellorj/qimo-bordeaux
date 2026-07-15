"use client";

import { useEffect, useState } from "react";
import { Countdown } from "./Countdown";
import { Weather } from "./Weather";
import { PhotoImg } from "./PhotoImg";
import { useLocale, useReservations } from "./providers";
import { TRIP } from "@/content";
import { fullDate } from "@/lib/format";

/**
 * Cabeçalho fotográfico de boas-vindas (saudação + data + clima + contagem).
 * Usado na entrada da Viagem e na tela Hoje. A foto de fundo é editável no painel:
 * a chave `imageKey` guarda a URL em bordeaux_settings (cfg), com fallback local.
 */
export function TripHero({
  imageKey,
  defaultImage,
  title,
}: {
  imageKey: string;
  defaultImage: string;
  title?: string; // se omitido, mostra a saudação (Bom dia/Boa tarde/Boa noite)
}) {
  const { t, cfg, settingsReady } = useLocale();
  const { guest } = useReservations();
  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? t("greetMorning") : h < 18 ? t("greetAfternoon") : t("greetEvening"));
    setToday(fullDate(new Date().toISOString().slice(0, 10)));
  }, [t]);

  const img = cfg(imageKey)?.trim() || (settingsReady ? defaultImage : "");
  const guestName = (guest?.name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
  const heroTitle = guestName ? `Olá, ${guestName}` : title || greeting || " ";

  return (
    <>
    <section className="relative overflow-hidden">
      {img ? (
        <PhotoImg src={img} alt="" aria-hidden sizes="100vw" priority className="animate-ken-burns absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="photo-placeholder absolute inset-0 opacity-[0.18]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-petrol-950/80 via-petrol-900/70 to-petrol-950/92" />

      <div className="text-on-photo container-editorial relative z-10 pb-16 pt-12 text-center sm:pb-20 sm:pt-16">
        <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{t("onBoard")}</p>
        <h1 className="display mt-4 text-4xl text-cream sm:text-5xl">{heroTitle}</h1>
        <p className="mt-2 font-sans text-[13px] text-cream/70">{today}</p>

        <div className="mt-52 sm:mt-56">
          <Countdown iso={TRIP.boardingISO} label={t("boardingLabel")} />
        </div>
      </div>
    </section>
    <div className="py-3" style={{ background: "var(--bg)" }}>
      <div className="container-editorial flex justify-center">
        <div className="inline-flex rounded-full border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <Weather compact />
        </div>
      </div>
    </div>
    </>
  );
}
