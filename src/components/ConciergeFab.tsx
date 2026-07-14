"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { useGuideList } from "./GuideContent";
import { useLocale } from "./providers";
import type { ConciergeContact } from "@/lib/types";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const SB_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

// Fallback: se nenhum contato estiver marcado como "rápido" no painel, mostra estes.
const QUICK_FALLBACK = ["qimo-whatsapp", "qimo-call", "qimo-instagram", "emergency-eu"];

function hrefFor(type: string, value: string): { href: string; external: boolean } {
  if (type === "whatsapp") return { href: `https://wa.me/${value.replace(/\D/g, "")}`, external: true };
  if (type === "call" || type === "emergency") return { href: `tel:${value.replace(/[^\d+]/g, "")}`, external: false };
  if (type === "maps") return { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, external: true };
  if (type === "link" || type === "instagram") return { href: value, external: true };
  return { href: "#", external: false };
}

export function ConciergeFab() {
  const { cfg } = useLocale();
  const [open, setOpen] = useState(false);
  const [liveItems, setLiveItems] = useState<ConciergeContact[] | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const contacts = useGuideList<ConciergeContact>("concierge");

  useEffect(() => {
    if (!open) return;
    fetch(`${SB_URL}/rest/v1/bordeaux_content?select=data,sort,published&kind=eq.concierge&published=eq.true&order=sort`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        const quick = rows
          .map((row) => row.data as ConciergeContact)
          .filter((contact) => contact.quick)
          .slice(0, 5);
        setLiveItems(quick);
      })
      .catch(() => {});
  }, [open]);
  // Quais contatos aparecem no balão é definido no painel (flag "rápido").
  // Enquanto ninguém marcou nada, cai nos 4 padrões.
  const flagged = liveItems ?? contacts.filter((c) => c.quick);
  const items = (
    flagged.length
      ? flagged
      : (QUICK_FALLBACK.map((slug) => contacts.find((c) => c.slug === slug)).filter(Boolean) as ConciergeContact[])
  ).slice(0, 5);

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
              <p className="kicker">{cfg("concierge.fab.kicker") || "Concierge QIMO"}</p>
              <h3 className="display mt-1 text-2xl">{cfg("concierge.fab.title") || "Como posso ajudar?"}</h3>
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

        </div>
      </div>
    </>
  );
}
