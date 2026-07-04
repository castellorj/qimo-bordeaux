import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb, Pill } from "@/components/ui";
import { getWines, getWine } from "@/lib/content-db";

export async function generateStaticParams() {
  const appellations = await getWines();
  return appellations.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getWine(slug);
  return { title: a?.name ?? "Vinho", description: a?.tagline };
}

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

export default async function WineDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getWine(slug);
  if (!a) notFound();

  return (
    <>
      <PageHero kicker={`${a.bank === "Left" ? "Margem esquerda" : a.bank === "Right" ? "Margem direita" : "Sauternais"} · ${a.color}`} title={a.name} intro={a.tagline} small bgImage={a.heroImage} />

      <div className="container-editorial py-12">
        <div className="mb-8 flex items-center justify-between">
          <Crumb href="/vinhos" label="Vinhos" />
          <FavoriteButton id={`wine:${a.slug}`} />
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>
              {a.description}
            </p>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="Martini" size={14} /> Perfil sensorial</h3>
              <p className="mt-3 font-sans text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{a.profile}</p>
            </div>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="UtensilsCrossed" size={14} /> Harmonizações</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {a.pairings.map((p) => <Pill key={p} icon="Utensils">{p}</Pill>)}
              </div>
            </div>

            <div>
              <h3 className="kicker flex items-center gap-2"><Icon name="Star" size={14} /> Principais produtores</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {a.topProducers.map((p) => <Pill key={p} icon="Grape">{p}</Pill>)}
              </div>
            </div>

            {a.qimoNote && (
              <div className="rounded-[3px] border p-5" style={{ borderColor: "var(--gold)", background: "color-mix(in srgb, var(--gold) 6%, transparent)" }}>
                <QimoSeal />
                <p className="mt-3 font-serif text-lg font-light italic" style={{ color: "var(--text)" }}>{a.qimoNote}</p>
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
                    <p className="mt-0.5 font-sans text-[14px]" style={{ color: "var(--text)" }}>{a.grapes.join(", ")}</p>
                  </div>
                </div>
                <Spec icon="Thermometer" label="Temperatura de serviço" value={a.serveTemp} />
                <Spec icon="Clock" label="Potencial de guarda" value={a.aging} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
