"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Icon } from "./Icon";
import { useLocale, useReservations } from "./providers";
import { SearchOverlay } from "./Search";
import { ConciergeFab } from "./ConciergeFab";

// Gate de entrada (react-phone-number-input + libphonenumber-js são pesados).
// Carregado sob demanda e SÓ na 1ª visita (sem convidado salvo) — fora do bundle global.
const WelcomeSheet = dynamic(() => import("./WelcomeSheet").then((m) => m.WelcomeSheet), { ssr: false });
import { LangDropdown } from "./LangSwitch";
import { primaryNav, orderByKeys } from "@/lib/nav";
import type { SearchDoc } from "@/content";

export { LangDropdown, LangRow } from "./LangSwitch";

// Qual das 5 áreas está ativa, mesmo em subpáginas
function activeSection(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/hoje")) return "/programacao";
  const p = pathname;
  if (/^\/(viagem|programacao)/.test(p)) return "/programacao";
  if (p.startsWith("/chef")) return "/chef";
  if (/^\/(descobrir|vinicolas|restaurantes|vinhos|gastronomia|experiencias|compras|cidades)/.test(p)) return "/descobrir";
  if (p.startsWith("/reservas")) return "/reservas";
  if (/^\/(mais|concierge|informacoes|paginas|barco|mapa|documentos)/.test(p)) return "/concierge";
  return "";
}

export function SiteChrome({ searchIndex }: { searchIndex: SearchDoc[] }) {
  const [search, setSearch] = useState(false);
  const [maybeGate, setMaybeGate] = useState(false);
  const { t, cfg } = useLocale();
  const { count } = useReservations();
  const pathname = usePathname();
  const section = activeSection(pathname);

  // Só carrega o gate (e suas libs) se não houver convidado salvo neste device.
  useEffect(() => {
    try { if (!localStorage.getItem("qimo:guest")) setMaybeGate(true); } catch { setMaybeGate(true); }
  }, []);

  // O painel administrativo tem seu próprio layout (sem o chrome do guia)
  if (pathname.startsWith("/admin")) return null;

  // Botões configuráveis no painel: ordem (navorder.principal), ícone (navicon.<key>) e visibilidade (navhide.<key>)
  const navVisible = orderByKeys(primaryNav, cfg("navorder.principal")).filter((item) => cfg(`navhide.${item.key}`) !== "1");
  const iconFor = (item: { key: string; icon: string }) => cfg(`navicon.${item.key}`) || item.icon;
  const gridColsClass = navVisible.length >= 6 ? "grid-cols-6" : navVisible.length === 5 ? "grid-cols-5" : navVisible.length === 4 ? "grid-cols-4" : navVisible.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      {maybeGate && <WelcomeSheet />}
      <ConciergeFab />
      {/* -------- Top bar -------- */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
      >
        <div className="container-editorial relative flex h-16 items-center gap-4">
          <Link
            href="/programacao"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t pb-safe md:hidden"
        style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}
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
                  {item.href === "/reservas" && count > 0 && (
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
