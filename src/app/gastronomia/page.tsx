"use client";

import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useGuideKind } from "@/components/GuideContent";
import { Editable } from "@/components/Editable";
import type { GastronomyItem } from "@/lib/types";

export default function GastronomiaPage() {
  const gastronomy = useGuideKind<GastronomyItem>("gastronomy");
  return (
    <>
      <PageHero section="gastronomia" />
      <div className="container-editorial py-14">
        <div className="grid gap-8 md:grid-cols-2">
          {gastronomy.map((g, i) => (
            <article key={g.slug} id={g.slug} className="card card-hover group scroll-mt-24 overflow-hidden">
              <div className="relative">
                <SmartImage src={g.heroImage} alt={g.name} label={g.name} ratio="aspect-[16/9]" priority={i < 2} />
                <div className="absolute right-3 top-3">
                  <FavoriteButton id={`gastro:${g.slug}`} floating />
                </div>
                <div className="absolute left-3 top-3">
                  <Pill icon="Utensils">{g.category}</Pill>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <Editable as="h2" kind="gastronomy" slug={g.slug} field="name" value={g.name} label="Nome" className="font-serif text-2xl font-light">{g.name}</Editable>
                  {g.qimoSelect && <QimoSeal />}
                </div>
                <Editable as="p" kind="gastronomy" slug={g.slug} field="description" value={g.description} label="Descrição" multiline className="mt-3 font-sans text-[14px] leading-relaxed text-muted">{g.description}</Editable>

                <h3 className="kicker mt-5 flex items-center gap-2"><Icon name="MapPin" size={13} /> Onde provar</h3>
                <Editable as="ul" kind="gastronomy" slug={g.slug} field="whereToTry" value={g.whereToTry} label="Onde provar" multiline className="mt-2 space-y-1.5">
                  {g.whereToTry.map((w, j) => (
                    <li key={j} className="flex items-start gap-2.5 font-sans text-[13px] text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {w}
                    </li>
                  ))}
                </Editable>

                {g.pairing && (
                  <Editable as="p" kind="gastronomy" slug={g.slug} field="pairing" value={g.pairing} label="Harmonização" multiline className="mt-4 flex items-start gap-2 font-sans text-[13px] italic text-muted">
                    <Icon name="Wine" size={14} className="mt-0.5 shrink-0 text-gold" />
                    {g.pairing}
                  </Editable>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
