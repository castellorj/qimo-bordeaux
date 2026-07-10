"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb, Pill } from "@/components/ui";
import { ReadMore } from "@/components/ReadMore";
import { ActionBar } from "@/components/ActionBar";
import { wineryActions } from "@/lib/reserve";
import { useGuideItem } from "@/components/GuideContent";
import { Editable } from "@/components/Editable";
import { Section } from "@/components/Section";
import type { Winery } from "@/lib/types";

const WINERY_SECTION_ORDER = ["terroir", "grapes", "production", "family", "icons", "whatToTaste", "whatToBuy", "curiosities"];

function Block({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="kicker flex items-center gap-2"><Icon name={icon} size={14} /> {title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function BulletList({ items, slug, field, label }: { items?: string[]; slug?: string; field?: string; label?: string }) {
  if (!items?.length) return null;
  return (
    <Editable as="ul" kind="winery" slug={slug || ""} field={field || ""} value={items} label={label} multiline className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />{it}
        </li>
      ))}
    </Editable>
  );
}

export function WineryView({ slug }: { slug: string }) {
  const w = useGuideItem<Winery>("winery", slug);
  if (!w) return <div className="container-editorial py-20 text-center text-muted">Vinícola não encontrada.</div>;

  return (
    <article>
      <section className="relative">
        <SmartImage src={w.heroImage} alt={w.name} label={w.appellation} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/vinicolas" label="Vinícolas" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Editable as="p" kind="winery" slug={w.slug} field="appellation" value={w.appellation} label="Denominação" className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{w.appellation}</Editable>
                {w.qimoSelect && <QimoSeal />}
              </div>
              <Editable as="h1" kind="winery" slug={w.slug} field="name" value={w.name} label="Nome" className="display mt-2 text-4xl text-cream sm:text-6xl">{w.name}</Editable>
              {w.classification && <Editable as="p" kind="winery" slug={w.slug} field="classification" value={w.classification} label="Classificação" className="mt-2 font-serif text-lg font-light italic text-cream/80">{w.classification}</Editable>}
            </div>
            <FavoriteButton id={`winery:${w.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-10">
            <Editable as="div" kind="winery" slug={w.slug} field="history" value={w.history} label="História" multiline>
              <ReadMore text={w.history} className="font-serif text-xl font-light leading-relaxed sm:text-2xl" />
            </Editable>
            <div className="hairline" />
            {(() => {
              const nodes: Record<string, { has: boolean; node: React.ReactNode }> = {
                terroir: { has: !!w.terroir, node: (
                  <div>
                    <h3 className="kicker flex items-center gap-2 text-olive"><Icon name="Compass" size={14} /> Terroir</h3>
                    <Editable as="div" kind="winery" slug={w.slug} field="terroir" value={w.terroir || ""} label="Terroir" multiline className="mt-3"><p className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.terroir}</p></Editable>
                  </div>
                ) },
                grapes: { has: !!w.grapes?.length, node: (
                  <Block title="Castas" icon="Grape">
                    <Editable as="div" kind="winery" slug={w.slug} field="grapes" value={w.grapes || []} label="Castas" multiline className="flex flex-wrap gap-2">{(w.grapes || []).map((g) => <Pill key={g}>{g}</Pill>)}</Editable>
                  </Block>
                ) },
                production: { has: !!w.production, node: <Block title="Produção" icon="Wine"><Editable as="p" kind="winery" slug={w.slug} field="production" value={w.production || ""} label="Produção" multiline className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.production}</Editable></Block> },
                family: { has: !!w.family, node: <Block title="Proprietários" icon="Users"><Editable as="p" kind="winery" slug={w.slug} field="family" value={w.family || ""} label="Proprietários" multiline className="font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.family}</Editable></Block> },
                icons: { has: !!w.icons?.length, node: <Block title="Vinhos icônicos" icon="Star"><BulletList items={w.icons} slug={w.slug} field="icons" label="Vinhos icônicos" /></Block> },
                whatToTaste: { has: !!w.whatToTaste, node: <Block title="O que provar" icon="Martini"><BulletList items={w.whatToTaste} slug={w.slug} field="whatToTaste" label="O que provar" /></Block> },
                whatToBuy: { has: !!w.whatToBuy, node: <Block title="O que comprar" icon="ShoppingBag"><BulletList items={w.whatToBuy} slug={w.slug} field="whatToBuy" label="O que comprar" /></Block> },
                curiosities: { has: !!w.curiosities, node: <Block title="Curiosidades" icon="Sparkles"><BulletList items={w.curiosities} slug={w.slug} field="curiosities" label="Curiosidades" /></Block> },
              };
              const saved = Array.isArray((w as any).sectionOrder) ? (w as any).sectionOrder.filter((k: string) => WINERY_SECTION_ORDER.includes(k)) : [];
              const full = [...saved, ...WINERY_SECTION_ORDER.filter((k) => !saved.includes(k))];
              const present = full.filter((k) => nodes[k]?.has);
              return (
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                  {present.map((key) => (
                    <Section key={key} kind="winery" slug={w.slug} sectionKey={key} order={present}>{nodes[key].node}</Section>
                  ))}
                </div>
              );
            })()}

            {w.scores?.length ? (
              <>
                <div className="hairline" />
                <Block title="Nas taças da crítica" icon="Star">
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {w.scores.map((s, i) => (
                      <div key={i} className="rounded-[3px] border p-4" style={{ borderColor: "var(--line)" }}>
                        <p className="font-serif text-lg font-light">{s.critic}</p>
                        <p className="mt-1 font-sans text-[13px] text-muted">{s.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 font-sans text-[11px] italic text-muted">Referências indicativas; pontuações variam conforme a safra.</p>
                </Block>
              </>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              {w.averagePrice && (<><h3 className="kicker">Preço médio</h3><p className="mt-2 font-serif text-2xl font-light">{w.averagePrice}</p></>)}
              {w.visitHours && (<><h3 className="kicker mt-6">Visita QIMO</h3><p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{w.visitHours}</p></>)}
              {w.dressCode && (<p className="mt-3 flex items-center gap-2 font-sans text-[13px] text-muted"><Icon name="Shirt" size={14} className="text-gold" /> {w.dressCode}</p>)}
              {w.visitedOnDays && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {w.visitedOnDays.map((d) => (
                    <Link key={d} href={`/programacao#dia-${d}`} className="chip hover:text-gold"><Icon name="CalendarDays" size={13} /> Dia {d}</Link>
                  ))}
                </div>
              )}
              <div className="mt-6"><ActionBar actions={wineryActions(w)} channelLabel={w.bookingChannel} /></div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
