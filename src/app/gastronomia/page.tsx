"use client";

import { useEffect, useRef, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { ActivityReserve } from "@/components/ActivityReserve";
import { Crumb } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import type { GastronomyItem } from "@/lib/types";

export default function GastronomiaPage() {
  const golf = useGuideKind<GastronomyItem>("gastronomy");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <>
      <PageHero section="gastronomia" small bgImage="/media/golf-cabot-1.jpg" />
      <div className="container-editorial py-10">
        <Crumb href="/descobrir" label="Voltar" />
        <div className="mt-6 space-y-6">
          {golf.map((g, i) => (
            <GolfCard
              key={g.slug}
              item={g}
              priority={i < 2}
              open={openSlug === g.slug}
              onToggle={() => setOpenSlug((slug) => (slug === g.slug ? null : g.slug))}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function GolfCard({
  item,
  priority,
  open,
  onToggle,
}: {
  item: GastronomyItem;
  priority: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const gallery = (item.gallery || []).filter(Boolean).length ? item.gallery!.filter(Boolean) : (item.heroImage ? [item.heroImage] : []);
  const cover = item.heroImage || gallery[0];
  const highlights = (item.highlights || []).filter(Boolean);

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
            {item.subtitle && <p className="mt-1.5 font-serif text-[14px] font-light italic text-cream/95">{item.subtitle}</p>}
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
            {item.subtitle && <p className="mt-1 font-serif text-[15px] font-light italic text-muted">{item.subtitle}</p>}

            <div className="gold-rule mt-4" />

            <p className="mt-4 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>{item.description}</p>

            {highlights.length > 0 && (
              <div className="mt-5 rounded-[14px] border bg-white/40 p-4 sm:p-5" style={{ borderColor: "var(--line)" }}>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Destaques</p>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[13px] leading-snug">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Star" size={11} /></span>
                      <span style={{ color: "var(--text)" }}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(item.teeTime || item.price) && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {item.teeTime && <span className="chip"><Icon name="Clock" size={13} /> {item.teeTime}</span>}
                {item.price && <span className="chip"><Icon name="Coins" size={13} /> {item.price}</span>}
              </div>
            )}

            {/* Site oficial + Reservar — mesmo tamanho (largura total), empilhados. */}
            <div className="mt-5 flex flex-col gap-3">
              {item.website && (
                <a href={item.website.startsWith("http") ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer"
                  className="btn-primary w-full !rounded-[10px] !px-4 !py-3 text-[12px]">
                  <Icon name="Globe" size={15} /> Site oficial
                </a>
              )}
              {/* Mesma reserva do dia: usa a atividade da programação (activityKey) quando vinculada. */}
              <ActivityReserve contentKey={item.activityKey || item.slug} inline />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
