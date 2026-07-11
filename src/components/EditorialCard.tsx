"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { PhotoImg } from "./PhotoImg";

/**
 * Card editorial estilo capa de revista: a fotografia É o card.
 * Foto grande + gradiente + (kicker) título + uma frase. Nada mais.
 * Todo o detalhe vive na página de detalhe (disclosure progressivo).
 * Surge com um fade-up discreto ao entrar na tela (escalona naturalmente ao rolar).
 */
export function EditorialCard({
  href, image, kicker, title, subtitle, seal = false,
  ratio = "aspect-[4/5]", priority = false,
}: {
  href: string;
  image?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  seal?: boolean;
  ratio?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    // Já visível ao carregar → aparece na hora (sem risco de ficar oculto).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    const t = setTimeout(() => setShown(true), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={`group relative block ${ratio} overflow-hidden rounded-[18px] photo-placeholder`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(20px)",
        transition: "opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)",
      }}
    >
      {image && (
        <PhotoImg
          src={image}
          alt={title}
          priority={priority}
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-luxe group-hover:scale-[1.05]"
        />
      )}
      {/* Escurecimento uniforme + reforço na base = texto sempre legível, mesmo em foto clara */}
      <div className="absolute inset-0" style={{ background: "rgba(20,7,11,0.32)" }} />
      <div className="scrim-bottom absolute inset-0" />

      {seal && (
        <div className="chip-on-photo absolute left-3 top-3 z-10 !border-gold/50 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-soft">
          <Icon name="Star" size={11} /> Seleção QIMO
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6" style={{ textShadow: "0 1px 16px rgba(12,4,7,.85), 0 1px 3px rgba(12,4,7,.7)" }}>
        {kicker && <p className="font-sans text-[10px] uppercase tracking-luxe text-gold-soft">{kicker}</p>}
        <h3 className="mt-1.5 font-serif text-2xl font-light leading-[1.1] text-cream sm:text-[28px]">{title}</h3>
        {subtitle && <p className="mt-1.5 line-clamp-1 font-serif text-[14px] font-light italic text-cream/85">{subtitle}</p>}
      </div>
    </Link>
  );
}
