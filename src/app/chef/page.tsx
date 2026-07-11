"use client";

import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { QimoSeal } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import { qimoWhatsApp } from "@/lib/reserve";
import type { ChefExperience } from "@/lib/types";

export default function ChefPage() {
  const items = useGuideKind<ChefExperience>("chef");

  return (
    <>
      <PageHero section="chef" small bgImage="/photos/ship-dining.jpg" />

      <div className="container-editorial py-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="kicker">Curadoria de Thomas Troisgros</p>
          <p className="prose-luxe mx-auto mt-4">
            Experiências gastronômicas exclusivas, criadas para os hóspedes da QIMO e reservadas à parte.
            Vagas limitadas — fale com a nossa equipe para garantir a sua.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((e, i) => (
            <article key={e.slug} className="card card-hover flex flex-col overflow-hidden">
              <div className="relative aspect-[16/10] photo-placeholder">
                {e.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.heroImage} alt={e.name} loading={i < 2 ? undefined : "lazy"} decoding="async"
                    className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="scrim-bottom absolute inset-0" />
                {e.qimoSelect && (
                  <div className="chip-on-photo absolute left-3 top-3 !border-gold/50 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-soft">
                    <Icon name="Star" size={11} /> Seleção QIMO
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5" style={{ textShadow: "0 1px 16px rgba(12,4,7,.85)" }}>
                  {e.category && <p className="font-sans text-[10px] uppercase tracking-luxe text-gold-soft">{e.category}</p>}
                  <h2 className="mt-1 font-serif text-2xl font-light leading-[1.1] text-cream">{e.name}</h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                {e.chef && <p className="kicker-muted flex items-center gap-1.5"><Icon name="Sparkles" size={12} /> {e.chef}</p>}
                <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{e.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {e.duration && <span className="chip"><Icon name="Clock" size={13} /> {e.duration}</span>}
                  {e.price && <span className="chip"><Icon name="Coins" size={13} /> {e.price}</span>}
                </div>
                <a
                  href={qimoWhatsApp(`Olá! Tenho interesse na experiência Chef "${e.name}". Podem me passar detalhes e disponibilidade?`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-primary mt-4 w-full !rounded-[10px] !px-4 !py-2.5 !tracking-wide text-[12px]"
                >
                  <Icon name="MessageCircle" size={15} /> Reservar com a QIMO
                </a>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-center text-muted">Em breve — experiências sendo finalizadas.</p>
          )}
        </div>
      </div>
    </>
  );
}
