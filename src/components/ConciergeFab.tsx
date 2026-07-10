"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { useGuideKindStable } from "./GuideContent";
import type { ConciergeContact } from "@/lib/types";

// Contatos de acesso rápido no botão flutuante (os demais ficam na página Concierge).
const QUICK = ["qimo-whatsapp", "qimo-call", "emergency-eu", "samu"];

function hrefFor(type: string, value: string): { href: string; external: boolean } {
  if (type === "whatsapp") return { href: `https://wa.me/${value.replace(/\D/g, "")}`, external: true };
  if (type === "call" || type === "emergency") return { href: `tel:${value.replace(/[^\d+]/g, "")}`, external: false };
  if (type === "maps") return { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, external: true };
  if (type === "link") return { href: value, external: true };
  return { href: "#", external: false };
}

export function ConciergeFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const contacts = useGuideKindStable<ConciergeContact>("concierge");
  const items = QUICK.map((slug) => contacts.find((c) => c.slug === slug)).filter(Boolean) as ConciergeContact[];

  return (
    <>
      {/* Botão flutuante — sempre à mão, acima da tab bar no mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Concierge QIMO — ajuda rápida"
        className="fixed bottom-[84px] right-4 z-[45] grid h-14 w-14 place-items-center rounded-full bg-petrol-600 text-cream shadow-float transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
      >
        <Icon name="MessageCircle" size={24} />
      </button>

      {/* Folha */}
      <div
        className={`fixed inset-0 z-[80] flex items-end justify-center transition-opacity duration-300 sm:items-center ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ background: "rgba(26,10,14,.5)", backdropFilter: open ? "blur(4px)" : "none" }}
        onClick={() => setOpen(false)}
      >
        <div
          className={`w-full max-w-md rounded-t-[20px] bg-paper p-6 pb-8 shadow-float transition-transform duration-300 sm:rounded-[20px] ${open ? "translate-y-0" : "translate-y-8"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="kicker">Concierge QIMO</p>
              <h3 className="display mt-1 text-2xl">Como posso ajudar?</h3>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-muted hover:text-gold-deep"><Icon name="X" size={20} /></button>
          </div>

          <div className="mt-5 space-y-2">
            {items.map((c) => {
              const { href, external } = hrefFor(c.type, c.value);
              const tone = c.type === "emergency" ? "text-[#8f2f2f]" : "text-petrol-600";
              return (
                <a key={c.slug} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-[12px] border p-3.5 transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/[0.04] ${tone}`}><Icon name={c.icon} size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[17px] font-light leading-tight" style={{ color: "var(--text)" }}>{c.label}</span>
                    {c.hint && <span className="block truncate font-sans text-[12px] text-muted">{c.hint}</span>}
                  </span>
                  <Icon name="ChevronRight" size={16} className="text-muted" />
                </a>
              );
            })}
          </div>

          <Link href="/concierge" onClick={() => setOpen(false)} className="mt-4 flex items-center justify-center gap-1.5 font-sans text-[12px] uppercase tracking-wide2 text-petrol-600 hover:text-petrol-500">
            Ver todos os contatos <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
