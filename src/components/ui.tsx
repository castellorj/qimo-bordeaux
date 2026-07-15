"use client";

import Link from "next/link";
import clsx from "clsx";
import { useLocale } from "./providers";
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
      className="mb-7 inline-flex font-sans text-[11px] font-semibold uppercase tracking-luxe text-gold transition-colors hover:text-petrol-700"
    >
      {label}
    </Link>
  );
}
