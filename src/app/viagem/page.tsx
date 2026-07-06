"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { useLocale } from "@/components/providers";

const ITEMS = [
  { key: "programacao", href: "/programacao", image: "/photos/hero-dordogne-sunset.jpg" },
  { key: "barco", href: "/barco", image: "/photos/ship-exterior.jpg" },
  { key: "mapa", href: "/mapa", image: "/photos/hero-vignoble.jpg" },
  { key: "documentos", href: "/documentos", image: "/photos/hero-medoc.jpg" },
];

export default function ViagemPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHero section="viagem" small bgImage="/photos/hero-bordeaux.jpg" />
      <div className="container-editorial py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {ITEMS.map((it, i) => (
            <EditorialCard
              key={it.key}
              href={it.href}
              image={it.image}
              title={t(`nav.${it.key}`)}
              subtitle={t(`navd.${it.key}`)}
              ratio="aspect-[16/10]"
              priority={i < 2}
            />
          ))}
        </div>
      </div>
    </>
  );
}
