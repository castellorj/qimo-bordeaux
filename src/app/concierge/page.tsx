"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LangRow } from "@/components/SiteChrome";

// Markdown só carrega quando há seção de texto livre (fora do bundle base do Concierge).
const Dossier = dynamic(() => import("@/components/Dossier").then((m) => m.Dossier), { ssr: false });
import { useLocale } from "@/components/providers";
import { useGuideList } from "@/components/GuideContent";
import { frenchPhrases, etiquette, ship, TRIP } from "@/content";
import type { ConciergeContact, ConciergeSection } from "@/lib/types";

const WHATSAPP = process.env.NEXT_PUBLIC_QIMO_WHATSAPP || "5521995453817";
const PHONE = process.env.NEXT_PUBLIC_QIMO_PHONE || "+5521995453817";

// Links úteis da viagem (seção "links")
const TRIP_LINKS = [
  { key: "barco", href: "/barco", icon: "Ship" },
  { key: "mapa", href: "/mapa", icon: "Map" },
  { key: "informacoes", href: "/informacoes", icon: "Info" },
  { key: "documentos", href: "/documentos", icon: "FileText" },
  { key: "paginas", href: "/paginas", icon: "BookOpen" },
  { key: "reservas", href: "/reservas", icon: "CalendarCheck" },
];

function hrefFor(c: ConciergeContact) {
  switch (c.type) {
    case "whatsapp":
      return `https://wa.me/${(c.slug === "qimo-whatsapp" ? WHATSAPP : c.value).replace(/\D/g, "")}`;
    case "call":
    case "emergency":
      return `tel:${c.slug === "qimo-call" ? PHONE : c.value}`;
    case "maps":
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.value)}`;
    case "link":
      return c.value;
    default:
      return "#";
  }
}

/* Seção colapsável (acordeão) */
function Section({ title, hint, count, defaultOpen, children }: {
  title: string; hint?: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 p-5 text-left transition-colors hover:bg-black/[0.015]"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl font-light leading-tight" style={{ color: "var(--text)" }}>{title}</span>
          {hint && <span className="mt-0.5 block font-sans text-[12px] text-muted">{hint}</span>}
        </span>
        {count != null && <span className="shrink-0 font-sans text-[12px] text-muted">{count}</span>}
        <Icon name="ChevronDown" size={18} className={clsx("shrink-0 text-muted transition-transform duration-300", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t px-5 pb-6 pt-5" style={{ borderColor: "var(--line)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ContactCard({ c }: { c: ConciergeContact }) {
  return (
    <a
      href={hrefFor(c)}
      target={c.type === "link" || c.type === "maps" || c.type === "whatsapp" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="card card-hover group flex items-center gap-4 p-4"
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${c.type === "emergency" ? "bg-[#8f2f2f] text-white" : "border text-gold"}`}
        style={c.type !== "emergency" ? { borderColor: "var(--line)" } : undefined}
      >
        <Icon name={c.icon} size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg font-light leading-tight" style={{ color: "var(--text)" }}>{c.label}</p>
        {c.hint && <p className="truncate font-sans text-[12px] text-muted">{c.hint}</p>}
      </div>
      <Icon name="ArrowUpRight" size={16} className="text-muted transition-colors group-hover:text-gold" />
    </a>
  );
}

function CurrencyConverter() {
  const [rate, setRate] = useState(6.2);
  const [live, setLive] = useState(false);
  const [eur, setEur] = useState("100");

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=EUR&to=BRL")
      .then((r) => r.json())
      .then((j) => { if (j?.rates?.BRL) { setRate(j.rates.BRL); setLive(true); } })
      .catch(() => {});
  }, []);

  const eurNum = parseFloat(eur.replace(",", ".")) || 0;
  const brl = (eurNum * rate).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <div className="flex items-center justify-end">
        <span className="font-sans text-[11px] text-muted">{live ? "Cotação ao vivo" : "Cotação aproximada"}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1">
          <label className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Euro (€)</label>
          <input
            type="number" inputMode="decimal" value={eur} onChange={(e) => setEur(e.target.value)}
            className="mt-1 w-full rounded-[2px] border bg-transparent px-3 py-2.5 font-serif text-2xl font-light outline-none focus:border-gold"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          />
        </div>
        <Icon name="ArrowRight" size={18} className="mt-6 text-gold" />
        <div className="flex-1">
          <label className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Real (R$)</label>
          <p className="mt-1 rounded-[2px] border px-3 py-2.5 font-serif text-2xl font-light" style={{ borderColor: "var(--line)" }}>{brl}</p>
        </div>
      </div>
      <p className="mt-3 font-sans text-[11px] text-muted">1 € ≈ {rate.toFixed(2).replace(".", ",")} R$</p>
    </div>
  );
}

