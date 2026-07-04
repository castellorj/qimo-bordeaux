import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { FavoriteButton, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { getWines } from "@/lib/content-db";

export const metadata: Metadata = { title: "Vinhos" };

const BANKS: { key: string; label: string; desc: string }[] = [
  { key: "Left", label: "Margem esquerda", desc: "O reino do Cabernet Sauvignon — Médoc, Graves" },
  { key: "Right", label: "Margem direita", desc: "O reino do Merlot — Saint-Émilion, Pomerol, Blaye" },
  { key: "Entre-deux", label: "Entre-deux-Mers", desc: "Brancos secos entre a Garonne e a Dordogne" },
  { key: "Sauternais", label: "Sauternais", desc: "O ouro líquido dos vinhos doces" },
];

export default async function VinhosPage() {
  const appellations = await getWines();
  return (
    <>
      <PageHero section="vinhos" />
      <div className="container-editorial space-y-16 py-14">
        {BANKS.map((bank) => {
          const list = appellations.filter((a) => a.bank === bank.key);
          if (!list.length) return null;
          return (
            <div key={bank.key}>
              <div className="flex items-baseline justify-between border-b pb-4" style={{ borderColor: "var(--line)" }}>
                <h2 className="display text-2xl sm:text-3xl">{bank.label}</h2>
                <p className="hidden font-sans text-[12px] text-muted sm:block">{bank.desc}</p>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((a) => (
                  <Link key={a.slug} href={`/vinhos/${a.slug}`} className="card card-hover group relative overflow-hidden">
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteButton id={`wine:${a.slug}`} floating />
                    </div>
                    <div className="relative h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.heroImage} alt={a.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/75 via-petrol-950/10 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <Pill icon="Wine">{a.color}</Pill>
                      </div>
                    </div>
                    <div className="p-6 pt-5">
                      <h3 className="font-serif text-2xl font-light leading-tight">{a.name}</h3>
                      <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{a.tagline}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {a.grapes.slice(0, 3).map((g) => (
                          <span key={g} className="font-sans text-[10px] uppercase tracking-wide text-gold">
                            {g}
                          </span>
                        ))}
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wide2 transition-colors group-hover:text-gold">
                        Detalhes <Icon name="ArrowRight" size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
