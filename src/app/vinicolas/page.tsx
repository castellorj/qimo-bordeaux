"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { Crumb } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import type { Winery } from "@/lib/types";

export default function VinicolasPage() {
  const wineries = useGuideKind<Winery>("winery");
  return (
    <>
      <PageHero section="vinicolas" small bgImage="/photos/hero-lafite.jpg" />
      <div className="container-editorial py-10">
        <Crumb href="/descobrir" label="Voltar" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wineries.map((w, i) => (
            <EditorialCard
              key={w.slug}
              href={`/vinicolas/${w.slug}`}
              image={w.heroImage}
              kicker={w.appellation}
              title={w.name}
              subtitle={w.classification}
              seal={w.qimoSelect}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
