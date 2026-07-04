import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { content } from "@/content";

export const metadata: Metadata = { title: "Administrador", robots: { index: false } };

const supabaseReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const tables = [
  { name: "viagens", desc: "Metadados da viagem (navio, datas)", count: 1 },
  { name: "dias", desc: "Programação dia a dia", count: content.itinerary.length },
  { name: "atividades", desc: "Atividades de cada dia", count: content.itinerary.reduce((s, d) => s + d.activities.length, 0) },
  { name: "cidades", desc: "Cidades e portos", count: content.cities.length },
  { name: "vinicolas", desc: "Châteaux e casas", count: content.wineries.length },
  { name: "vinhos", desc: "Apelações", count: content.appellations.length },
  { name: "experiencias", desc: "Experiências exclusivas", count: content.experiences.length },
  { name: "gastronomia", desc: "Especialidades", count: content.gastronomy.length },
  { name: "compras", desc: "Itens de compra", count: content.shopping.length },
  { name: "contatos", desc: "Concierge & emergências", count: content.conciergeContacts.length },
];

export default function AdminPage() {
  return (
    <>
      <PageHero
        kicker="Bastidores"
        title="Painel administrativo"
        intro="Gerencie todo o conteúdo do guia sem programar. O guia funciona com o conteúdo curado local; conecte o Supabase para edição em tempo real."
        small
      />

      <div className="container-editorial space-y-10 py-14">
        {/* Status */}
        <div
          className="flex items-start gap-4 rounded-[3px] border p-6"
          style={{
            borderColor: supabaseReady ? "var(--gold)" : "var(--line)",
            background: supabaseReady ? "color-mix(in srgb, var(--gold) 6%, transparent)" : "var(--bg-elev)",
          }}
        >
          <Icon name={supabaseReady ? "ShieldCheck" : "Info"} size={22} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <p className="font-serif text-xl font-light">
              {supabaseReady ? "Supabase conectado" : "Supabase ainda não configurado"}
            </p>
            <p className="mt-1 font-sans text-[13px] leading-relaxed text-muted">
              {supabaseReady
                ? "As tabelas abaixo podem ser editadas em tempo real. Publicação instantânea."
                : "Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local e rode a migração em supabase/migrations para ativar a edição sem código."}
            </p>
          </div>
        </div>

        {/* Modelo de dados */}
        <section>
          <h2 className="display text-2xl">Modelo de dados</h2>
          <p className="mt-1 font-sans text-[13px] text-muted">
            Estrutura pronta para o Supabase — cada tabela é editável pelo administrador.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((t) => (
              <div key={t.name} className="card p-5">
                <div className="flex items-center justify-between">
                  <code className="font-sans text-[13px] font-medium text-gold">{t.name}</code>
                  <span className="font-serif text-2xl font-light">{t.count}</span>
                </div>
                <p className="mt-1 font-sans text-[12px] text-muted">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como ativar */}
        <section className="card p-8">
          <h2 className="display text-2xl">Ativar edição sem código</h2>
          <ol className="mt-5 space-y-4">
            {[
              "Crie um projeto gratuito no Supabase (supabase.com).",
              "Rode a migração SQL em supabase/migrations/0001_init.sql para criar as tabelas.",
              "Rode supabase/seed.sql para carregar o conteúdo curado inicial.",
              "Copie a URL e a anon key para o arquivo .env.local (veja .env.local.example).",
              "Reinicie o guia — o painel passa a editar o conteúdo em tempo real.",
            ].map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-serif text-lg text-gold" style={{ borderColor: "var(--line)" }}>
                  {i + 1}
                </span>
                <p className="pt-1 font-sans text-[14px] leading-relaxed text-muted">{s}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
