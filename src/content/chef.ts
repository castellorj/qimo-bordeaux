import type { ChefExperience, ChefProfile } from "@/lib/types";

export const chefProfile: ChefProfile = {
  slug: "thomas-troisgros",
  name: "Thomas Troisgros",
  kicker: "Sobre o chef",
  title: "Thomas Troisgros",
  lead:
    "Herdeiro da quarta geração Troisgros, Thomas traduz a técnica francesa da família em uma cozinha contemporânea, brasileira e autoral. No Rio, está à frente do Oseille, restaurante intimista de menu-degustação reconhecido com uma estrela Michelin.",
  body:
    "Sua trajetória passa pelo Culinary Institute of America, por Daniel Boulud em Nova York e por casas de referência como Mugaritz e Arzak, antes de assumir projetos da família no Brasil e criar seus próprios restaurantes.",
  closingQuote:
    "A curadoria QIMO nasce desse encontro: precisão francesa, alma carioca e uma leitura de Bordeaux feita para poucos convidados.",
  michelinLabel: "1 estrela Michelin",
  michelinText: "Chef à frente do Oseille, no Rio de Janeiro, reconhecido pelo Guia Michelin com uma estrela.",
  hotListLabel: "Hot List 2024",
  hotListText: "Oseille foi destacado pela Condé Nast Traveler entre os melhores novos restaurantes do mundo em 2024.",
  bestChefLabel: "The Best Chef Awards",
  bestChefText: "Thomas recebeu a distinção One Knife, categoria Excellent, no The Best Chef Awards.",
  fiftyBestLabel: "50 Best",
  fiftyBestText: "O Olympe, onde Thomas consolidou sua cozinha autoral, figurou em edições do Latin America's 50 Best Restaurants.",
  lineageLabel: "Dinastia Troisgros",
  lineageText: "Quarta geração de uma família que marcou a nouvelle cuisine e mantém três estrelas Michelin na França desde 1968.",
};

// Seção "Chef" — experiências extras de gastronomia (cross-sell), com curadoria de
// Thomas Troisgros. Conteúdo inicial editável no painel (aba Conteúdo → "Chef").
// Preços "sob consulta" até definição comercial. Apenas fotografias reais.
export const chefExperiences: ChefExperience[] = [
  {
    slug: "noite-vinhas-iconicas-haut-brion",
    name: "Jantar de gala no Château Haut-Brion",
    category: "Château Haut-Brion · Noite exclusiva",
    chef: "Chef Andrea Capasso · Le Clarence (2★ Michelin)",
    heroImage: "/photos/haut-brion-jantar.jpg",
    gallery: [
      "/photos/haut-brion-jantar.jpg",
      "/photos/haut-brion-salao.jpg",
      "/photos/haut-brion-vinhos.jpg",
      "/photos/haut-brion-la-mission.jpg",
      "/photos/haut-brion-cave.jpg",
    ],
    tagline: "An Evening Among Iconic Vines — uma noite entre as vinhas mais lendárias de Bordeaux.",
    description:
      "No Pavillon Catelan, elo histórico entre o Château Haut-Brion e o Château La Mission Haut-Brion, uma noite que reúne patrimônio e grandes vinhos. Começa com um tour privativo por um dos châteaux e uma recepção com champanhe no terraço, sobre os vinhedos icônicos do Haut-Brion. Segue-se um jantar assinado pelo chef Andrea Capasso (Le Clarence, duas estrelas Michelin), em que cada tempo é harmonizado a vinhos das propriedades. A noite pode se estender com uma festa dançante na cave abobadada restaurada e um presente comemorativo na despedida.",
    highlights: [
      "Tour privativo pelo Château Haut-Brion ou La Mission Haut-Brion",
      "Recepção com champanhe no terraço sobre os vinhedos",
      "Jantar em quatro tempos do chef Andrea Capasso (2★ Michelin)",
      "Harmonização com vinhos das propriedades (Haut-Brion, La Clarté, Quintus)",
      "Wine Ambassador comentando cada rótulo da noite",
      "Cave abobadada para dançar e presente comemorativo",
    ],
    duration: "19h às 1h",
    price: "€ 850 por pessoa",
    qimoSelect: true,
  },
  {
    slug: "jantar-troisgros-a-bordo",
    name: "Jantar assinado Thomas Troisgros",
    category: "Jantar exclusivo",
    chef: "Thomas Troisgros",
    heroImage: "/photos/ship-dining.jpg",
    gallery: [
      "/photos/ship-dining.jpg",
      "/photos/food-foiegras.jpg",
      "/photos/food-magret.jpg",
      "/photos/wine-glass.jpg",
    ],
    tagline: "Uma noite única a bordo — a mesa mais concorrida da viagem.",
    description:
      "Uma noite à parte a bordo: menu-degustação criado por Thomas Troisgros, unindo a técnica francesa ao olhar brasileiro, com harmonização de Grands Crus selecionados. Número reduzido de convidados.",
    highlights: [
      "Menu-degustação exclusivo do chef",
      "Harmonização com Grands Crus de Bordeaux",
      "Lugares limitados — ambiente intimista",
      "Apresentação do chef a cada tempo",
    ],
    duration: "≈ 3 horas",
    price: "sob consulta",
    qimoSelect: true,
  },
  {
    slug: "aula-cozinha-franco-brasileira",
    name: "Aula de cozinha franco-brasileira",
    category: "Experiência hands-on",
    chef: "Thomas Troisgros",
    heroImage: "/photos/food-entrecote.jpg",
    gallery: [
      "/photos/food-mercado.jpg",
      "/photos/food-entrecote.jpg",
      "/photos/food-ostras.jpg",
      "/photos/food-queijos.jpg",
    ],
    tagline: "Cozinhe ao lado do chef — e leve a técnica para casa.",
    description:
      "Mão na massa com a curadoria do chef: técnicas, produtos do mercado local de Bordeaux e o diálogo entre as duas cozinhas. Encerramento com almoço harmonizado.",
    highlights: [
      "Aula prática guiada pelo chef",
      "Ingredientes do mercado local de Bordeaux",
      "Almoço harmonizado ao final",
      "Grupo pequeno, atenção individual",
    ],
    duration: "≈ 2h30",
    price: "sob consulta",
    qimoSelect: true,
  },
  {
    slug: "harmonizacao-bordeaux-brasil",
    name: "Harmonização Bordeaux & Brasil",
    category: "Degustação guiada",
    chef: "Thomas Troisgros",
    heroImage: "/photos/wine-glass.jpg",
    gallery: [
      "/photos/wine-glass.jpg",
      "/photos/wine-graves.jpg",
      "/photos/wine-pomerol.jpg",
      "/photos/food-queijos.jpg",
    ],
    tagline: "Encontros improváveis entre o vinho francês e o Brasil.",
    description:
      "Uma degustação conduzida em torno de encontros improváveis entre vinhos de Bordeaux e ingredientes brasileiros — uma viagem sensorial curada a quatro mãos.",
    highlights: [
      "Vinhos de Bordeaux selecionados",
      "Petiscos autorais de inspiração brasileira",
      "Condução comentada, do rótulo à taça",
      "Experiência sensorial curada a quatro mãos",
    ],
    duration: "≈ 1h30",
    price: "sob consulta",
    qimoSelect: false,
  },
];
