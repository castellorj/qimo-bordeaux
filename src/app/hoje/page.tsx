"use client";

import Link from "next/link";
import { ConciergeNow } from "@/components/ConciergeNow";
import { Icon } from "@/components/Icon";
import { TripHero } from "@/components/TripHero";
import { useLocale } from "@/components/providers";

export default function HojePage() {
  const { t } = useLocale();

  return (
    <div className="pb-4">
      {/* -------- Saudação + clima + contagem -------- */}
      <TripHero imageKey="img.hero.hoje" defaultImage="/photos/hero-bordeaux.jpg" />

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
