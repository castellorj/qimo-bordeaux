"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { Crumb } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import type { City } from "@/lib/types";

export default function CidadesPage() {
  const cities = useGuideKind<City>("city");
  return (
    <>
      <PageHero section="cidades" small bgImage="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Place_de_la_Bourse%2C_Bordeaux%2C_France.jpg/1280px-Place_de_la_Bourse%2C_Bordeaux%2C_France.jpg" />
      <div className="container-editorial py-10">
        <Crumb href="/descobrir" label="Voltar" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c, i) => (
            <EditorialCard
              key={c.slug}
              href={`/cidades/${c.slug}`}
              image={c.heroImage}
              kicker={c.region}
              title={c.name}
              subtitle={c.tagline}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </>
  );
}
