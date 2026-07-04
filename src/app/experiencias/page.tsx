"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ActionBar } from "@/components/ActionBar";
import { experienceActions } from "@/lib/reserve";
import { useGuideKind } from "@/components/GuideContent";
import type { Experience } from "@/lib/types";

export default function ExperienciasPage() {
  const experiences = useGuideKind<Experience>("experience");
  return (
    <>
      <PageHero section="experiencias" />
      <div className="container-editorial py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((e, i) => (
            <article key={e.slug} id={e.slug} className="card card-hover group scroll-mt-24 flex flex-col overflow-hidden">
              <div className="relative">
                <SmartImage src={e.heroImage} alt={e.name} label={e.category} ratio="aspect-[4/3]" priority={i < 3} />
                <div className="absolute right-3 top-3">
                  <FavoriteButton id={`exp:${e.slug}`} floating />
                </div>
                {e.qimoSelect && (
                  <div className="absolute bottom-3 left-3">
                    <QimoSeal />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-gold">{e.category}</span>
                <h2 className="mt-1.5 font-serif text-xl font-light leading-tight">{e.name}</h2>
                <p className="mt-2 flex-1 font-sans text-[13px] leading-relaxed text-muted">{e.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {e.location && <Pill icon="MapPin">{e.location}</Pill>}
                  {e.duration && <Pill icon="Clock">{e.duration}</Pill>}
                  {e.relatedDay && (
                    <Link href={`/programacao#dia-${e.relatedDay}`} className="chip hover:text-gold">
                      <Icon name="CalendarDays" size={13} /> Dia {e.relatedDay}
                    </Link>
                  )}
                </div>
                <div className="mt-5">
                  <ActionBar actions={experienceActions(e)} conciergeNote />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
