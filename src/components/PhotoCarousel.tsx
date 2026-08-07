"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// Carrossel de fotos leve, sem dependências: scroll-snap nativo (swipe no celular),
// setas no desktop, bolinhas e contador. Clicar numa foto abre em tela cheia (lightbox).
export function PhotoCarousel({
  images,
  alt,
  aspect = "aspect-[4/3] sm:aspect-[16/10]",
  rounded = "rounded-[16px]",
}: {
  images: string[];
  alt: string;
  aspect?: string;
  rounded?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const pics = images.filter(Boolean);

  const go = (i: number) => {
    const n = (i + pics.length) % pics.length;
    const el = track.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    setIdx(n);
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Lightbox: trava o scroll do fundo e habilita setas/Esc no teclado.
  useEffect(() => {
    if (lightbox === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((v) => (v === null ? v : (v + 1) % pics.length));
      if (e.key === "ArrowLeft") setLightbox((v) => (v === null ? v : (v - 1 + pics.length) % pics.length));
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [lightbox, pics.length]);

  if (!pics.length) return null;
  const many = pics.length > 1;

  return (
    <div className={`group relative overflow-hidden ${rounded} bg-black/[0.04]`}>
      <div
        ref={track}
        onScroll={onScroll}
        className={`flex ${aspect} snap-x snap-mandatory overflow-x-auto overflow-y-hidden`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {pics.map((src, i) => (
          <button key={i} type="button" onClick={() => setLightbox(i)} className="relative w-full shrink-0 cursor-zoom-in snap-center" aria-label="Ampliar foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} — foto ${i + 1}`}
              loading={i === 0 ? undefined : "lazy"}
              decoding="async"
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
          </button>
        ))}
      </div>

      {many && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />}

      {many && (
        <>
          <button
            type="button"
            onClick={() => go(idx - 1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-petrol-700 shadow-md backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(idx + 1)}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-petrol-700 shadow-md backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Icon name="ChevronRight" size={18} />
          </button>

          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 font-sans text-[11px] font-medium text-white backdrop-blur">
            <Icon name="Camera" size={12} /> {idx + 1}/{pics.length}
          </div>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {pics.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para a foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}

      {lightbox !== null && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8" onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} aria-label="Fechar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
            <Icon name="X" size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pics[lightbox]}
            alt={`${alt} — foto ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[95vw] rounded-[10px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {many && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v - 1 + pics.length) % pics.length)); }}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:left-6">
                <Icon name="ChevronLeft" size={24} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v === null ? v : (v + 1) % pics.length)); }}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:right-6">
                <Icon name="ChevronRight" size={24} />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 font-sans text-[12px] font-medium text-white backdrop-blur">
                {lightbox + 1} / {pics.length}
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
