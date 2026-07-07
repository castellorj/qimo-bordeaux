"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Revela o conteúdo com um fade-up discreto quando entra na tela (scroll).
 * Leve: usa IntersectionObserver + CSS (sem dependência de animação).
 * Respeita prefers-reduced-motion e nunca deixa o conteúdo preso oculto.
 */
export function Reveal({
  children, className, delay = 0, as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: any;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    // fallback: nunca deixar oculto por mais de 1.5s
    const t = setTimeout(() => setShown(true), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(22px)",
        transition: `opacity .75s ${delay}s cubic-bezier(.22,1,.36,1), transform .75s ${delay}s cubic-bezier(.22,1,.36,1)`,
      }}
    >
      {children}
    </Tag>
  );
}
