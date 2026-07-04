"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { useLocale } from "./providers";
import type { SearchDoc } from "@/content";

const DIACRITICS = /[̀-ͯ]/g;
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "");
}

export function SearchOverlay({
  open,
  onClose,
  index,
}: {
  open: boolean;
  onClose: () => void;
  index: SearchDoc[];
}) {
  const [q, setQ] = useState("");
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 60);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  const results = useMemo(() => {
    const nq = normalize(q.trim());
    if (!nq) return [];
    return index
      .filter((d) => normalize(`${d.title} ${d.subtitle} ${d.keywords}`).includes(nq))
      .slice(0, 12);
  }, [q, index]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-petrol-950/60 backdrop-blur-sm animate-fade-in">
      <div className="mx-auto mt-[8vh] w-full max-w-2xl px-5">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5" style={{ borderBottom: "1px solid var(--line)" }}>
            <Icon name="Search" size={18} className="text-gold" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-transparent py-4 font-sans text-base outline-none placeholder:text-muted"
              style={{ color: "var(--text)" }}
            />
            <button onClick={onClose} aria-label="Fechar busca" className="text-muted hover:text-gold">
              <Icon name="X" size={20} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {q && results.length === 0 && (
              <p className="px-5 py-8 text-center font-sans text-sm text-muted">
                {t("searchEmpty")} “{q}”.
              </p>
            )}
            {!q && (
              <p className="px-5 py-8 text-center font-sans text-[13px] text-muted">
                {t("searchHint")}
              </p>
            )}
            {results.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                onClick={onClose}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/5"
                style={{ borderTop: i > 0 ? "1px solid var(--line)" : "none" }}
              >
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-light" style={{ color: "var(--text)" }}>
                    {r.title}
                  </p>
                  <p className="truncate font-sans text-[12px] text-muted">{r.subtitle}</p>
                </div>
                <span className="shrink-0 font-sans text-[10px] uppercase tracking-luxe text-gold">
                  {r.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <button className="flex-1" aria-hidden onClick={onClose} />
    </div>
  );
}
