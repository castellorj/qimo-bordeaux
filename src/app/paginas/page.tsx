"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Crumb } from "@/components/ui";
import { BlockRenderer } from "@/components/BlockRenderer";
import type { Block } from "@/lib/blocks";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

interface Pg { slug: string; title: string; icon: string; blocks: Block[] }

function PaginasInner() {
  const sp = useSearchParams();
  const slug = sp.get("p");
  const [pages, setPages] = useState<Pg[] | null>(null);

  useEffect(() => {
    fetch(`${URL}/rest/v1/bordeaux_pages?select=slug,title,icon,blocks&published=eq.true&order=sort`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPages)
      .catch(() => setPages([]));
  }, []);

  if (pages === null) return <div className="container-editorial py-20 text-center text-muted">Carregando…</div>;

  // Página única
  if (slug) {
    const pg = pages.find((p) => p.slug === slug);
    if (!pg) return <div className="container-editorial py-20 text-center text-muted">Página não encontrada.</div>;
    const hasBanner = pg.blocks?.[0]?.type === "banner";
    return (
      <article className="pb-16">
        {!hasBanner && (
          <div className="container-editorial pt-10">
            <Crumb href="/paginas" label="Páginas" />
            <h1 className="display mt-3 text-4xl sm:text-5xl">{pg.title}</h1>
          </div>
        )}
        <div className="mt-8">
          <BlockRenderer blocks={pg.blocks || []} />
        </div>
      </article>
    );
  }

  // Índice
  return (
    <div className="container-editorial py-12">
      <p className="kicker">QIMO Bordeaux</p>
      <h1 className="display mt-1 text-3xl sm:text-4xl">Páginas</h1>
      {pages.length === 0 ? (
        <p className="mt-6 font-sans text-[14px] text-muted">Nenhuma página publicada ainda.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {pages.map((p) => (
            <Link key={p.slug} href={`/paginas?p=${p.slug}`} className="card card-hover flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border text-petrol-600" style={{ borderColor: "var(--line)" }}>
                <Icon name={p.icon || "FileText"} size={20} />
              </span>
              <span className="flex-1 font-serif text-xl font-light">{p.title}</span>
              <Icon name="ChevronRight" size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaginasPage() {
  return (
    <Suspense fallback={<div className="container-editorial py-20 text-center text-muted">Carregando…</div>}>
      <PaginasInner />
    </Suspense>
  );
}
