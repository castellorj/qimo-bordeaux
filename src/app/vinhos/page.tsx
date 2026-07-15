"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { Crumb } from "@/components/ui";
import { useGuideKind } from "@/components/GuideContent";
import type { Appellation } from "@/lib/types";

const BANKS: { key: string; label: string; desc: string }[] = [
  { key: "Left", label: "Margem esquerda", desc: "O reino do Cabernet Sauvignon — Médoc, Graves" },
  { key: "Right", label: "Margem direita", desc: "O reino do Merlot — Saint-Émilion, Pomerol, Blaye" },
  { key: "Entre-deux", label: "Entre-deux-Mers", desc: "Brancos secos entre a Garonne e a Dordogne" },
  { key: "Sauternais", label: "Sauternais", desc: "O ouro líquido dos vinhos doces" },
];

export default function VinhosPage() {
  const appellations = useGuideKind<Appellation>("wine");
  return (
    <>
      <PageHero section="vinhos" small bgImage="https://www.bordeaux.com/app/uploads/2025/10/dsc_8445-1920x1080.jpg" />
      <div className="container-editorial space-y-14 py-10">
        <Crumb href="/descobrir" label="Voltar" />
        {BANKS.map((bank) => {
          const list = appellations.filter((a) => a.bank === bank.key);
          if (!list.length) return null;
          return (
            <div key={bank.key}>
              <h2 className="display text-2xl sm:text-3xl">{bank.label}</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((a, i) => (
                  <EditorialCard
                    key={a.slug}
                    href={`/vinhos/${a.slug}`}
                    image={a.heroImage}
                    kicker={a.color}
                    title={a.name}
                    subtitle={a.tagline}
                    ratio="aspect-[4/3] sm:aspect-[5/4]"
                    priority={i < 3}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
