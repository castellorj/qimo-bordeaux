"use client";

import { Icon } from "./Icon";
import { useLocale } from "./providers";
import type { Action } from "@/lib/reserve";

// Sistema de botões de reserva/ação — padrão consistente em todo o guia.
export function ActionBar({
  actions,
  channelLabel,
  conciergeNote,
}: {
  actions: Action[];
  channelLabel?: string; // ex.: "Reserva via TheFork"
  conciergeNote?: boolean; // mostra "A QIMO cuida da reserva por você"
}) {
  const { t } = useLocale();
  const primary = actions.find((a) => a.primary);
  const secondary = actions.filter((a) => !a.primary);

  const rel = "noopener noreferrer";

  return (
    <div>
      {primary && (
        <a
          href={primary.href}
          target={primary.external ? "_blank" : undefined}
          rel={primary.external ? rel : undefined}
          className="btn-primary w-full"
        >
          <Icon name={primary.icon} size={16} />
          {t(primary.labelKey)}
        </a>
      )}

      {channelLabel && (
        <p className="mt-2 text-center font-sans text-[11px] text-muted">
          {t("reserveVia")} {channelLabel}
        </p>
      )}
      {conciergeNote && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center font-sans text-[11px] text-muted">
          <Icon name="Sparkles" size={12} className="text-gold-deep" /> {t("conciergeHint")}
        </p>
      )}

      {secondary.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {secondary.map((a, i) => (
            <a
              key={i}
              href={a.href}
              target={a.external ? "_blank" : undefined}
              rel={a.external ? rel : undefined}
              className="flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 font-sans text-[12px] transition-colors hover:border-gold hover:text-gold-deep"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon name={a.icon} size={15} className="text-gold-deep" />
              <span className="truncate">{t(a.labelKey)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
