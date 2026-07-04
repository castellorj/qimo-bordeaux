"use client";

import { useState } from "react";
import clsx from "clsx";

/**
 * Fotografia real com fallback editorial elegante.
 * Regra do projeto: NUNCA imagens geradas por IA. Enquanto a foto oficial
 * não é inserida, exibimos um placeholder de marca (jamais uma foto falsa).
 */
export function SmartImage({
  src,
  alt,
  className,
  label,
  ratio = "aspect-[4/3]",
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  label?: string;
  ratio?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  return (
    <div className={clsx("relative overflow-hidden bg-petrol-900", ratio, className)}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-luxe"
        />
      ) : (
        <div className="photo-placeholder flex h-full w-full items-center justify-center">
          <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
            <span className="font-serif text-3xl font-light tracking-[0.2em] text-cream/90">
              QIMO
            </span>
            <span className="h-px w-8 bg-gold/60" />
            <span className="font-sans text-[10px] uppercase tracking-luxe text-cream/50">
              {label || "Fotografia oficial"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
