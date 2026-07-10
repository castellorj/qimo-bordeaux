import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Weather } from "@/components/Weather";
import { Icon } from "@/components/Icon";
import { etiquette } from "@/content";

export const metadata: Metadata = { title: "Informações úteis" };

const facts = [
  { icon: "Coins", label: "Moeda", value: "Euro (€). Cartões amplamente aceitos; leve algum troco." },
  { icon: "Languages", label: "Idioma", value: "Francês. Um 'Bonjour' abre todas as portas." },
  { icon: "Clock", label: "Fuso horário", value: "Bordeaux (CET) está +4h ou +5h à frente do horário de Brasília." },
  { icon: "Phone", label: "Emergência", value: "112 (número único europeu)." },
  { icon: "ShieldCheck", label: "Tomadas", value: "Padrão europeu tipo C/E, 230V. Leve um adaptador." },
  { icon: "Wallet", label: "Gorjeta", value: "Serviço incluído; arredondar é gentileza, não obrigação." },
];

export default function InformacoesPage() {
  return (
    <>
      <PageHero section="informacoes" small />

      <div className="container-editorial space-y-14 py-14">
        {/* Clima */}
        <section>
          <h2 className="display text-2xl">Clima na região</h2>
          <p className="mt-1 font-sans text-[13px] text-muted">Previsão ao vivo para os principais portos do roteiro.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Weather place="Bordeaux" lat={44.84} lng={-0.58} />
            <Weather place="Pauillac (Médoc)" lat={45.2} lng={-0.75} />
            <Weather place="Saint-Émilion" lat={44.89} lng={-0.16} />
          </div>
        </section>

        {/* Fatos rápidos */}
        <section>
          <h2 className="display text-2xl">O essencial</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="card flex items-start gap-4 p-5">
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

        {/* Etiqueta */}
        <section>
          <h2 className="display text-2xl">Etiqueta & cultura local</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {etiquette.map((e, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[3px] border p-5" style={{ borderColor: "var(--line)" }}>
                <Icon name="Sparkles" size={16} className="mt-0.5 shrink-0 text-gold" />
                <p className="font-sans text-[14px] leading-relaxed text-muted">{e}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