/* Conteúdo de cada módulo de seção */
function ModuleBody({ section, contacts, t }: { section: ConciergeSection; contacts: ConciergeContact[]; t: (k: string) => string }) {
  switch (section.module) {
    case "contacts": {
      const qimo = contacts.filter((c) => c.slug.startsWith("qimo"));
      const emergency = contacts.filter((c) => c.type === "emergency" || c.slug.includes("hospital") || c.slug.includes("consulado"));
      const utils = contacts.filter((c) => !c.slug.startsWith("qimo") && c.type !== "emergency" && !c.slug.includes("hospital") && !c.slug.includes("consulado"));
      const Group = ({ label, list }: { label: string; list: ConciergeContact[] }) =>
        list.length ? (
          <div>
            <p className="kicker mb-3">{label}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{list.map((c) => <ContactCard key={c.slug} c={c} />)}</div>
          </div>
        ) : null;
      return (
        <div className="space-y-6">
          <Group label="Suporte QIMO" list={qimo} />
          <Group label="Emergências & assistência" list={emergency} />
          <Group label="Transporte & utilidades" list={utils} />
        </div>
      );
    }
    case "currency":
      return <CurrencyConverter />;
    case "ship":
      return (
        <>
          <p className="prose-luxe">{ship.intro}</p>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {ship.stats.map((s) => (
              <div key={s.l} className="text-center">
                <p className="font-serif text-2xl font-light text-gold-deep">{s.n}</p>
                <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{s.l}</p>
              </div>
            ))}
          </div>
          <Link href="/barco" className="btn-ghost mt-5 !px-4 !py-2 text-[13px]"><Icon name="Ship" size={15} /> Conhecer o navio</Link>
        </>
      );
    case "etiquette":
      return (
        <ul className="space-y-3">
          {etiquette.map((e, i) => (
            <li key={i} className="flex items-start gap-3 font-serif text-[15px] font-light leading-relaxed" style={{ color: "var(--text)" }}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><span>{e}</span>
            </li>
          ))}
        </ul>
      );
    case "phrases":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {frenchPhrases.map((p, i) => (
            <div key={i} className="rounded-[10px] border p-4" style={{ borderColor: "var(--line)" }}>
              <p className="font-sans text-[12px] text-muted">{p.pt}</p>
              <p className="mt-1 font-serif text-xl font-light" style={{ color: "var(--text)" }}>{p.fr}</p>
              <p className="mt-0.5 font-sans text-[12px] italic text-gold">/ {p.hint} /</p>
            </div>
          ))}
        </div>
      );
    case "links":
      return (
        <div className="grid grid-cols-2 gap-3">
          {TRIP_LINKS.map((l) => (
            <Link key={l.key} href={l.href} className="card card-hover group flex items-center gap-3 p-4">
              <span className="shrink-0 text-gold-deep transition-transform group-hover:scale-110"><Icon name={l.icon} size={22} /></span>
              <span className="min-w-0 font-serif text-[17px] font-light leading-tight" style={{ color: "var(--text)" }}>{t(`nav.${l.key}`)}</span>
            </Link>
          ))}
        </div>
      );
    case "language":
      return <LangRow />;
    case "trip":
      return (
        <div className="space-y-2 font-sans text-[14px]" style={{ color: "var(--text-muted)" }}>
          <p className="flex items-center gap-2"><Icon name="Ship" size={15} className="text-gold-deep" /> {TRIP.ship}</p>
          <p className="flex items-center gap-2"><Icon name="CalendarDays" size={15} className="text-gold-deep" /> 25 out — 1 nov 2026 · {TRIP.nights} noites</p>
          <p className="flex items-center gap-2"><Icon name="Anchor" size={15} className="text-gold-deep" /> Bordeaux · Gironde · Dordogne</p>
        </div>
      );
    case "text":
    default:
      return section.body ? <Dossier md={section.body} /> : <p className="font-sans text-[13px] text-muted">Seção sem conteúdo.</p>;
  }
}

// contagem exibida no cabeçalho de algumas seções
function sectionCount(section: ConciergeSection, contacts: ConciergeContact[]): number | undefined {
  if (section.module === "contacts") return contacts.length;
  if (section.module === "etiquette") return etiquette.length;
  if (section.module === "phrases") return frenchPhrases.length;
  return undefined;
}

export default function ConciergePage() {
  const { t } = useLocale();
  const contacts = useGuideList<ConciergeContact>("concierge");
  const sections = useGuideList<ConciergeSection>("concierge_section");

  return (
    <>
      <PageHero section="concierge" title={t("hero.concierge.t")} small />

      <div className="container-editorial space-y-3 py-10">
        {sections.map((s) => (
          <Section key={s.slug} title={s.title} hint={s.hint} count={sectionCount(s, contacts)} defaultOpen={s.defaultOpen}>
            <ModuleBody section={s} contacts={contacts} t={t} />
          </Section>
        ))}
      </div>
    </>
  );
}
