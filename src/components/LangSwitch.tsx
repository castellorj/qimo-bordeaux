"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";
import { getCurrentLang, setLang, type Lang } from "./GoogleTranslate";

export const LANGS: { code: Lang; label: string; name: string; flag: string }[] = [
  { code: "pt", label: "PT", name: "Português", flag: "🇧🇷" },
  { code: "en", label: "EN", name: "English", flag: "🇬🇧" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
];

export function LangDropdown() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Lang>("pt");
  useEffect(() => setActive(getCurrentLang()), []);
  const current = LANGS.find((l) => l.code === active) || LANGS[0];

  return (
    <div className="relative notranslate" translate="no">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Selecionar idioma / Select language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-colors hover:border-gold"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="text-[15px] leading-none">{current.flag}</span>
        <span className="font-sans text-[12px] font-semibold tracking-wide">{current.label}</span>
        <Icon name="ChevronDown" size={13} className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[14px] border shadow-float"
            style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}
          >
            <p className="border-b px-4 py-2.5 font-sans text-[10px] uppercase tracking-luxe text-gold-deep" style={{ borderColor: "var(--line)" }}>
              Idioma · Language
            </p>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream",
                  active === l.code && "bg-cream"
                )}
                style={{ color: "var(--text)" }}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="font-serif text-lg font-light">{l.name}</span>
                {active === l.code && <Icon name="Check" size={16} className="ml-auto text-gold-deep" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LangRow() {
  const [active, setActive] = useState<Lang>("pt");
  useEffect(() => setActive(getCurrentLang()), []);
  return (
    <div className="notranslate" translate="no">
      <div className="grid grid-cols-3 gap-2">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-[12px] border py-3 transition-colors",
              active === l.code ? "border-gold text-gold-deep" : "hover:border-gold"
            )}
            style={{ borderColor: active === l.code ? undefined : "var(--line)" }}
          >
            <span className="text-xl leading-none">{l.flag}</span>
            <span className="font-sans text-[11px] font-medium">{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
