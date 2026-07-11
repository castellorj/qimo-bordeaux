import type { ChefExperience } from "@/lib/types";

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
