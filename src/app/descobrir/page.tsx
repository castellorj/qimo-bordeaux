import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/PageHero";
import { HubGridPhotos, type HubItem } from "@/components/Hub";

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
    { label: "Médoc", note: "Margaux · Pauillac · Saint-Julien", x: 32, y: 31, align: "right", tone: "wine" },
    { label: "Bordeaux", note: "Ponto de embarque", x: 39, y: 60, align: "right", tone: "main" },
    { label: "Sauternes", note: "Graves · vinhos doces", x: 49, y: 82, align: "left", tone: "gold" },
    { label: "Blaye", note: "Citadelle Vauban", x: 56, y: 40, align: "left", tone: "main" },
    { label: "Bourg", note: "Bourg-sur-Gironde", x: 59, y: 50, align: "left", tone: "gold" },
    { label: "Libourne", note: "Porto da margem direita", x: 72, y: 58, align: "left", tone: "main" },
    { label: "Saint-Émilion", note: "Vila UNESCO · Grands Crus", x: 82, y: 66, align: "left", tone: "wine" },
    { label: "Cognac", note: "Maison Rémy Martin", x: 73, y: 24, align: "left", tone: "gold" },
  ];
  const routeHighlights = ["Cruzeiro fluvial", "Châteaux e Grands Crus", "Cidades históricas"];

  return (
    <section className="mb-10 overflow-hidden rounded-[3px] border shadow-card" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
      <div className="grid gap-0 xl:grid-cols-[0.82fr_1.45fr]">
        <div className="relative border-b p-6 sm:p-8 xl:border-b-0 xl:border-r" style={{ borderColor: "var(--line)" }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-[#9f3b50] to-petrol-600" />
          <p className="kicker">Mapa do roteiro</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">Bordeaux Wine Central</h2>
          <div className="gold-rule mt-5" />
          <p className="prose-luxe mt-5">
            Uma leitura visual das regiões que aparecem no guia: vinícolas, cidades, restaurantes e experiências
            conectados pela rota fluvial da QIMO.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {routeHighlights.map((highlight) => (
              <span key={highlight} className="rounded-full border bg-white/45 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-petrol-700" style={{ borderColor: "var(--line)" }}>
                {highlight}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
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

        <div className="relative min-h-[620px] overflow-hidden bg-[#f4ead2] p-3 sm:p-6">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(circle at 24% 42%, rgba(167,203,208,.72), transparent 23%), radial-gradient(circle at 54% 45%, rgba(195,168,96,.16), transparent 32%), radial-gradient(circle at 82% 62%, rgba(143,47,47,.10), transparent 25%), linear-gradient(135deg, rgba(255,255,255,.35), transparent 44%)",
            }}
          />
          <div className="relative h-[590px] rounded-[3px] border bg-[#fbf4df]/90 shadow-[0_20px_60px_rgba(58,42,26,.12)]" style={{ borderColor: "rgba(170,139,91,.38)" }}>
            <div className="absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-[#9fc4ce]/70 via-[#b9d5d9]/42 to-transparent" />
            <div className="absolute left-[5%] top-[10%] h-[78%] w-[18%] rounded-[55%] bg-[#f8efd6] shadow-[inset_-14px_0_24px_rgba(128,97,55,.08)]" />
            <div className="absolute left-[1.8%] top-[45%] -rotate-90 font-sans text-[13px] font-semibold uppercase tracking-luxe text-petrol-600/45">Oceano Atlântico</div>
            <div className="absolute right-7 top-6 hidden items-center gap-2 rounded-full border bg-white/60 px-4 py-2 font-sans text-[10px] uppercase tracking-luxe text-[#9f3b50] sm:inline-flex" style={{ borderColor: "rgba(159,59,80,.22)" }}>
              <Icon name="Compass" size={13} /> Rota QIMO
            </div>

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <marker id="discover-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.8" markerHeight="3.8" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="#9f3b50" />
                </marker>
              </defs>
              <path d="M23 9 C28 18 31 29 33 42 C36 56 36 73 38 92" fill="none" stroke="rgba(73,118,130,.34)" strokeWidth="7.5" strokeLinecap="round" />
              <path d="M41 93 C38 80 39 68 43 57 C47 45 50 34 45 21" fill="none" stroke="rgba(73,118,130,.24)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M43 57 C52 47 57 39 61 45 C65 52 69 59 76 58 C82 57 87 62 92 68" fill="none" stroke="rgba(73,118,130,.20)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M32 30 C41 29 47 23 45 21" fill="none" stroke="#9f3b50" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" markerEnd="url(#discover-route-arrow)" />
              <path d="M45 21 C44 35 41 47 39 60" fill="none" stroke="#9f3b50" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" markerEnd="url(#discover-route-arrow)" />
              <path d="M39 60 C43 72 47 79 49 82" fill="none" stroke="#9f3b50" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" markerEnd="url(#discover-route-arrow)" />
              <path d="M39 60 C47 51 55 39 61 45 C65 49 66 54 72 58" fill="none" stroke="#9f3b50" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" markerEnd="url(#discover-route-arrow)" />
              <path d="M72 58 C76 62 80 65 82 66" fill="none" stroke="#9f3b50" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" markerEnd="url(#discover-route-arrow)" />
              <path d="M73 24 C67 28 63 35 61 45" fill="none" stroke="#9f3b50" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="0.1 2" markerEnd="url(#discover-route-arrow)" />
            </svg>

            <div className="absolute left-[21%] top-[15%] font-serif text-[24px] italic text-petrol-700/55">Gironde</div>
            <div className="absolute left-[38%] top-[89%] font-serif text-[22px] italic text-petrol-700/55">Garonne</div>
            <div className="absolute left-[69%] top-[72%] font-serif text-[22px] italic text-petrol-700/55">Dordogne</div>
            <div className="absolute left-[27%] top-[42%] hidden font-serif text-[34px] font-light tracking-wide text-[#9f3b50]/50 sm:block">MÉDOC</div>
            <div className="absolute left-[52%] top-[32%] hidden font-serif text-[44px] font-light tracking-wide text-petrol-700/75 sm:block">BLAYE</div>
            <div className="absolute left-[74%] top-[49%] hidden font-serif text-[25px] font-light tracking-wide text-[#9f3b50]/55 sm:block">ST-ÉMILION</div>
            <div className="absolute left-[43%] top-[74%] hidden font-serif text-[26px] font-light tracking-wide text-gold/70 sm:block">GRAVES</div>

            {stops.map((stop) => (
              <div
                key={stop.label}
                className="absolute"
                style={{ left: `${stop.x}%`, top: `${stop.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <span
                  className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow"
                  style={{
                    background:
                      stop.tone === "gold" ? "#c3a860" : stop.tone === "main" ? "#2f493f" : "#9f3b50",
                  }}
                />
                <div
                  className={`absolute top-1/2 min-w-[140px] -translate-y-1/2 rounded-[3px] border bg-white/90 px-3 py-2 shadow-[0_8px_24px_rgba(58,42,26,.10)] ${
                    stop.align === "right" ? "right-5 text-right" : "left-5"
                  }`}
                  style={{ borderColor: stop.tone === "wine" ? "rgba(159,59,80,.24)" : "rgba(195,168,96,.30)" }}
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
