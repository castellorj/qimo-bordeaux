import { PageHero } from "@/components/PageHero";
import { HubGridPhotos, type HubItem } from "@/components/Hub";
import { Icon } from "@/components/Icon";

const items: HubItem[] = [
  { href: "/vinicolas", icon: "Grape", key: "vinicolas", image: "/photos/hero-lafite.jpg" },
  { href: "/restaurantes", icon: "UtensilsCrossed", key: "restaurantes", image: "/photos/food-entrecote.jpg" },
  { href: "/vinhos", icon: "Wine", key: "vinhos", image: "https://www.bordeaux.com/app/uploads/2025/10/dsc_8445-1920x1080.jpg" },
  { href: "/gastronomia", icon: "UtensilsCrossed", key: "gastronomia", image: "/photos/food-entrecote.jpg" },
  { href: "/experiencias", icon: "Sparkles", key: "experiencias", image: "/photos/wine-glass.jpg" },
  { href: "/compras", icon: "ShoppingBag", key: "compras", image: "/photos/shop-laguiole.jpg" },
  { href: "/cidades", icon: "Landmark", key: "cidades", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Place_de_la_Bourse%2C_Bordeaux%2C_France.jpg/1280px-Place_de_la_Bourse%2C_Bordeaux%2C_France.jpg" },
];

export default function DescobrirPage() {
  return (
    <>
      {/* No mobile a tela vai direto aos cards (mais conteúdo à vista); no desktop mantém o topo editorial. */}
      <div className="hidden sm:block">
        <PageHero section="descobrir" small />
      </div>
      <div className="container-editorial pb-10 pt-5 sm:py-10">
        <RouteMapSection />
        <HubGridPhotos items={items} orderKey="descobrir" />
      </div>
    </>
  );
}

function RouteMapSection() {
  const stops = [
    { label: "Bordeaux", note: "Embarque e retorno", x: 41, y: 56, align: "right" },
    { label: "Medoc", note: "Margaux, Pauillac, St-Julien", x: 34, y: 31, align: "right" },
    { label: "Blaye", note: "Citadelle Vauban", x: 55, y: 40, align: "left" },
    { label: "Bourg", note: "Bourg-sur-Gironde", x: 58, y: 49, align: "left" },
    { label: "Libourne", note: "Porto da margem direita", x: 71, y: 56, align: "left" },
    { label: "Saint-Emilion", note: "Vilas e Grands Crus", x: 78, y: 63, align: "left" },
    { label: "Sauternes", note: "Graves e vinhos doces", x: 47, y: 79, align: "left" },
    { label: "Cognac", note: "Remy Martin", x: 70, y: 23, align: "left" },
  ];

  return (
    <section className="mb-10 overflow-hidden rounded-[3px] border" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.35fr]">
        <div className="border-b p-6 sm:p-8 lg:border-b-0 lg:border-r" style={{ borderColor: "var(--line)" }}>
          <p className="kicker">Mapa do roteiro</p>
          <h2 className="display mt-3 text-2xl sm:text-3xl">Bordeaux Wine Central</h2>
          <div className="gold-rule mt-5" />
          <p className="prose-luxe mt-5">
            Uma leitura visual das regiões que aparecem no guia: vinícolas, cidades, restaurantes e experiências
            conectados pela rota fluvial da QIMO.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: "Grape", title: "Margem esquerda", text: "Médoc, Graves e Sauternes" },
              { icon: "Landmark", title: "Margem direita", text: "Libourne e Saint-Émilion" },
              { icon: "Ship", title: "Rios da rota", text: "Garonne, Dordogne e Gironde" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-[3px] border bg-white/35 p-3" style={{ borderColor: "var(--line)" }}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/12 text-gold-deep">
                  <Icon name={item.icon} size={16} />
                </span>
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-wide2 text-gold">{item.title}</p>
                  <p className="font-sans text-[12px] text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[560px] overflow-hidden bg-[#f7f0df] p-4 sm:p-7">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 54%, rgba(197,217,217,.75), transparent 22%), radial-gradient(circle at 57% 42%, rgba(170,133,63,.12), transparent 28%), radial-gradient(circle at 79% 62%, rgba(143,47,47,.10), transparent 24%)",
            }}
          />
          <div className="relative h-[530px] rounded-[3px] border bg-[#fbf6e8]/80 shadow-sm" style={{ borderColor: "var(--line)" }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M18 8 C21 20 24 32 27 45 C29 56 31 67 33 91" fill="none" stroke="rgba(91,122,128,.35)" strokeWidth="9" strokeLinecap="round" />
              <path d="M38 92 C35 79 36 67 41 56 C46 44 48 35 43 25" fill="none" stroke="rgba(91,122,128,.28)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M41 56 C50 49 54 43 58 48 C62 53 66 58 73 57 C79 56 84 62 90 67" fill="none" stroke="rgba(91,122,128,.22)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M34 31 C40 31 44 28 43 25 C43 25 40 37 41 56 C42 66 45 75 47 79" fill="none" stroke="#9f3b50" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.1 2" />
              <path d="M41 56 C47 48 52 39 55 40 C58 41 58 48 58 48 C63 50 68 55 73 57 C75 59 77 62 78 63" fill="none" stroke="#9f3b50" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.1 2" />
              <path d="M71 23 C64 28 59 33 55 40" fill="none" stroke="#9f3b50" strokeWidth="1" strokeLinecap="round" strokeDasharray="0.1 2" />
            </svg>

            <div className="absolute left-3 top-8 -rotate-90 font-sans text-[12px] font-semibold uppercase tracking-luxe text-petrol-600/45">Oceano Atlantico</div>
            <div className="absolute left-[22%] top-[17%] font-serif text-[22px] italic text-petrol-700/60">Gironde</div>
            <div className="absolute left-[39%] top-[88%] font-serif text-[22px] italic text-petrol-700/60">Garonne</div>
            <div className="absolute left-[70%] top-[70%] font-serif text-[22px] italic text-petrol-700/60">Dordogne</div>

            {stops.map((stop) => (
              <div
                key={stop.label}
                className="absolute"
                style={{ left: `${stop.x}%`, top: `${stop.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#9f3b50] shadow" />
                <div
                  className={`absolute top-1/2 min-w-[132px] -translate-y-1/2 rounded-[3px] border bg-white/90 px-3 py-2 shadow-sm ${
                    stop.align === "right" ? "right-5 text-right" : "left-5"
                  }`}
                  style={{ borderColor: "var(--line)" }}
                >
                  <p className="font-serif text-[17px] font-light leading-tight text-petrol-700">{stop.label}</p>
                  <p className="mt-0.5 font-sans text-[10px] leading-snug text-muted">{stop.note}</p>
                </div>
              </div>
            ))}

            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 font-sans text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/75 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                <span className="h-2 w-2 rounded-full bg-[#9f3b50]" /> Rota QIMO
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/75 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                <Icon name="Grape" size={12} className="text-gold" /> Regiões vinícolas
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/75 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                <Icon name="Landmark" size={12} className="text-gold" /> Cidades do guia
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
