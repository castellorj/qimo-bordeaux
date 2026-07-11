"use client";

import { Weather } from "@/components/Weather";
import { Icon } from "@/components/Icon";
import { useGuideList } from "@/components/GuideContent";
import type { EtiquetteTip, InfoFact } from "@/content/info";

export function InformacoesContent() {
  const facts = useGuideList<InfoFact>("info_fact");
  const tips = useGuideList<EtiquetteTip>("etiquette_tip");

  return (
    <div className="container-editorial space-y-14 py-14">
      <section>
        <h2 className="display text-2xl">Clima na região</h2>
        <p className="mt-1 font-sans text-[13px] text-muted">Previsão ao vivo para os principais portos do roteiro.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Weather place="Bordeaux" lat={44.84} lng={-0.58} />
          <Weather place="Pauillac (Médoc)" lat={45.2} lng={-0.75} />
          <Weather place="Saint-Émilion" lat={44.89} lng={-0.16} />
        </div>
      </section>

      <section>
        <h2 className="display text-2xl">O essencial</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.slug} className="card flex items-start gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-gold" style={{ borderColor: "var(--line)" }}>
                <Icon name={f.icon} size={18} />
              </span>
              <div>
                <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{f.label}</p>
                <p className="mt-1 font-sans text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display text-2xl">Etiqueta & cultura local</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tips.map((tip) => (
            <div key={tip.slug} className="flex items-start gap-3 rounded-[3px] border p-5" style={{ borderColor: "var(--line)" }}>
              <Icon name="Sparkles" size={16} className="mt-0.5 shrink-0 text-gold" />
              <p className="font-sans text-[14px] leading-relaxed text-muted">{tip.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
