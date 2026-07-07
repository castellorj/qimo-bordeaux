"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { Weather } from "@/components/Weather";
import { ConciergeNow } from "@/components/ConciergeNow";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/components/providers";
import { TRIP } from "@/content";
import { fullDate } from "@/lib/format";

export default function HojePage() {
  const { t } = useLocale();
  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? t("greetMorning") : h < 18 ? t("greetAfternoon") : t("greetEvening"));
    setToday(fullDate(new Date().toISOString().slice(0, 10)));
  }, [t]);

  return (
    <div className="pb-4">
      {/* -------- Saudação + clima + contagem -------- */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/hero-bordeaux.jpg" alt="Bordeaux" className="animate-ken-burns absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-petrol-950/80 via-petrol-900/70 to-petrol-950/92" />

        <div className="text-on-photo container-editorial relative z-10 pb-20 pt-12 text-center sm:pt-16">
          <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{t("onBoard")}</p>
          <h1 className="display mt-4 text-4xl text-cream sm:text-5xl">{greeting || " "}</h1>
          <p className="mt-2 font-sans text-[13px] text-cream/70">{today}</p>

          <div className="mx-auto mt-8 flex max-w-md items-center justify-center rounded-full border border-cream/20 bg-petrol-950/40 px-5 py-3 backdrop-blur-sm">
            <Weather compact />
          </div>

          <div className="mt-8">
            <Countdown iso={TRIP.boardingISO} label={t("boardingLabel")} />
          </div>
        </div>
      </section>

      {/* -------- Concierge: o que faço agora -------- */}
      <section className="container-editorial relative z-20 -mt-12">
        <div className="mx-auto max-w-2xl">
          <ConciergeNow />
        </div>
      </section>

      {/* -------- Explorar -------- */}
      <section className="container-editorial mt-6">
        <div className="mx-auto max-w-2xl">
          <Link href="/descobrir" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border text-petrol-600 transition-colors group-hover:border-gold group-hover:text-gold-deep" style={{ borderColor: "var(--line)" }}>
              <Icon name="Grape" size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-serif text-xl font-light leading-tight">{t("exploreBordeaux")}</span>
              <span className="block font-sans text-[12px] text-muted">{t("exploreBordeauxSub")}</span>
            </span>
            <Icon name="ChevronRight" size={18} className="text-muted transition-colors group-hover:text-gold-deep" />
          </Link>
        </div>
      </section>
    </div>
  );
}
