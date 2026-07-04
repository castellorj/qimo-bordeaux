import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "QIMO Platform", robots: { index: false } };

const supabaseReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Mod = { name: string; icon: string; status: "ready" | "soon" };

const groups: { title: string; kicker: string; mods: Mod[] }[] = [
  {
    kicker: "ERP · Operação",
    title: "Gestão da viagem",
    mods: [
      { name: "Participantes & Famílias", icon: "Users", status: "ready" },
      { name: "Passeios & Vagas", icon: "Ticket", status: "ready" },
      { name: "Reservas", icon: "Check", status: "ready" },
      { name: "Estoque & Lista de espera", icon: "ShieldCheck", status: "ready" },
      { name: "Relatórios & Ocupação", icon: "Info", status: "soon" },
      { name: "Notificações", icon: "Bell", status: "soon" },
    ],
  },
  {
    kicker: "CMS · Conteúdo",
    title: "Editor do guia",
    mods: [
      { name: "Programação (dias)", icon: "CalendarDays", status: "ready" },
      { name: "Vinícolas", icon: "Grape", status: "ready" },
      { name: "Restaurantes", icon: "UtensilsCrossed", status: "ready" },
      { name: "Hotéis", icon: "BedDouble", status: "ready" },
      { name: "Experiências", icon: "Sparkles", status: "ready" },
      { name: "Vinhos", icon: "Wine", status: "ready" },
      { name: "Gastronomia", icon: "Utensils", status: "ready" },
      { name: "Compras", icon: "ShoppingBag", status: "ready" },
      { name: "Mapas & Pins", icon: "Map", status: "ready" },
      { name: "Fotos (biblioteca)", icon: "Camera", status: "soon" },
      { name: "Documentos", icon: "FileText", status: "ready" },
      { name: "Links (testar status)", icon: "Globe", status: "soon" },
      { name: "Concierge", icon: "Bell", status: "ready" },
    ],
  },
  {
    kicker: "Plataforma",
    title: "Sistema",
    mods: [
      { name: "Viagens & Templates", icon: "Ship", status: "ready" },
      { name: "Publicação (rascunho→ar)", icon: "ArrowUpRight", status: "ready" },
      { name: "Histórico & Versões", icon: "Clock", status: "ready" },
      { name: "Busca global", icon: "Search", status: "soon" },
      { name: "Usuários & Papéis", icon: "Shield", status: "ready" },
    ],
  },
];

function Badge({ status }: { status: Mod["status"] }) {
  return status === "ready" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-olive/15 px-2.5 py-0.5 font-sans text-[10px] font-medium text-olive-deep">
      <Icon name="Check" size={11} /> Banco pronto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-[10px] text-muted" style={{ borderColor: "var(--line)" }}>
      Em breve
    </span>
  );
}

export default function AdminPage() {
  return (
    <>
      <PageHero
        kicker="QIMO Platform"
        title="CMS + ERP de Viagens"
        intro="Um só sistema para administrar conteúdo, participantes, reservas e capacidade — reutilizável para Bordeaux, Croácia, Grécia, Áustria e futuras viagens QIMO."
        small
      />

      <div className="container-editorial space-y-10 py-10">
        {/* Status Supabase */}
        <div
          className="flex items-start gap-4 rounded-[16px] border p-6"
          style={{ borderColor: supabaseReady ? "var(--gold)" : "var(--line)", background: "var(--bg-elev)" }}
        >
          <Icon name={supabaseReady ? "ShieldCheck" : "Info"} size={22} className="mt-0.5 shrink-0 text-gold-deep" />
          <div>
            <p className="font-serif text-xl font-light">
              {supabaseReady ? "Supabase conectado — painel ativo" : "Backend pronto · aguardando conexão Supabase"}
            </p>
            <p className="mt-1 font-sans text-[13px] leading-relaxed text-muted">
              O schema completo da plataforma está em <code className="text-gold-deep">supabase/migrations/0002_platform.sql</code> —
              multi-viagem, participantes, reservas com <strong>controle de capacidade sem overbooking</strong>, lista de
              espera automática, RLS e auditoria. Rode a migração e preencha <code>.env.local</code> para ativar a edição visual.
            </p>
          </div>
        </div>

        {/* Motor de reservas (destaque ERP) */}
        <section className="rounded-[16px] border p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
          <p className="kicker flex items-center gap-2"><Icon name="ShieldCheck" size={14} /> Motor de reservas</p>
          <h2 className="display mt-3 text-2xl">Estoque de vagas à prova de overbooking</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            {[
              { n: "Capacidade", d: "definida por passeio" },
              { n: "Reservados", d: "somados em tempo real" },
              { n: "Disponíveis", d: "calculado automaticamente" },
              { n: "Lista de espera", d: "excedente vai automático" },
            ].map((s) => (
              <div key={s.n} className="rounded-[12px] border p-4" style={{ borderColor: "var(--line)" }}>
                <p className="font-serif text-lg font-light text-gold-deep">{s.n}</p>
                <p className="mt-1 font-sans text-[12px] text-muted">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 font-sans text-[13px] leading-relaxed text-muted">
            Ao reservar, o sistema trava a atividade e decide entre <strong>confirmar</strong> ou mover para a
            <strong> lista de espera</strong>. Ao cancelar, promove automaticamente o próximo da fila. Nunca há overbooking.
          </p>
        </section>

        {/* Módulos */}
        {groups.map((g) => (
          <section key={g.title}>
            <p className="kicker">{g.kicker}</p>
            <h2 className="display mt-2 text-2xl">{g.title}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.mods.map((m) => (
                <div key={m.name} className="card flex items-center gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-petrol-600" style={{ borderColor: "var(--line)" }}>
                    <Icon name={m.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[16px] font-light">{m.name}</span>
                    <span className="mt-0.5 block"><Badge status={m.status} /></span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Como ativar */}
        <section className="card p-8">
          <h2 className="display text-2xl">Ativar o painel (3 passos)</h2>
          <ol className="mt-5 space-y-4">
            {[
              "Crie um projeto no Supabase e rode supabase/migrations/0002_platform.sql (cria todo o banco: viagens, participantes, reservas, conteúdo, auditoria).",
              "Copie a URL e a anon key para .env.local (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY).",
              "Crie o primeiro usuário admin (Supabase Auth) e faça login em /admin — a edição visual e o ERP passam a funcionar.",
            ].map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-serif text-lg text-gold-deep" style={{ borderColor: "var(--line)" }}>
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
