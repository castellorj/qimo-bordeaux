"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { useFavorites } from "@/components/providers";
import { resolveFav } from "@/lib/resolve";

export default function FavoritosPage() {
  const { favs, toggle } = useFavorites();
  const items = favs.map(resolveFav).filter(Boolean) as NonNullable<ReturnType<typeof resolveFav>>[];

  const byCat = items.reduce<Record<string, typeof items>>((acc, it) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});

  return (
    <>
      <PageHero section="favoritos" small />

      <div className="container-editorial py-14">
        {items.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border" style={{ borderColor: "var(--line)" }}>
              <Icon name="Heart" size={26} className="text-gold" />
            </span>
            <h2 className="display mt-6 text-2xl">Ainda sem favoritos</h2>
            <p className="prose-luxe mx-auto mt-3 max-w-sm">
              Toque no coração em qualquer atividade, cidade, vinícola ou experiência para montar o seu roteiro.
            </p>
            <Link href="/programacao" className="btn-primary mt-8">
              Explorar a programação <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byCat).map(([cat, list]) => (
              <section key={cat}>
                <h2 className="kicker">{cat}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {list.map((it) => (
                    <div key={it.id} className="card card-hover flex items-center gap-3 p-4">
                      <Link href={it.href} className="min-w-0 flex-1">
                        <p className="truncate font-serif text-lg font-light">{it.title}</p>
                        <p className="truncate font-sans text-[12px] text-muted">{it.subtitle}</p>
                      </Link>
                      <button
                        onClick={() => toggle(it.id)}
                        aria-label="Remover"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:border-gold"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <Icon name="Heart" size={16} strokeWidth={0} className="fill-gold text-gold" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
