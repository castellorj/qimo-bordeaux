"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { useGuideKind } from "@/components/GuideContent";
import type { City } from "@/lib/types";

export default function CidadesPage() {
  const cities = useGuideKind<City>("city");
  return (
    <>
      <PageHero section="cidades" small bgImage="/photos/hero-saint-emilion.jpg" />
      <div className="container-editorial py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c, i) => (
            <EditorialCard
              key={c.slug}
              href={`/cidades/${c.slug}`}
              image={c.heroImage}
              kicker={c.region}
              title={c.name}
              subtitle={c.tagline}
              favoriteId={`city:${c.slug}`}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
