import { PageHero } from "@/components/PageHero";
import { HubGridPhotos, type HubItem } from "@/components/Hub";

const items: HubItem[] = [
  { href: "/vinicolas", icon: "Grape", key: "vinicolas", image: "/photos/hero-lafite.jpg" },
  { href: "/restaurantes", icon: "UtensilsCrossed", key: "restaurantes", image: "/photos/food-entrecote.jpg" },
  { href: "/vinhos", icon: "Wine", key: "vinhos", image: "/photos/hero-margaux.jpg" },
  { href: "/gastronomia", icon: "UtensilsCrossed", key: "gastronomia", image: "/photos/food-entrecote.jpg" },
  { href: "/experiencias", icon: "Sparkles", key: "experiencias", image: "/photos/wine-glass.jpg" },
  { href: "/compras", icon: "ShoppingBag", key: "compras", image: "/photos/shop-laguiole.jpg" },
  { href: "/cidades", icon: "Landmark", key: "cidades", image: "/photos/hero-saint-emilion.jpg" },
];

export default function DescobrirPage() {
  return (
    <>
      <PageHero section="descobrir" small />
      <div className="container-editorial py-10">
        <HubGridPhotos items={items} />
      </div>
    </>
  );
}
