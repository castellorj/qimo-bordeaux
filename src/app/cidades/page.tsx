import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { FavoriteButton, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { getCities } from "@/lib/content-db";

export const metadata: Metadata = { title: "Cidades" };

export default async function CidadesPage() {
  const cities = await getCities();
  return (
    <>
      <PageHero section="cidades" />
      <div className="container-editorial py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <Link key={c.slug} href={`/cidades/${c.slug}`} className="card card-hover group relative overflow-hidden">
              <div className="absolute right-3 top-3 z-10">
                <FavoriteButton id={`city:${c.slug}`} floating />
              </div>
              <SmartImage src={c.heroImage} alt={c.name} label={c.name} ratio="aspect-[3/2]" />
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <Pill icon="Anchor">Dias {c.visitedOnDays.join(", ")}</Pill>
                </div>
                <h2 className="mt-3 font-serif text-2xl font-light leading-tight">{c.name}</h2>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-wide2 text-gold">{c.region}</p>
                <p className="mt-3 font-sans text-[13px] leading-relaxed text-muted">{c.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wide2 text-current transition-colors group-hover:text-gold">
                  Explorar <Icon name="ArrowRight" size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
