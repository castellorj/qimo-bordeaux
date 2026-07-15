"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { Crumb } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import type { Experience } from "@/lib/types";

export default function ExperienciasPage() {
  const experiences = useGuideKind<Experience>("experience");
  return (
    <>
      <PageHero section="experiencias" small bgImage="/photos/wine-glass.jpg" />
      <div className="container-editorial py-10">
        <Crumb href="/descobrir" label="Voltar" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((e, i) => (
            <EditorialCard
              key={e.slug}
              href={`/experiencias/${e.slug}`}
              image={e.heroImage}
              kicker={e.category}
              title={e.name}
              subtitle={e.location || e.duration}
              seal={e.qimoSelect}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
