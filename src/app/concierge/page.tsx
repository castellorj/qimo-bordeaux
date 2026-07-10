"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { EditorialCard } from "@/components/EditorialCard";
import { useLocale } from "@/components/providers";
import { useGuideKindStable } from "@/components/GuideContent";
import { frenchPhrases } from "@/content";
import type { ConciergeContact } from "@/lib/types";

const TRIP_SECTIONS = [
  { key: "barco", href: "/barco", image: "/photos/ship-exterior.jpg" },
  { key: "mapa", href: "/mapa", image: "/photos/hero-vignoble.jpg" },
  { key: "documentos", href: "/documentos", image: "/photos/hero-medoc.jpg" },
];

const WHATSAPP = process.env.NEXT_PUBLIC_QIMO_WHATSAPP || "5521995453817";
const PHONE = process.env.NEXT_PUBLIC_QIMO_PHONE || "+5521995453817";

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

function CurrencyConverter() {
  const [rate, setRate] = useState(6.2);
  const [live, setLive] = useState(false);
  const [eur, setEur] = useState("100");

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=EUR&to=BRL")
      .then((r) => r.json())
      .then((j) => {
        if (j?.rates?.BRL) {
          setRate(j.rates.BRL);
          setLive(true);
        }
      })
      .catch(() => {});
  }, []);

  const eurNum = parseFloat(eur.replace(",", ".")) || 0;
  const brl = (eurNum * rate).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="kicker flex items-center gap-2"><Icon name="Coins" size={14} /> Câmbio</h3>
        <span className="font-sans text-[11px] text-muted">
          {live ? "Cotação ao vivo" : "Cotação aproximada"}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <label className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Euro (€)</label>
          <input
            type="number"
            inputMode="decimal"
            value={eur}
            onChange={(e) => setEur(e.target.value)}
            className="mt-1 w-full rounded-[2px] border bg-transparent px-3 py-2.5 font-serif text-2xl font-light outline-none focus:border-gold"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          />
        </div>
        <Icon name="ArrowRight" size={18} className="mt-6 text-gold" />
        <div className="flex-1">
          <label className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Real (R$)</label>
          <p className="mt-1 rounded-[2px] border px-3 py-2.5 font-serif text-2xl font-light" style={{ borderColor: "var(--line)" }}>
            {brl}
          </p>
        </div>
      </div>
      <p className="mt-3 font-sans text-[11px] text-muted">1 € ≈ {rate.toFixed(2).replace(".", ",")} R$</p>
    </div>
  );
}

export default function ConciergePage() {
  const { t } = useLocale();
  const conciergeContacts = useGuideKindStable<ConciergeContact>("concierge");
  const qimo = conciergeContacts.filter((c) => c.slug.startsWith("qimo"));
  const emergency = conciergeContacts.filter((c) => c.type === "emergency" || c.slug.includes("hospital") || c.slug.includes("consulado"));
  const utils = conciergeContacts.filter(
    (c) => !c.slug.startsWith("qimo") && c.type !== "emergency" && !c.slug.includes("hospital") && !c.slug.includes("consulado")
  );

  const Card = ({ c }: { c: ConciergeContact }) => (
    <a
      href={hrefFor(c)}
      target={c.type === "link" || c.type === "maps" || c.type === "whatsapp" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="card card-hover group flex items-center gap-4 p-4"
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
          c.type === "emergency" ? "bg-[#8f2f2f] text-white" : "border text-gold"
        }`}
        style={c.type !== "emergency" ? { borderColor: "var(--line)" } : undefined}
      >
        <Icon name={c.icon} size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg font-light leading-tight">{c.label}</p>
        {c.hint && <p className="truncate font-sans text-[12px] text-muted">{c.hint}</p>}
      </div>
      <Icon name="ArrowUpRight" size={16} className="text-muted transition-colors group-hover:text-gold" />
    </a>
  );

  return (
    <>
      <PageHero section="concierge" small />

      <div className="container-editorial space-y-12 py-14">
        {/* Sua viagem: navio, mapa e documentos */}
        <section>
          <h2 className="display text-2xl">Sua viagem</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRIP_SECTIONS.map((s, i) => (
              <EditorialCard
                key={s.key}
                href={s.href}
                image={s.image}
                title={t(`nav.${s.key}`)}
                subtitle={t(`navd.${s.key}`)}
                ratio="aspect-[16/10]"
                priority={i < 3}
              />
            ))}
          </div>
        </section>

        {/* Suporte QIMO em destaque */}
        <section>
          <h2 className="display text-2xl">Suporte QIMO</h2>
          <p className="mt-1 font-sans text-[13px] text-muted">Nossa equipe à disposição durante toda a viagem.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {qimo.map((c) => <Card key={c.slug} c={c} />)}
          </div>
        </section>

        <CurrencyConverter />

        {/* Emergências */}
        <section>
          <h2 className="display text-2xl">Emergências & assistência</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {emergency.map((c) => <Card key={c.slug} c={c} />)}
          </div>
        </section>

        {/* Utilidades */}
        <section>
          <h2 className="display text-2xl">Transporte & utilidades</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {utils.map((c) => <Card key={c.slug} c={c} />)}
          </div>
        </section>

        {/* Frases em francês */}
        <section>
          <h2 className="display text-2xl">Frases úteis em francês</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frenchPhrases.map((p, i) => (
              <div key={i} className="card p-4">
                <p className="font-sans text-[12px] text-muted">{p.pt}</p>
                <p className="mt-1 font-serif text-xl font-light">{p.fr}</p>
                <p className="mt-0.5 font-sans text-[12px] italic text-gold">/ {p.hint} /</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
