"use client";

import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { QimoSeal, Crumb, Pill } from "@/components/ui";
import { useGuideItem, useGuideLoading } from "@/components/GuideContent";
import { Editable } from "@/components/Editable";
import type { Appellation } from "@/lib/types";

function Spec({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderTop: "1px solid var(--line)" }}>
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-gold" />
      <div>
        <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{label}</p>
        <p className="mt-0.5 font-sans text-[14px]" style={{ color: "var(--text)" }}>{value}</p>
      </div>
    </div>
  );
}

export function WineView({ slug }: { slug: string }) {
  const a = useGuideItem<Appellation>("wine", slug);
  const loading = useGuideLoading();
  if (loading) return <div className="container-editorial py-20 text-center text-muted">Carregando...</div>;
  if (!a) return <div className="container-editorial py-20 text-center text-muted">Vinho não encontrado.</div>;

  const bankLabel = a.bank === "Left" ? "Margem esquerda" : a.bank === "Right" ? "Margem direita" : a.bank === "Entre-deux" ? "Entre-deux-Mers" : "Sauternais";

  return (
    <article>
      <section className="relative">
        <SmartImage src={a.heroImage} alt={a.name} label={a.color} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/vinhos" label="Voltar" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{bankLabel} · {a.color}</p>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{a.name}</h1>
              <p className="mt-2 max-w-xl font-serif text-lg font-light italic text-cream/80">{a.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            <Editable as="p" kind="wine" slug={a.slug} field="description" value={a.description} label="Descrição" multiline className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{a.description}</Editable>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="Martini" size={14} /> Perfil sensorial</h3>
              <Editable as="p" kind="wine" slug={a.slug} field="profile" value={a.profile} label="Perfil sensorial" multiline className="mt-3 font-sans text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{a.profile}</Editable>
            </div>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="UtensilsCrossed" size={14} /> Harmonizações</h3>
              <Editable as="div" kind="wine" slug={a.slug} field="pairings" value={a.pairings || []} label="Harmonizações" multiline className="mt-4 flex flex-wrap gap-2">{(a.pairings || []).map((p) => <Pill key={p} icon="Utensils">{p}</Pill>)}</Editable>
            </div>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="Star" size={14} /> Principais produtores</h3>
              <Editable as="div" kind="wine" slug={a.slug} field="topProducers" value={a.topProducers || []} label="Principais produtores" multiline className="mt-4 flex flex-wrap gap-2">{(a.topProducers || []).map((p) => <Pill key={p} icon="Grape">{p}</Pill>)}</Editable>
            </div>

            {a.qimoNote && (
              <div className="rounded-[3px] border p-5" style={{ borderColor: "var(--gold)", background: "color-mix(in srgb, var(--gold) 6%, transparent)" }}>
                <QimoSeal />
                <Editable as="p" kind="wine" slug={a.slug} field="qimoNote" value={a.qimoNote} label="Nota QIMO" multiline className="mt-3 font-serif text-lg font-light italic" style={{ color: "var(--text)" }}>{a.qimoNote}</Editable>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker">Ficha técnica</h3>
              <div className="mt-4">
                <div className="flex items-start gap-3 pb-3">
                  <Icon name="Grape" size={16} className="mt-0.5 shrink-0 text-gold" />
                  <div>
                    <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Castas</p>
                    <Editable as="p" kind="wine" slug={a.slug} field="grapes" value={a.grapes || []} label="Castas" multiline className="mt-0.5 font-sans text-[14px]" style={{ color: "var(--text)" }}>{(a.grapes || []).join(", ")}</Editable>
                  </div>
                </div>
                <Spec icon="Thermometer" label="Temperatura de serviço" value={a.serveTemp} />
                <Spec icon="Clock" label="Potencial de guarda" value={a.aging} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
