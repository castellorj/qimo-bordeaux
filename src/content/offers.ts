import type { PartnerOffer } from "@/lib/types";

export const partnerOffers: PartnerOffer[] = [
  {
    slug: "qimo-parceiro-exemplo",
    partner: "Parceiro QIMO",
    title: "Oferta exclusiva para hóspedes QIMO",
    description: "Benefício especial disponível durante a viagem. Edite esta oferta no admin para anunciar parceiros, lojas, experiências ou serviços recomendados.",
    benefit: "Condição especial QIMO",
    coupon: "QIMO",
    validUntil: "Durante a viagem",
    image: "/photos/bordeaux-hero.jpg",
    ctaLabel: "Ver oferta",
    url: "https://qimo.com.br",
    qimoSelect: true,
  },
];
