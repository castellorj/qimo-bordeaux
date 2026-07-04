"use client";

import { Icon } from "./Icon";
import { useLocale } from "./providers";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-24 border-t pb-28 pt-16 md:pb-16" style={{ borderColor: "var(--line)" }}>
      <div className="container-editorial">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qimo-logo-dark.png" alt="QIMO" className="h-12 w-auto object-contain" />
          <span className="mt-3 font-sans text-[9px] uppercase tracking-luxe text-gold">
            {t("brandSub")}
          </span>
          <div className="gold-rule mt-5" />
          <p className="mt-5 max-w-md font-sans text-[12px] leading-relaxed text-muted">
            {t("footerTagline")}
          </p>

          {/* Redes & site */}
          <div className="mt-8 flex items-center gap-3">
            <a
              href="https://instagram.com/qimobr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @qimobr"
              className="grid h-11 w-11 place-items-center rounded-full border transition-colors hover:border-gold hover:text-gold"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon name="Instagram" size={19} />
            </a>
            <a
              href="https://qimobr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-3 font-sans text-[12px] uppercase tracking-wide2 transition-colors hover:border-gold hover:text-gold"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon name="Globe" size={15} /> {t("visitSite")}
            </a>
          </div>

          <p className="mt-12 font-sans text-[10px] uppercase tracking-luxe text-muted">
            © 2026 QIMO — {t("footerRights")}
          </p>
          <p className="mt-2 font-sans text-[10px] text-muted/70">Fotografias: Wikimedia Commons</p>
        </div>
      </div>
    </footer>
  );
}
