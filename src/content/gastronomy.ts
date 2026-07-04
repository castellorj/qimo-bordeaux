import type { GastronomyItem } from "@/lib/types";

export const gastronomy: GastronomyItem[] = [
  {
    slug: "foie-gras",
    heroImage: "/photos/food-foiegras.jpg",
    name: "Foie Gras",
    category: "Salgado",
    description:
      "O fígado de pato ou ganso, joia da gastronomia do Sudoeste francês. Servido em terrine gelada, escalopado quente ou em torchon. Untuoso, delicado e profundo.",
    whereToTry: ["Mercados de Bordeaux e Libourne", "Restaurantes tradicionais do Sudoeste"],
    pairing: "Clássico com Sauternes gelado ou um tinto maduro de Pauillac.",
    qimoSelect: true,
  },
  {
    slug: "canele",
    heroImage: "/photos/food-canele.jpg",
    name: "Canelé",
    category: "Doce",
    description:
      "O doce-símbolo de Bordeaux: um bolinho de massa de baunilha e rum, com casca caramelizada e escura e interior macio como creme. Nasceu nos conventos da cidade.",
    whereToTry: ["Baillardran", "La Toque Cuivrée", "padarias de Bordeaux"],
    pairing: "Café ou um cálice de Sauternes.",
    qimoSelect: true,
  },
  {
    slug: "entrecote-bordelaise",
    heroImage: "/photos/food-entrecote.jpg",
    name: "Entrecôte à la Bordelaise",
    category: "Salgado",
    description:
      "Contrafilé grelhado na brasa de sarmentos de videira, servido com molho bordelês — vinho tinto, échalote e tutano. O casamento perfeito entre a carne e o grande vinho local.",
    whereToTry: ["La Tupina (Bordeaux)", "bistrôs tradicionais"],
    pairing: "Um Pauillac ou Saint-Julien encorpado.",
    qimoSelect: true,
  },
  {
    slug: "magret-de-canard",
    heroImage: "/photos/food-magret.jpg",
    name: "Magret de Canard",
    category: "Salgado",
    description:
      "Peito de pato gordo, selado com a pele crocante e servido rosado. Ícone da cozinha gascã, muitas vezes acompanhado de batatas salteadas na gordura de pato.",
    whereToTry: ["Restaurantes do Sudoeste", "mercados cobertos"],
    pairing: "Tinto da margem direita (Saint-Émilion, Pomerol).",
  },
  {
    slug: "ostras-arcachon",
    heroImage: "/photos/food-ostras.jpg",
    name: "Ostras de Arcachon",
    category: "Frutos do mar",
    description:
      "Da baía de Arcachon, a oeste de Bordeaux, saem ostras de sabor iodado e vegetal. Tradicionalmente servidas cruas com limão e acompanhadas de pequenas salsichas quentes (crépinettes).",
    whereToTry: ["Cussac-Fort-Médoc (degustação QIMO, Dia 2)", "Marché des Capucins, Bordeaux"],
    pairing: "Um branco seco de Graves ou Entre-deux-Mers bem gelado.",
    qimoSelect: true,
  },
  {
    slug: "queijos-franceses",
    heroImage: "/photos/food-queijos.jpg",
    name: "Queijos franceses",
    category: "Queijo",
    description:
      "A tábua francesa é um universo: do Comté envelhecido ao Roquefort azul, passando por Brie, Camembert e chèvres frescos. Servida antes da sobremesa, à francesa.",
    whereToTry: ["Mercados de Libourne e Bordeaux", "queijarias (fromageries)"],
    pairing: "Roquefort com Sauternes; casca lavada com tinto maduro.",
  },
  {
    slug: "macaron-saint-emilion",
    heroImage: "/photos/food-macaron.jpg",
    name: "Macaron de Saint-Émilion",
    category: "Doce",
    description:
      "Nada a ver com o macaron parisiense colorido: aqui é um biscoito rústico de amêndoa, criado pelas freiras ursulinas no século XVII. Crocante por fora, macio por dentro.",
    whereToTry: ["Saint-Émilion — casas históricas na vila (Dia 5)"],
    pairing: "Um cálice de Saint-Émilion Grand Cru ou café.",
    qimoSelect: true,
  },
  {
    slug: "mercados",
    heroImage: "/photos/food-mercado.jpg",
    name: "Mercados & produtores",
    category: "Mercado",
    description:
      "O coração da vida gastronômica: o Marché des Capucins em Bordeaux e os mercados de produtores de Libourne reúnem ostras, queijos, charcutaria, frutas, flores e vinho da região.",
    whereToTry: ["Marché des Capucins (Bordeaux)", "Mercado de Libourne (Dia 6)"],
    pairing: "Um cálice de branco entre uma banca e outra.",
  },
];
