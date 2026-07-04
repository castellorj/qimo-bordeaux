import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { getWineries } from "@/lib/content-db";

export const metadata: Metadata = { title: "Vinícolas" };

export default async function VinicolasPage() {
  const wineries = await getWineries();
  return (
    <>
      <PageHero section="vinicolas" />
      <div className="container-editorial py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {wineries.map((w) => (
            <Link key={w.slug} href={`/vinicolas/${w.slug}`} className="card card-hover group relative flex flex-col overflow-hidden sm:flex-row">
              <div className="relative sm:w-52 sm:shrink-0">
                <SmartImage src={w.heroImage} alt={w.name} label={w.appellation} ratio="aspect-[4/3]" />
                <div className="absolute right-3 top-3">
                  <FavoriteButton id={`winery:${w.slug}`} floating />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[11px] uppercase tracking-wide2 text-gold">{w.appellation}</span>
                </div>
                <h2 className="mt-1.5 font-serif text-2xl font-light leading-tight">{w.name}</h2>
                {w.classification && <p className="mt-1 font-sans text-[12px] text-muted">{w.classification}</p>}
                <p className="mt-3 line-clamp-3 font-sans text-[13px] leading-relaxed text-muted">{w.history}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {w.qimoSelect && <QimoSeal />}
                  {w.visitedOnDays && <Pill icon="CalendarDays">Dia {w.visitedOnDays.join(", ")}</Pill>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
