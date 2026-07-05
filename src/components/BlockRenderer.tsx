"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import type { Block } from "@/lib/blocks";

function BannerBlock({ b }: { b: Block }) {
  return (
    <section className="relative">
      <SmartImage src={b.image || ""} alt={b.title || ""} label={b.title} ratio="aspect-[16/9] sm:aspect-[21/9]" />
      <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
      <div className="container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
        {b.title && <h1 className="display text-4xl text-cream sm:text-6xl">{b.title}</h1>}
        {b.subtitle && <p className="mt-2 max-w-xl font-serif text-lg font-light italic text-cream/80">{b.subtitle}</p>}
      </div>
    </section>
  );
}

export function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "banner":
      return <BannerBlock b={b} />;
    case "heading":
      return (
        <div>
          {b.kicker && <p className="kicker">{b.kicker}</p>}
          <h2 className="display mt-1 text-2xl sm:text-3xl">{b.text}</h2>
        </div>
      );
    case "text":
      return <p className="prose-luxe max-w-2xl whitespace-pre-line">{b.body}</p>;
    case "image":
      return (
        <figure>
          <SmartImage src={b.url || ""} alt={b.caption || ""} ratio="aspect-[16/9]" className="rounded-[16px] overflow-hidden" />
          {b.caption && <figcaption className="mt-2 font-sans text-[12px] italic text-muted">{b.caption}</figcaption>}
        </figure>
      );
    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(b.images || []).map((src, i) => (
            <SmartImage key={i} src={src} alt="" ratio="aspect-square" className="rounded-[12px] overflow-hidden" />
          ))}
        </div>
      );
    case "list":
      return (
        <div>
          {b.title && <h3 className="kicker flex items-center gap-2"><Icon name={b.icon || "Compass"} size={14} /> {b.title}</h3>}
          <ul className="mt-4 space-y-2.5">
            {(b.items || []).map((it, i) => (
              <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />{it}
              </li>
            ))}
          </ul>
        </div>
      );
    case "button": {
      const cls = b.style === "ghost" ? "btn-ghost" : "btn-primary";
      const href = b.href || "#";
      const external = /^https?:\/\//.test(href);
      return external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}><Icon name="Navigation" size={15} /> {b.label}</a>
      ) : (
        <Link href={href} className={cls}>{b.label}</Link>
      );
    }
    case "divider":
      return <div className="hairline" />;
    default:
      return null;
  }
}

// Blocos que ocupam a largura toda (fora do container). Os demais ficam no container.
const FULL_BLEED = new Set(["banner"]);

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((b) =>
        FULL_BLEED.has(b.type) ? (
          <BlockView key={b.id} b={b} />
        ) : (
          <div key={b.id} className="container-editorial">
            <BlockView b={b} />
          </div>
        )
      )}
    </div>
  );
}
