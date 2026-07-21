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
    slug: "jantar-troisgros-a-bordo",
    name: "Jantar assinado Thomas Troisgros",
    category: "Jantar exclusivo",
    chef: "Thomas Troisgros",
    heroImage: "/photos/ship-dining.jpg",
    description:
      "Uma noite à parte a bordo: menu-degustação criado por Thomas Troisgros, unindo a técnica francesa ao olhar brasileiro, com harmonização de Grands Crus selecionados. Número reduzido de convidados.",
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
    description:
      "Mão na massa com a curadoria do chef: técnicas, produtos do mercado local de Bordeaux e o diálogo entre as duas cozinhas. Encerramento com almoço harmonizado.",
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
    description:
      "Uma degustação conduzida em torno de encontros improváveis entre vinhos de Bordeaux e ingredientes brasileiros — uma viagem sensorial curada a quatro mãos.",
    duration: "≈ 1h30",
    price: "sob consulta",
    qimoSelect: false,
  },
];
