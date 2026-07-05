"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useLocale } from "./providers";
import { orderByKeys } from "@/lib/nav";

export interface HubItem {
  href: string;
  icon: string;
  key: string; // nav.<key> / navd.<key>
  image?: string;
}

// Card grande com foto (usado em Descobrir)
export function HubGridPhotos({ items, orderKey }: { items: HubItem[]; orderKey?: string }) {
  const { t, cfg } = useLocale();
  const visible = orderByKeys(items, orderKey ? cfg(`navorder.${orderKey}`) : undefined).filter((it) => cfg(`navhide.${it.key}`) !== "1");
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {visible.map((it) => (
        <Link key={it.href} href={it.href} className="card card-hover group relative overflow-hidden">
          <div className="relative h-44 overflow-hidden sm:h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.image}
              alt={t(`nav.${it.key}`)}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <div>
                <h2 className="font-serif text-2xl font-light text-cream">{t(`nav.${it.key}`)}</h2>
                <p className="mt-0.5 font-sans text-[12px] text-cream/70">{t(`navd.${it.key}`)}</p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/90 text-petrol-700 transition-colors group-hover:bg-cream">
                <Icon name="ArrowRight" size={16} />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Card com ícone (usado em Viagem / Mais)
export function HubGridIcons({ items, orderKey }: { items: HubItem[]; orderKey?: string }) {
  const { t, cfg } = useLocale();
  const visible = orderByKeys(items, orderKey ? cfg(`navorder.${orderKey}`) : undefined).filter((it) => cfg(`navhide.${it.key}`) !== "1");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((it) => (
        <Link key={it.href + it.key} href={it.href} className="card card-hover group flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border text-petrol-600 transition-colors group-hover:border-gold group-hover:text-gold-deep" style={{ borderColor: "var(--line)" }}>
            <Icon name={cfg(`navicon.${it.key}`) || it.icon} size={22} />
          </span>
          <span className="flex-1">
            <span className="block font-serif text-xl font-light leading-tight">{t(`nav.${it.key}`)}</span>
            <span className="block font-sans text-[12px] text-muted">{t(`navd.${it.key}`)}</span>
          </span>
          <Icon name="ChevronRight" size={18} className="text-muted transition-colors group-hover:text-gold-deep" />
        </Link>
      ))}
    </div>
  );
}
