"use client";

import { useEffect, useRef, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { useGuideItem, useGuideList } from "@/components/GuideContent";
import { useLocale, useReservations } from "@/components/providers";
import { ActivityReserve } from "@/components/ActivityReserve";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { qimoWhatsApp } from "@/lib/reserve";
import { chefProfile as fileChefProfile, getDay } from "@/content";
import type { ChefExperience, ChefProfile } from "@/lib/types";

export default function ChefPage() {
  const { t } = useLocale();
  const items = useGuideList<ChefExperience>("chef");
  const profile = useGuideItem<ChefProfile>("chef_profile", "thomas-troisgros") ?? fileChefProfile;
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <>
      <PageHero section="chef" small bgImage="/photos/ship-dining.jpg" kickerOnly imageOnly />

      <div className="container-editorial py-12">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-serif text-[32px] font-light leading-tight text-petrol-700 sm:text-5xl">
            {t("hero.chef.k").replace("Curadoria", "Curadoria Chef")}
          </h1>
          <div className="gold-rule mx-auto mt-5" />
          <p className="mx-auto mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-muted sm:text-[17px]">{t("hero.chef.i")}</p>
        </div>

        <ThomasTroisgrosSection profile={profile} />

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

function ThomasTroisgrosSection({ profile }: { profile: ChefProfile }) {
  const recognitions = [
    {
      icon: "Star",
      label: profile.michelinLabel,
      text: profile.michelinText,
    },
    {
      icon: "Sparkles",
      label: profile.hotListLabel,
      text: profile.hotListText,
    },
    {
      icon: "CircleCheck",
      label: profile.bestChefLabel,
      text: profile.bestChefText,
    },
    {
      icon: "TrendingUp",
      label: profile.fiftyBestLabel,
      text: profile.fiftyBestText,
    },
    {
      icon: "UtensilsCrossed",
      label: profile.lineageLabel,
      text: profile.lineageText,
    },
  ].filter((item) => item.label && item.text);

  return (
    <section className="mb-12 overflow-hidden rounded-[3px] border" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="border-b p-7 sm:p-9 lg:border-b-0 lg:border-r" style={{ borderColor: "var(--line)" }}>
          <p className="kicker">{profile.kicker}</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">{profile.title}</h2>
          <div className="gold-rule mt-5" />
          <p className="prose-luxe mt-5">
            {profile.lead}
          </p>
          {profile.body && <p className="mt-5 font-sans text-[13px] leading-relaxed text-muted">{profile.body}</p>}
        </div>

        <div className="p-7 sm:p-9">
          <p className="kicker-muted">Reconhecimentos</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {recognitions.map((item) => (
              <div key={item.label} className="rounded-[3px] border bg-white/35 p-4" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/12 text-gold-deep">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-wide2 text-petrol-700">{item.label}</p>
                </div>
                <p className="mt-3 font-sans text-[13px] leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[3px] border bg-[#fbf7f0] p-4" style={{ borderColor: "var(--line)" }}>
            <p className="font-serif text-[19px] font-light leading-snug text-petrol-700">
              {profile.closingQuote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function chefDescription(description: string) {
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return {
    lead: sentences[0] || description,
    body: sentences.slice(1),
  };
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
  const text = chefDescription(item.description);
  const { reservableByKey } = useReservations();
  const rv = reservableByKey.get(item.slug);
  const hasReserve = !!rv;
  const gallery = item.gallery?.filter(Boolean).length ? item.gallery.filter(Boolean) : (item.heroImage ? [item.heroImage] : []);
  const cover = item.heroImage || gallery[0]; // usa a CAPA selecionada (heroImage), não a 1ª da galeria
  const dayDate = rv?.dayNumber != null ? getDay(rv.dayNumber)?.date : null;

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [open]);

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
        className="group block w-full overflow-hidden rounded-[20px] text-left shadow-card"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.04] sm:aspect-[21/9]">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={item.name}
              loading={priority ? undefined : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-0" style={{ background: "rgba(20,7,11,0.34)" }} />
          <div className="scrim-strong absolute inset-0" />

          {item.qimoSelect && (
            <div className="chip-on-photo absolute left-4 top-4 !border-gold/50 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-soft">
              <Icon name="Star" size={11} /> Seleção QIMO
            </div>
          )}

          {gallery.length > 1 && (
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 font-sans text-[11px] font-medium text-white backdrop-blur">
              <Icon name="Camera" size={12} /> {gallery.length} fotos
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 pb-6 sm:p-7 sm:pb-7" style={{ textShadow: "0 1px 18px rgba(12,4,7,.85), 0 1px 3px rgba(12,4,7,.7)" }}>
            {item.category && <p className="font-sans text-[10px] uppercase tracking-luxe text-gold-soft">{item.category}</p>}
            <h2 className="mt-1 max-w-3xl font-serif text-[26px] font-light leading-[1.08] text-cream sm:text-[32px]">{item.name}</h2>
            {item.chef && <p className="mt-1.5 font-serif text-[14px] font-light italic text-cream/95">com {item.chef}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-t bg-petrol-600 px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-cream shadow-[inset_0_1px_0_rgba(255,255,255,.16)]" style={{ borderColor: "rgba(255,255,255,.18)" }}>
          {open ? "Ocultar detalhes" : gallery.length > 1 ? "Ver fotos e detalhes" : "Ver detalhes"}
          <Icon name="ChevronDown" size={15} className={open ? "rotate-180" : ""} />
        </div>
      </button>

      {open && (
        <div className="animate-fade-up mt-5 overflow-hidden rounded-[20px] border shadow-card" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          {gallery.length > 0 && (
            <div className="p-3 pb-0 sm:p-4 sm:pb-0">
              <PhotoCarousel images={gallery} alt={item.name} />
            </div>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {item.category && <span className="font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-deep">{item.category}</span>}
              {item.qimoSelect && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/12 px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide2 text-gold-deep">
                  <Icon name="Star" size={10} /> Seleção QIMO
                </span>
              )}
            </div>

            <h3 className="mt-2 font-serif text-2xl font-light leading-tight text-petrol-700 sm:text-[28px]">{item.name}</h3>
            {item.chef && <p className="mt-1 font-serif text-[15px] font-light italic text-muted">com {item.chef}</p>}

            {item.tagline && (
              <p className="mt-4 font-serif text-[20px] font-light italic leading-snug text-petrol-700 sm:text-[22px]">{item.tagline}</p>
            )}

            <div className="gold-rule mt-4" />

            <div className="mt-4 space-y-3">
              <p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>{text.lead}</p>
              {text.body.map((paragraph, index) => (
                <p key={index} className="font-sans text-[13px] leading-relaxed text-muted">{paragraph}</p>
              ))}
            </div>

            {item.highlights && item.highlights.length > 0 && (
              <div className="mt-5 rounded-[14px] border bg-white/40 p-4 sm:p-5" style={{ borderColor: "var(--line)" }}>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">O que torna especial</p>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[13px] leading-snug">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Check" size={12} /></span>
                      <span style={{ color: "var(--text)" }}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(rv?.dayNumber != null || rv?.startTime || item.price || item.duration) && (
              <div className="mt-5 rounded-[16px] border p-4 sm:p-5" style={{ borderColor: "color-mix(in srgb, var(--gold) 45%, var(--line))", background: "color-mix(in srgb, var(--gold) 8%, transparent)" }}>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  {(rv?.dayNumber != null || rv?.startTime) && (
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="CalendarCheck" size={16} /></span>
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Quando</p>
                        <p className="font-serif text-[18px] font-light leading-tight text-petrol-700">{[rv?.dayNumber != null ? `Dia ${rv.dayNumber}` : null, rv?.startTime].filter(Boolean).join(" · ")}</p>
                        {dayDate && <p className="mt-0.5 font-sans text-[12px] capitalize text-muted">{new Date(dayDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>}
                      </div>
                    </div>
                  )}
                  {item.price && (
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Coins" size={16} /></span>
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Valor</p>
                        <p className="font-serif text-[18px] font-light leading-tight text-petrol-700">{item.price}</p>
                      </div>
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Clock" size={16} /></span>
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Duração</p>
                        <p className="font-serif text-[18px] font-light leading-tight text-petrol-700">{item.duration}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasReserve ? (
              <ActivityReserve contentKey={item.slug} />
            ) : (
              <a
                href={qimoWhatsApp(`Olá! Tenho interesse na experiência Chef "${item.name}". Podem me passar detalhes e disponibilidade?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-5 w-full !rounded-[10px] !px-4 !py-3 !tracking-wide text-[12px]"
              >
                <Icon name="CalendarCheck" size={15} /> {ctaLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
