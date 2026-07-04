import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb, Pill } from "@/components/ui";
import { ReadMore } from "@/components/ReadMore";
import { ActionBar } from "@/components/ActionBar";
import { wineryActions } from "@/lib/reserve";
import { getWineries, getWinery } from "@/lib/content-db";

export async function generateStaticParams() {
  const wineries = await getWineries();
  return wineries.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWinery(slug);
  return { title: w?.name ?? "Vinícola", description: w?.history?.slice(0, 150) };
}

function Block({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="kicker flex items-center gap-2">
        <Icon name={icon} size={14} /> {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
          {it}
        </li>
      ))}
    </ul>
  );
}

export default async function WineryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await getWinery(slug);
  if (!w) notFound();

  return (
    <article>
      <section className="relative">
        <SmartImage src={w.heroImage} alt={w.name} label={w.appellation} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/vinicolas" label="Vinícolas" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{w.appellation}</p>
                {w.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{w.name}</h1>
              {w.classification && <p className="mt-2 font-serif text-lg font-light italic text-cream/80">{w.classification}</p>}
            </div>
            <FavoriteButton id={`winery:${w.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-10">
            <ReadMore text={w.history} className="font-serif text-xl font-light leading-relaxed sm:text-2xl" />
            <div className="hairline" />

            <div className="grid gap-10 sm:grid-cols-2">
              {w.terroir && (
                <div>
                  <h3 className="kicker flex items-center gap-2 text-olive">
                    <Icon name="Compass" size={14} /> Terroir
                  </h3>
                  <div className="mt-3">
                    <p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.terroir}</p>
                  </div>
                </div>
              )}
              <Block title="Castas" icon="Grape">
                <div className="flex flex-wrap gap-2">
                  {w.grapes.map((g) => <Pill key={g}>{g}</Pill>)}
                </div>
              </Block>
              {w.production && (
                <Block title="Produção" icon="Wine">
                  <p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.production}</p>
                </Block>
              )}
              {w.family && (
                <Block title="Proprietários" icon="Users">
                  <p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.family}</p>
                </Block>
              )}
              <Block title="Vinhos icônicos" icon="Star"><BulletList items={w.icons} /></Block>
              {w.whatToTaste && <Block title="O que provar" icon="Martini"><BulletList items={w.whatToTaste} /></Block>}
              {w.whatToBuy && <Block title="O que comprar" icon="ShoppingBag"><BulletList items={w.whatToBuy} /></Block>}
              {w.curiosities && <Block title="Curiosidades" icon="Sparkles"><BulletList items={w.curiosities} /></Block>}
            </div>

            {/* Pontuações da crítica */}
            {w.scores?.length ? (
              <>
                <div className="hairline" />
                <Block title="Nas taças da crítica" icon="Star">
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {w.scores.map((s, i) => (
                      <div key={i} className="rounded-[3px] border p-4" style={{ borderColor: "var(--line)" }}>
                        <p className="font-serif text-lg font-light">{s.critic}</p>
                        <p className="mt-1 font-sans text-[13px] text-muted">{s.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 font-sans text-[11px] italic text-muted">
                    Referências indicativas; pontuações variam conforme a safra.
                  </p>
                </Block>
              </>
            ) : null}
          </div>

          {/* Aside */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              {w.averagePrice && (
                <>
                  <h3 className="kicker">Preço médio</h3>
                  <p className="mt-2 font-serif text-2xl font-light">{w.averagePrice}</p>
                </>
              )}
              {w.visitHours && (
                <>
                  <h3 className="kicker mt-6">Visita QIMO</h3>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.visitHours}</p>
                </>
              )}
              {w.dressCode && (
                <p className="mt-3 flex items-center gap-2 font-sans text-[13px] text-muted">
                  <Icon name="Shirt" size={14} className="text-gold" /> {w.dressCode}
                </p>
              )}
              {w.visitedOnDays && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {w.visitedOnDays.map((d) => (
                    <Link key={d} href={`/programacao#dia-${d}`} className="chip hover:text-gold">
                      <Icon name="CalendarDays" size={13} /> Dia {d}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <ActionBar actions={wineryActions(w)} channelLabel={w.bookingChannel} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
