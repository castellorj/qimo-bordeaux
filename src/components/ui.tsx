"use client";

import Link from "next/link";
import clsx from "clsx";
import { useFavorites, useLocale } from "./providers";
import { Icon } from "./Icon";

export function QimoSeal({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <span className={clsx("seal-qimo", className)}>
      <Icon name="Star" size={11} strokeWidth={1.8} />
      {t("seloQimo")}
    </span>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function SectionTitle({
  kicker,
  title,
  intro,
  center,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={clsx("max-w-2xl", center && "mx-auto text-center")}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2 className="display mt-3 text-3xl sm:text-4xl">{title}</h2>
      <div className={clsx("gold-rule mt-5", center && "mx-auto")} />
      {intro && <p className="prose-luxe mt-5">{intro}</p>}
    </div>
  );
}

export function FavoriteButton({
  id,
  className,
  floating = false,
}: {
  id: string;
  className?: string;
  floating?: boolean;
}) {
  const { has, toggle } = useFavorites();
  const active = has(id);
  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={clsx(
        "grid place-items-center rounded-full transition-all duration-300 ease-luxe",
        floating
          ? "h-10 w-10 bg-white/85 text-petrol-800 shadow-card backdrop-blur hover:bg-white"
          : "h-9 w-9 border",
        className
      )}
      style={!floating ? { borderColor: "var(--line)" } : undefined}
    >
      <Icon
        name="Heart"
        size={floating ? 17 : 16}
        strokeWidth={active ? 0 : 1.6}
        className={clsx(active ? "fill-gold text-gold" : "text-current")}
      />
    </button>
  );
}

export function Pill({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <span className="chip">
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

export function Crumb({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-wide2 text-muted transition-colors hover:text-gold"
    >
      <Icon name="ChevronLeft" size={13} />
      {label}
    </Link>
  );
}
