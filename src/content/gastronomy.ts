import type { GastronomyItem } from "@/lib/types";

// Seção "Golf" — campos de golfe e tee times na região de Bordeaux.
// (A chave interna segue "gastronomy" por compatibilidade; o rótulo é Golf.)
export const gastronomy: GastronomyItem[] = [
  {
    slug: "cabot-bordeaux",
    name: "Cabot Bordeaux",
    category: "26 de outubro",
    subtitle: "Parcours Châteaux · Le Pian-Médoc",
    heroImage: "/media/golf-cabot-1.jpg",
    gallery: ["/media/golf-cabot-1.jpg", "/media/golf-cabot-2.jpg", "/media/golf-cabot-3.jpg"],
    description:
      "Dois campos de 18 buracos no coração do Médoc, a 20 km do centro histórico de Bordeaux. O Cabot, antigo anfitrião do Open de France, é a única obra europeia de Bill Coore, desenhada em 1989 com o arquiteto canadense Rod Whitman.",
    highlights: [
      "Nº 21 entre os 100 melhores campos da Europa — Golf World, 2025",
      "Melhor golf resort da França — World Golf Awards, 2025",
      "Green fee e transporte inclusos",
    ],
    teeTime: "Tee time ≈ 9h00",
    price: "€ 170 por pessoa",
    website: "https://cabot.com/bordeaux",
    qimoSelect: true,
  },
  {
    slug: "grand-saint-emilionnais",
    name: "Grand Saint-Émilionnais",
    category: "29 de outubro",
    subtitle: "Tom Doak · Gardegan-et-Tourtirac",
    heroImage: "/media/golf-se-1.png",
    gallery: ["/media/golf-se-1.png", "/media/golf-se-2.png", "/media/golf-se-3.png"],
    description:
      "Um campo cinco estrelas a dez quilômetros de Saint-Émilion, desenhado por Tom Doak. Ele se abre num vale cercado de robles centenários e vinhas, sem movimentação artificial de terra: os buracos seguem o desenho natural do terreno.",
    highlights: [
      "Nº 3 entre os melhores campos da França — Golf Digest",
      "\"Uma das obras-primas modernas do mundo\" — Planet Golf",
      "Green fee e transporte inclusos",
    ],
    teeTime: "Tee time ≈ 9h00",
    price: "€ 155 por pessoa",
    website: "https://segolfclub.com",
    qimoSelect: true,
  },
];
