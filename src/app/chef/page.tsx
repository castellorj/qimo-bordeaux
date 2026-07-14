"use client";

import { useRef, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { useGuideKind } from "@/components/GuideContent";
import { useLocale } from "@/components/providers";
import { qimoWhatsApp } from "@/lib/reserve";
import type { ChefExperience } from "@/lib/types";

export default function ChefPage() {
  const { t } = useLocale();
  const items = useGuideKind<ChefExperience>("chef");
  const [openSlug, setOpenSlug] = useState<string | null>(items[0]?.slug ?? null);

  return (
    <>
      <PageHero section="chef" small bgImage="/photos/ship-dining.jpg" />

      <div className="container-editorial py-12">
        <div className="space-y-6">
          {items.map((item, i) => (
            <ChefExperienceCard
              key={item.slug}
              item={item}
              priority={i < 2}
              open={openSlug === item.slug}
              ctaLabel={t("chef.cta")}
              onToggle={() => setOpenSlug((slug) => (slug === item.slug ? null : item.slug))}
            />
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted">{t("chef.empty")}</p>
          )}
        </div>
      </div>
    </>
  );
}

function ChefExperienceCard({
  item,
  priority,
  open,
  ctaLabel,
  onToggle,
}: {
  item: ChefExperience;
  priority: boolean;
  open: boolean;
  ctaLabel: string;
  onToggle: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  const close = () => {
    onToggle();
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <section ref={sectionRef} className="scroll-mt-32">
      <button
        type="button"
        onClick={open ? close : onToggle}
        aria-expanded={open}
        className="block w-full overflow-hidden rounded-[20px] text-left shadow-card"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.04] sm:aspect-[21/9]">
          {item.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.heroImage}
              alt={item.name}
              loading={priority ? undefined : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0" style={{ background: "rgba(20,7,11,0.34)" }} />
          <div className="scrim-strong absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to bottom, rgba(139,58,74,0), rgb(139,58,74))" }} />

          {item.qimoSelect && (
            <div className="chip-on-photo absolute left-4 top-4 !border-gold/50 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-soft">
              <Icon name="Star" size={11} /> Seleção QIMO
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-6 pb-7 sm:p-8 sm:pb-8" style={{ textShadow: "0 1px 18px rgba(12,4,7,.85), 0 1px 3px rgba(12,4,7,.7)" }}>
            {item.category && <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{item.category}</p>}
            <h2 className="mt-1 max-w-3xl font-serif text-3xl font-light leading-tight text-cream sm:text-4xl">{item.name}</h2>
            {item.chef && <p className="mt-2 font-serif text-[15px] font-light italic text-cream/95">{item.chef}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 bg-petrol-600 px-4 py-3.5 font-sans text-[12px] font-medium uppercase tracking-wide text-cream">
          {open ? "Ocultar detalhes" : "Ver detalhes"}
          <Icon name="ChevronDown" size={15} className={open ? "rotate-180" : ""} />
        </div>
      </button>

      {open && (
        <div className="animate-fade-up">
          <div className="mt-5 card p-5">
            {item.chef && <p className="kicker-muted flex items-center gap-1.5"><Icon name="Sparkles" size={12} /> {item.chef}</p>}
            <p className="mt-2 font-sans text-[14px] leading-relaxed text-muted">{item.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {item.duration && <span className="chip"><Icon name="Clock" size={13} /> {item.duration}</span>}
              {item.price && <span className="chip"><Icon name="Coins" size={13} /> {item.price}</span>}
            </div>

            <a
              href={qimoWhatsApp(`Olá! Tenho interesse na experiência Chef "${item.name}". Podem me passar detalhes e disponibilidade?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-5 w-full !rounded-[10px] !px-4 !py-3 !tracking-wide text-[12px]"
            >
              <Icon name="CalendarCheck" size={15} /> {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
