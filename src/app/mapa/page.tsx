"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { cities, wineries } from "@/content";

type Filter = "all" | "cities" | "wineries";

export default function MapaPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const points = [
    ...cities
      .filter((c) => c.coords)
      .map((c) => ({
        name: c.name,
        sub: c.region,
        kind: "Cidade",
        icon: "Landmark",
        href: `/cidades/${c.slug}`,
        coords: c.coords!,
      })),
    ...wineries
      .filter((w) => w.coords)
      .map((w) => ({
        name: w.name,
        sub: w.appellation,
        kind: "Vinícola",
        icon: "Grape",
        href: `/vinicolas/${w.slug}`,
        coords: w.coords!,
      })),
  ];

  const filtered = points.filter((p) =>
    filter === "all" ? true : filter === "cities" ? p.kind === "Cidade" : p.kind === "Vinícola"
  );

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`,
        "_blank"
      );
    });
  };

  // Bounding box aproximado da região de Bordeaux para o mapa OSM
  const bbox = "-1.05,44.55,0.05,45.35";

  return (
    <>
      <PageHero section="mapa" small />

      <div className="container-editorial py-14">
        {/* Mapa OSM */}
        <div className="card overflow-hidden">
          <iframe
            title="Mapa da região de Bordeaux"
            className="h-[380px] w-full sm:h-[460px]"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
            style={{ border: 0 }}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {([
              ["all", "Todos"],
              ["cities", "Cidades"],
              ["wineries", "Vinícolas"],
            ] as [Filter, string][]).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors ${
                  filter === k ? "border-gold text-gold" : "hover:text-gold"
                }`}
                style={{ borderColor: filter === k ? undefined : "var(--line)" }}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={locateMe} className="btn-ghost">
            <Icon name="Navigation" size={15} /> Onde estou agora
          </button>
        </div>

        {/* Lista de pontos */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.name} className="card card-hover flex items-center gap-3 p-4">
              <Link href={p.href} className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${p.kind === "Vinícola" ? "text-olive" : "text-gold"}`}
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name={p.icon} size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-lg font-light leading-tight">{p.name}</span>
                  <span className="block truncate font-sans text-[11px] text-muted">{p.sub}</span>
                </span>
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${p.name} no mapa`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:border-gold hover:text-gold"
                style={{ borderColor: "var(--line)" }}
              >
                <Icon name="ArrowUpRight" size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
