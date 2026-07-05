"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Icon } from "./Icon";
import { useLocale, useFavorites } from "./providers";
import { SearchOverlay } from "./Search";
import { primaryNav } from "@/lib/nav";
import { getCurrentLang, setLang, type Lang } from "./GoogleTranslate";
import type { SearchDoc } from "@/content";

const LANGS: { code: Lang; label: string; name: string; flag: string }[] = [
  { code: "pt", label: "PT", name: "Português", flag: "🇧🇷" },
  { code: "en", label: "EN", name: "English", flag: "🇬🇧" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
];

// Qual das 5 áreas está ativa, mesmo em subpáginas
function activeSection(pathname: string): string {
  if (pathname === "/") return "/";
  const p = pathname;
  if (/^\/(viagem|programacao|barco|mapa|documentos)/.test(p)) return "/viagem";
  if (/^\/(descobrir|vinicolas|restaurantes|vinhos|gastronomia|experiencias|compras|cidades)/.test(p)) return "/descobrir";
  if (p.startsWith("/favoritos")) return "/favoritos";
  if (/^\/(mais|concierge|informacoes|paginas)/.test(p)) return "/mais";
  return "";
}

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
        <Icon name="Languages" size={17} className="text-gold-deep" />
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

export function SiteChrome({ searchIndex }: { searchIndex: SearchDoc[] }) {
  const [search, setSearch] = useState(false);
  const { t, cfg } = useLocale();
  const { count } = useFavorites();
  const pathname = usePathname();
  const section = activeSection(pathname);

  // O painel administrativo tem seu próprio layout (sem o chrome do guia)
  if (pathname.startsWith("/admin")) return null;

  // Botões configuráveis no painel: ícone (navicon.<key>) e visibilidade (navhide.<key>)
  const navVisible = primaryNav.filter((item) => cfg(`navhide.${item.key}`) !== "1");
  const iconFor = (item: { key: string; icon: string }) => cfg(`navicon.${item.key}`) || item.icon;
  const gridColsClass = navVisible.length === 5 ? "grid-cols-5" : navVisible.length === 4 ? "grid-cols-4" : navVisible.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      {/* -------- Top bar -------- */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
      >
        <div className="container-editorial relative flex h-16 items-center gap-4">
          <Link
            href="/"
            className="absolute left-1/2 flex shrink-0 -translate-x-1/2 items-center md:static md:translate-x-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qimo-logo-dark.png" alt="QIMO" className="h-11 w-auto object-contain md:h-9" />
          </Link>

          {/* Navegação central (desktop) */}
          <nav className="hidden items-center gap-1 md:absolute md:left-1/2 md:flex md:-translate-x-1/2">
            {navVisible.map((item) => {
              const active = section === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 font-sans text-[13px] transition-colors",
                    active ? "bg-cream text-petrol-600" : "text-muted hover:text-petrol-600"
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSearch(true)}
              aria-label={t("search")}
              className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:text-petrol-600"
            >
              <Icon name="Search" size={19} />
            </button>
            <LangDropdown />
          </div>
        </div>
      </header>

      {/* -------- Search -------- */}
      <SearchOverlay open={search} onClose={() => setSearch(false)} index={searchIndex} />

      {/* -------- Tab bar (mobile) -------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md pb-safe md:hidden"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg-elev) 92%, transparent)" }}
      >
        <div className={clsx("grid", gridColsClass)}>
          {navVisible.map((item) => {
            const active = section === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 transition-colors",
                  active ? "text-petrol-600" : "text-muted"
                )}
              >
                <div className="relative">
                  <Icon name={iconFor(item)} size={22} strokeWidth={active ? 2 : 1.6} />
                  {item.href === "/favoritos" && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-petrol-600 px-0.5 text-[9px] font-semibold text-cream">
                      {count}
                    </span>
                  )}
                </div>
                <span className="font-sans text-[10px] tracking-wide">{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
