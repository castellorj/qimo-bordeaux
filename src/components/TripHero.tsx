"use client";

import { useEffect, useState } from "react";
import { Countdown } from "./Countdown";
import { Weather } from "./Weather";
import { useLocale } from "./providers";
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
  const { t, cfg } = useLocale();
  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? t("greetMorning") : h < 18 ? t("greetAfternoon") : t("greetEvening"));
    setToday(fullDate(new Date().toISOString().slice(0, 10)));
  }, [t]);

  const img = cfg(imageKey)?.trim() || defaultImage;

  return (
    <section className="relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" aria-hidden className="animate-ken-burns absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-petrol-950/80 via-petrol-900/70 to-petrol-950/92" />

      <div className="text-on-photo container-editorial relative z-10 pb-20 pt-12 text-center sm:pt-16">
        <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{t("onBoard")}</p>
        <h1 className="display mt-4 text-4xl text-cream sm:text-5xl">{title || greeting || " "}</h1>
        <p className="mt-2 font-sans text-[13px] text-cream/70">{today}</p>

        <div className="mx-auto mt-8 flex max-w-md items-center justify-center rounded-full border border-cream/20 bg-petrol-950/40 px-5 py-3 backdrop-blur-sm">
          <Weather compact />
        </div>

        <div className="mt-8">
          <Countdown iso={TRIP.boardingISO} label={t("boardingLabel")} />
        </div>
      </div>
    </section>
  );
}
