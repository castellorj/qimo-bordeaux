"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { PhotoImg } from "./PhotoImg";
import { useLocale } from "./providers";
import { orderByKeys } from "@/lib/nav";
import { cleanSiteImage } from "@/lib/siteImages";

export interface HubItem {
  href: string;
  icon: string;
  key: string; // nav.<key> / navd.<key>
  image?: string;
}

// Card grande com foto (usado em Descobrir)
export function HubGridPhotos({ items, orderKey }: { items: HubItem[]; orderKey?: string }) {
  const { t, cfg, settingsReady } = useLocale();
  const visible = orderByKeys(items, orderKey ? cfg(`navorder.${orderKey}`) : undefined).filter((it) => cfg(`navhide.${it.key}`) !== "1");
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {visible.map((it) => (
        <Link key={it.href} href={it.href} className="card card-hover group relative overflow-hidden">
          <div className="relative h-44 overflow-hidden sm:h-52">
            <PhotoImg
              src={cleanSiteImage(cfg(`img.hub.${it.key}`)) || (settingsReady ? cleanSiteImage(it.image) : undefined)}
              alt={t(`nav.${it.key}`)}
              sizes="(min-width:640px) 50vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
            />
            <div className="scrim-bottom absolute inset-0" />
            <div className="text-on-photo absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
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

// Grade compacta ícone + rótulo (usada em Mais) — 2 colunas inclusive no mobile.
export function HubGridIcons({ items, orderKey }: { items: HubItem[]; orderKey?: string }) {
  const { t, cfg } = useLocale();
  const visible = orderByKeys(items, orderKey ? cfg(`navorder.${orderKey}`) : undefined).filter((it) => cfg(`navhide.${it.key}`) !== "1");
  return (
    <div className="grid grid-cols-2 gap-3">
      {visible.map((it) => (
        <Link key={it.href + it.key} href={it.href} className="card card-hover group flex items-center gap-3 p-4">
          <span className="shrink-0 text-gold-deep transition-transform group-hover:scale-110">
            <Icon name={cfg(`navicon.${it.key}`) || it.icon} size={22} />
          </span>
          <span className="min-w-0 font-serif text-[17px] font-light leading-tight" style={{ color: "var(--text)" }}>
            {t(`nav.${it.key}`)}
          </span>
        </Link>
      ))}
    </div>
  );
}
