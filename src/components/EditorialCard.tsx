"use client";

import Link from "next/link";
import { FavoriteButton, QimoSeal } from "./ui";

/**
 * Card editorial estilo capa de revista: a fotografia É o card.
 * Foto grande + gradiente + (kicker) título + uma frase. Nada mais.
 * Todo o detalhe vive na página de detalhe (disclosure progressivo).
 */
export function EditorialCard({
  href, image, kicker, title, subtitle, favoriteId, seal = false,
  ratio = "aspect-[4/5]", priority = false,
}: {
  href: string;
  image?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  favoriteId?: string;
  seal?: boolean;
  ratio?: string;
  priority?: boolean;
}) {
  return (
    <Link href={href} className={`group relative block ${ratio} overflow-hidden rounded-[18px] photo-placeholder`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={title}
          loading={priority ? undefined : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-luxe group-hover:scale-[1.05]"
        />
      )}
      <div className="scrim-bottom absolute inset-0" />

      {favoriteId && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton id={favoriteId} floating />
        </div>
      )}
      {seal && (
        <div className="absolute left-3 top-3 z-10">
          <QimoSeal />
        </div>
      )}

      <div className="text-on-photo absolute inset-x-0 bottom-0 p-5 sm:p-6">
        {kicker && <p className="font-sans text-[10px] uppercase tracking-luxe text-gold-soft">{kicker}</p>}
        <h3 className="mt-1.5 font-serif text-2xl font-light leading-[1.1] text-cream sm:text-[28px]">{title}</h3>
        {subtitle && <p className="mt-1.5 line-clamp-1 font-serif text-[14px] font-light italic text-cream/80">{subtitle}</p>}
      </div>
    </Link>
  );
}
