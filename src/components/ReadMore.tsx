"use client";

import { useState } from "react";
import clsx from "clsx";
import { useLocale } from "./providers";
import { Icon } from "./Icon";

// Divulgação progressiva: mostra ~4 linhas e revela o resto sob demanda.
export function ReadMore({
  text,
  className,
  clampClass = "line-clamp-4",
}: {
  text: string;
  className?: string;
  clampClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div>
      <p className={clsx(className, !open && clampClass)} style={{ color: "var(--text)" }}>
        {text}
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-wide2 text-petrol-600 transition-colors hover:text-petrol-500"
      >
        {open ? t("readLess") : t("readMore")}
        <Icon name={open ? "Minus" : "Plus"} size={13} />
      </button>
    </div>
  );
}
