import type { ShoppingItem } from "@/lib/types";

export const shopping: ShoppingItem[] = [
  {
    slug: "vinhos",
    heroImage: "/photos/shop-wine.jpg",
    name: "Vinhos de Bordeaux",
    category: "Vinho",
    description:
      "A compra mais natural. Prefira comprar direto nos châteaux visitados ou em cavistes de confiança em Bordeaux. Peça sempre nota fiscal para o Tax Free e cuidado com o transporte na bagagem.",
    whereToBuy: ["Châteaux visitados", "L'Intendant (torre de vinhos em Bordeaux)", "Bordeaux Magnum"],
    priceRange: "€ 15 a milhares",
    taxFree: true,
    qimoSelect: true,
  },
  {
    slug: "tacas",
    heroImage: "/photos/wine-glass.jpg",
    name: "Taças de cristal",
    category: "Mesa",
    description: "Taças de degustação (Riedel, Lehmann) elevam a experiência de qualquer grande vinho em casa.",
    whereToBuy: ["Lojas de arte de mesa em Bordeaux"],
    priceRange: "€ 20 a € 80 por taça",
    taxFree: true,
  },
  {
    slug: "saca-rolhas",
    heroImage: "/photos/shop-corkscrew.jpg",
    name: "Saca-rolhas & acessórios",
    category: "Vinho",
    description: "Do sommelier profissional aos modelos de alavanca — um bom saca-rolhas é lembrança útil e elegante.",
    whereToBuy: ["Boutiques de vinho", "cavistes"],
    priceRange: "€ 15 a € 120",
  },
  {
    slug: "facas-laguiole",
    heroImage: "/photos/shop-laguiole.jpg",
    name: "Facas Laguiole",
    category: "Cutelaria",
    description:
      "As icônicas facas francesas com a abelha no cabo. Prefira as forjadas na região (Laguiole ou Thiers) — atenção às imitações. Belíssimas para queijos e mesa.",
    whereToBuy: ["Cutelarias especializadas", "boutiques de artigos gourmet"],
    priceRange: "€ 40 a € 300+",
    taxFree: true,
    qimoSelect: true,
  },
  {
    slug: "queijos-conservas",
    heroImage: "/photos/food-queijos.jpg",
    name: "Queijos, geleias & mostardas",
    category: "Gourmet",
    description:
      "Queijos curados a vácuo, geleias artesanais, mostardas de Dijon e Bordeaux, mel e conservas do Sudoeste. Verifique as regras alfandegárias do Brasil para laticínios.",
    whereToBuy: ["Marché des Capucins", "mercados de Libourne", "épiceries fines"],
    priceRange: "€ 8 a € 40",
  },
  {
    slug: "flor-de-sal-trufas",
    heroImage: "/photos/shop-truffle.jpg",
    name: "Flor de sal & trufas",
    category: "Gourmet",
    description:
      "Flor de sal do Atlântico (Île de Ré, Guérande) e produtos trufados — azeites, sais e patês — que perfumam qualquer cozinha.",
    whereToBuy: ["Épiceries fines", "mercados"],
    priceRange: "€ 6 a € 60",
  },
  {
    slug: "chocolates",
    heroImage: "/photos/shop-chocolate.jpg",
    name: "Chocolates & canelés",
    category: "Doçaria",
    description:
      "Chocolates finos e os famosos canelés embalados para viagem. Baillardran e La Toque Cuivrée vendem caixas próprias para presente.",
    whereToBuy: ["Baillardran", "chocolatiers de Bordeaux"],
    priceRange: "€ 10 a € 40",
  },
  {
    slug: "artigos-franceses",
    heroImage: "/photos/shop-perfume.jpg",
    name: "Perfumes & moda",
    category: "Lifestyle",
    description:
      "Perfumaria francesa, lenços, artigos de couro e moda — a Rue Sainte-Catherine, a maior rua comercial de pedestres da Europa, concentra as opções.",
    whereToBuy: ["Rue Sainte-Catherine", "Galeries Bordelaises", "Cours de l'Intendance (luxo)"],
    priceRange: "Variado",
    taxFree: true,
  },
];

export const taxFreeGuide = {
  title: "Tax Free — como funciona",
  intro:
    "Residentes fora da União Europeia têm direito ao reembolso do IVA (TVA) em compras acima de € 100,01 na mesma loja, no mesmo dia.",
  steps: [
    "Peça o formulário Tax Free (Détaxe) na loja, apresentando o passaporte.",
    "Guarde as compras lacradas e as notas fiscais até o embarque.",
    "No aeroporto, valide o formulário nos quiosques PABLO (leitura do código de barras) antes do check-in.",
    "Receba o reembolso em cartão ou dinheiro, conforme o operador (Global Blue, Planet).",
  ],
  note: "O reembolso costuma variar de 12% a 15% do valor. Chegue com antecedência ao aeroporto para validar a détaxe.",
};
