"use client";

import Link from "next/link";
import clsx from "clsx";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import type { Block, BlockButton } from "@/lib/blocks";

function ButtonLink({ button }: { button: BlockButton }) {
  const cls = button.style === "ghost" ? "btn-ghost" : "btn-primary";
  const href = button.href || "#";
  const external = /^https?:\/\//.test(href);
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}><Icon name="Navigation" size={15} /> {button.label}</a>
  ) : (
    <Link href={href} className={cls}>{button.label}</Link>
  );
}

function columnsClass(b: Block) {
  const mobile = b.columnsMobile === 2 ? "grid-cols-2" : "grid-cols-1";
  const tablet = b.columnsTablet === 3 ? "sm:grid-cols-3" : b.columnsTablet === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";
  const desktop = b.columnsDesktop === 4 ? "lg:grid-cols-4" : b.columnsDesktop === 2 ? "lg:grid-cols-2" : b.columnsDesktop === 1 ? "lg:grid-cols-1" : "lg:grid-cols-3";
  return `${mobile} ${tablet} ${desktop}`;
}

function videoEmbed(url?: string) {
  if (!url) return "";
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function BannerBlock({ b }: { b: Block }) {
  return (
    <section className="relative">
      <SmartImage src={b.image || ""} alt={b.title || ""} label={b.title} ratio="aspect-[16/9] sm:aspect-[21/9]" />
      <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
      <div className={clsx("container-editorial absolute inset-x-0 bottom-0 z-10 pb-8", b.align === "center" && "text-center")}>
        {b.title && <h1 className="display text-4xl text-cream sm:text-6xl">{b.title}</h1>}
        {b.subtitle && <p className={clsx("mt-2 max-w-xl font-serif text-lg font-light italic text-cream/80", b.align === "center" && "mx-auto")}>{b.subtitle}</p>}
      </div>
    </section>
  );
}

export function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "seo":
      return null;
    case "banner":
      return <BannerBlock b={b} />;
    case "heading":
      return (
        <div className={clsx(b.align === "center" && "text-center")}>
          {b.kicker && <p className="kicker">{b.kicker}</p>}
          <h2 className="display mt-1 text-2xl sm:text-3xl">{b.text}</h2>
        </div>
      );
    case "text":
      return <p className={clsx("prose-luxe whitespace-pre-line", b.align === "center" && "mx-auto text-center")}>{b.body}</p>;
    case "image":
      return (
        <figure>
          <SmartImage src={b.url || ""} alt={b.caption || ""} ratio="aspect-[16/9]" className="overflow-hidden rounded-[16px]" />
          {b.caption && <figcaption className={clsx("mt-2 font-sans text-[12px] italic text-muted", b.align === "center" && "text-center")}>{b.caption}</figcaption>}
        </figure>
      );
    case "gallery":
      return (
        <div className={clsx("grid gap-3", columnsClass(b))}>
          {(b.images || []).map((src, i) => (
            <SmartImage key={i} src={src} alt="" ratio="aspect-square" className="overflow-hidden rounded-[12px]" />
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
    case "button":
      return <ButtonLink button={{ label: b.label || "Saiba mais", href: b.href || "#", style: b.style }} />;
    case "cta":
      return (
        <div className={clsx("rounded-[14px] border p-6 sm:p-8", b.align === "center" && "text-center")} style={{ borderColor: "var(--line)" }}>
          {b.kicker && <p className="kicker">{b.kicker}</p>}
          {b.title && <h2 className="display mt-1 text-2xl sm:text-3xl">{b.title}</h2>}
          {b.body && <p className={clsx("prose-luxe mt-3", b.align === "center" && "mx-auto")}>{b.body}</p>}
          {b.buttons?.length ? (
            <div className={clsx("mt-5 flex flex-wrap gap-2", b.align === "center" && "justify-center")}>
              {b.buttons.map((button, i) => <ButtonLink key={i} button={button} />)}
            </div>
          ) : null}
        </div>
      );
    case "cards":
      return (
        <div>
          {b.title && <h2 className={clsx("display mb-5 text-2xl sm:text-3xl", b.align === "center" && "text-center")}>{b.title}</h2>}
          <div className={clsx("grid gap-4", columnsClass(b))}>
            {(b.cards || []).map((card, i) => {
              const body = (
                <div className="card card-hover h-full p-5">
                  {card.image ? (
                    <SmartImage src={card.image} alt={card.title} ratio="aspect-[4/3]" className="mb-4 overflow-hidden rounded-[10px]" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/12 text-gold-deep"><Icon name={card.icon || "Sparkles"} size={18} /></span>
                  )}
                  <h3 className="mt-3 font-serif text-xl font-light">{card.title}</h3>
                  {card.text && <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{card.text}</p>}
                </div>
              );
              return card.href ? <Link key={i} href={card.href}>{body}</Link> : <div key={i}>{body}</div>;
            })}
          </div>
        </div>
      );
    case "faq":
      return (
        <div>
          {b.title && <h2 className="display mb-5 text-2xl sm:text-3xl">{b.title}</h2>}
          <div className="space-y-3">
            {(b.faqs || []).map((item, i) => (
              <details key={i} className="card p-4">
                <summary className="cursor-pointer font-serif text-lg font-light">{item.q}</summary>
                <p className="mt-3 whitespace-pre-line font-sans text-[13px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      );
    case "video": {
      const src = videoEmbed(b.videoUrl);
      return (
        <div>
          {b.title && <h2 className="display mb-5 text-2xl sm:text-3xl">{b.title}</h2>}
          {src ? (
            src.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
              <video src={src} poster={b.poster} controls className="aspect-video w-full rounded-[16px] bg-black object-cover" />
            ) : (
              <iframe title={b.title || "Video"} src={src} className="aspect-video w-full rounded-[16px] bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            )
          ) : (
            <div className="grid aspect-video place-items-center rounded-[16px] bg-black/5 font-sans text-[13px] text-muted">Informe o link do video.</div>
          )}
        </div>
      );
    }
    case "spacer":
      return <div aria-hidden className={b.spacing === "spacious" ? "h-16" : b.spacing === "compact" ? "h-4" : "h-8"} />;
    case "divider":
      return <div className="hairline" />;
    default:
      return null;
  }
}

function wrapperClass(b: Block) {
  return clsx(
    b.hideMobile && "hidden sm:block",
    b.hideTablet && "sm:hidden lg:block",
    b.hideDesktop && "lg:hidden",
    b.spacing === "compact" ? "py-2" : b.spacing === "spacious" ? "py-8" : "py-4",
    b.tone === "soft" && "bg-petrol-600/[0.045]",
    b.tone === "dark" && "bg-petrol-950 text-cream"
  );
}

function containerClass(b: Block) {
  if (b.width === "full" || b.type === "banner") return "";
  return clsx(
    "container-editorial",
    b.width === "narrow" && "max-w-3xl",
    b.width === "wide" && "max-w-7xl"
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const visibleBlocks = blocks.filter((block) => block.type !== "seo");
  return (
    <div>
      {visibleBlocks.map((b) => (
        <section key={b.id} className={wrapperClass(b)}>
          {b.width === "full" || b.type === "banner" ? (
            <BlockView b={b} />
          ) : (
            <div className={containerClass(b)}>
              <BlockView b={b} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
