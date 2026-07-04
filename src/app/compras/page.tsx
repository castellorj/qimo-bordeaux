import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { shopping, taxFreeGuide } from "@/content";

export const metadata: Metadata = { title: "Compras" };

export default function ComprasPage() {
  return (
    <>
      <PageHero section="compras" />
      <div className="container-editorial py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shopping.map((s) => (
            <article key={s.slug} id={s.slug} className="card card-hover scroll-mt-24 flex flex-col overflow-hidden">
              <div className="relative">
                <SmartImage src={s.heroImage} alt={s.name} label={s.category} ratio="aspect-[4/3]" />
                <div className="absolute right-3 top-3">
                  <FavoriteButton id={`shop:${s.slug}`} floating />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[11px] uppercase tracking-wide2 text-gold">{s.category}</span>
                  {s.qimoSelect && <QimoSeal />}
                </div>
                <h2 className="mt-1.5 font-serif text-xl font-light leading-tight">{s.name}</h2>
                <p className="mt-2 flex-1 font-sans text-[13px] leading-relaxed text-muted">{s.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {s.priceRange && <Pill icon="Wallet">{s.priceRange}</Pill>}
                  {s.taxFree && <Pill icon="ShieldCheck">Tax Free</Pill>}
                </div>
                {s.whereToBuy && (
                  <p className="mt-3 font-sans text-[12px] text-muted">
                    <span className="text-gold">Onde:</span> {s.whereToBuy.join(" · ")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Tax Free */}
        <div className="mt-16 rounded-[3px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="flex items-center gap-3">
            <Icon name="ShieldCheck" size={22} className="text-gold" />
            <h2 className="display text-2xl sm:text-3xl">{taxFreeGuide.title}</h2>
          </div>
          <p className="prose-luxe mt-4 max-w-2xl">{taxFreeGuide.intro}</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {taxFreeGuide.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-serif text-lg text-gold" style={{ borderColor: "var(--line)" }}>
                  {i + 1}
                </span>
                <p className="pt-1 font-sans text-[14px] leading-relaxed text-muted">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 font-sans text-[13px] italic text-muted">{taxFreeGuide.note}</p>
        </div>
      </div>
    </>
  );
}
