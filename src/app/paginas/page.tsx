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

interface PgSeo { title?: string; description?: string; image?: string; index?: boolean }
interface Pg { slug: string; title: string; icon: string; blocks: Block[]; seo?: PgSeo }

function splitSeo(blocks: Block[] = []): { blocks: Block[]; seo: PgSeo } {
  const seoBlock = blocks.find((block) => block.type === "seo");
  return {
    blocks: blocks.filter((block) => block.type !== "seo"),
    seo: {
      title: seoBlock?.seoTitle || "",
      description: seoBlock?.seoDescription || "",
      image: seoBlock?.seoImage || "",
      index: seoBlock?.seoIndex !== false,
    },
  };
}

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function PageMeta({ page }: { page: Pg }) {
  useEffect(() => {
    const title = page.seo?.title || page.title;
    const description = page.seo?.description || "";
    document.title = `${title} · QIMO Bordeaux`;
    upsertMeta("description", description);
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    if (page.seo?.image) {
      upsertMeta("og:image", page.seo.image, "property");
      upsertMeta("twitter:image", page.seo.image);
    }
    upsertMeta("robots", page.seo?.index === false ? "noindex,nofollow" : "index,follow");
  }, [page]);
  return null;
}

function PaginasInner() {
  const sp = useSearchParams();
  const slug = sp.get("p");
  const [pages, setPages] = useState<Pg[] | null>(null);

  useEffect(() => {
    fetch(`${URL}/rest/v1/bordeaux_pages?select=slug,title,icon,blocks&published=eq.true&order=sort`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Pg[]) => setPages(rows.map((page) => {
        const normalized = splitSeo(page.blocks || []);
        return { ...page, blocks: normalized.blocks, seo: normalized.seo };
      })))
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
        <PageMeta page={pg} />
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
