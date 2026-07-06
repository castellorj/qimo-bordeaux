"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { useGuideKind } from "@/components/GuideContent";
import type { Restaurant } from "@/lib/types";

export default function RestaurantesPage() {
  const restaurants = useGuideKind<Restaurant>("restaurant");
  return (
    <>
      <PageHero section="restaurantes" small bgImage="/photos/food-entrecote.jpg" />
      <div className="container-editorial py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r, i) => (
            <EditorialCard
              key={r.slug}
              href={`/restaurantes/${r.slug}`}
              image={r.heroImage}
              kicker={r.stars ? `${r.city} · ${r.stars}` : r.city}
              title={r.name}
              subtitle={r.chef || r.specialty}
              favoriteId={`resto:${r.slug}`}
              seal={r.qimoSelect}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
