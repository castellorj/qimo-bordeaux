"use client";

import { PageHero } from "@/components/PageHero";
import { EditorialCard } from "@/components/EditorialCard";
import { Icon } from "@/components/Icon";
import { useGuideKind } from "@/components/GuideContent";
import { useLocale } from "@/components/providers";
import type { ShoppingItem } from "@/lib/types";

export default function ComprasPage() {
  const { t } = useLocale();
  const shopping = useGuideKind<ShoppingItem>("shopping");
  const taxFreeSteps = [t("taxfree.step1"), t("taxfree.step2"), t("taxfree.step3"), t("taxfree.step4")];
  return (
    <>
      <PageHero section="compras" small bgImage="/photos/shop-laguiole.jpg" />
      <div className="container-editorial py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shopping.map((s, i) => (
            <EditorialCard
              key={s.slug}
              href={`/compras/${s.slug}`}
              image={s.heroImage}
              kicker={s.category}
              title={s.name}
              subtitle={s.priceRange}
              seal={s.qimoSelect}
              priority={i < 3}
            />
          ))}
        </div>

        {/* Tax Free */}
        <div className="mt-14 rounded-[16px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="flex items-center gap-3">
            <Icon name="ShieldCheck" size={22} className="text-gold" />
            <h2 className="display text-2xl sm:text-3xl">{t("taxfree.title")}</h2>
          </div>
          <p className="prose-luxe mt-4 max-w-2xl">{t("taxfree.intro")}</p>
          <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {taxFreeSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-serif text-lg text-gold" style={{ borderColor: "var(--line)" }}>{i + 1}</span>
                <p className="pt-1 font-sans text-[14px] leading-relaxed text-muted">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 font-sans text-[13px] italic text-muted">{t("taxfree.note")}</p>
        </div>
      </div>
    </>
  );
}
