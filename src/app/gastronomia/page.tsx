"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { useGuideKind } from "@/components/GuideContent";
import type { GastronomyItem } from "@/lib/types";

export default function GastronomiaPage() {
  const gastronomy = useGuideKind<GastronomyItem>("gastronomy");
  return (
    <>
      <PageHero section="gastronomia" small bgImage="/photos/food-entrecote.jpg" />
      <div className="container-editorial py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gastronomy.map((g, i) => (
            <EditorialCard
              key={g.slug}
              href={`/gastronomia/${g.slug}`}
              image={g.heroImage}
              kicker={g.category}
              title={g.name}
              subtitle={g.pairing}
              favoriteId={`gastro:${g.slug}`}
              seal={g.qimoSelect}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
