import { PageHero } from "@/components/PageHero";
import { HubGridPhotos, type HubItem } from "@/components/Hub";

const items: HubItem[] = [
  { href: "/vinicolas", icon: "Grape", key: "vinicolas", image: "/photos/hero-lafite.jpg" },
  { href: "/restaurantes", icon: "UtensilsCrossed", key: "restaurantes", image: "/photos/food-entrecote.jpg" },
  { href: "/vinhos", icon: "Wine", key: "vinhos", image: "https://framerusercontent.com/assets/NrmSAGR3eetbhhi5ciounZb7vk.webp" },
  { href: "/gastronomia", icon: "UtensilsCrossed", key: "gastronomia", image: "/photos/food-entrecote.jpg" },
  { href: "/experiencias", icon: "Sparkles", key: "experiencias", image: "/photos/wine-glass.jpg" },
  { href: "/compras", icon: "ShoppingBag", key: "compras", image: "/photos/shop-laguiole.jpg" },
  { href: "/cidades", icon: "Landmark", key: "cidades", image: "/photos/hero-saint-emilion.jpg" },
];

export default function DescobrirPage() {
  return (
    <>
      {/* No mobile a tela vai direto aos cards (mais conteúdo à vista); no desktop mantém o topo editorial. */}
      <div className="hidden sm:block">
        <PageHero section="descobrir" small />
      </div>
      <div className="container-editorial pb-10 pt-5 sm:py-10">
        <HubGridPhotos items={items} orderKey="descobrir" />
      </div>
    </>
  );
}
