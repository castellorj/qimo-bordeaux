// O Navio — SS Bon Voyage (Uniworld)
// Dados reais: uniworld.com/us/ships/ss-bon-voyage
// 124 hóspedes · 51 tripulantes · 62 suítes · 4 decks · relançado em 2019.

export const ship = {
  name: "SS Bon Voyage",
  tagline: "Um château flutuante sobre os rios de Bordeaux",
  intro:
    "Concebido como um verdadeiro château sobre as águas, o SS Bon Voyage navega exclusivamente pela grande Bordeaux — Garonne, Dordogne e o estuário do Gironde. Reinaugurado em 2019 após uma transformação completa, combina arte e antiguidades francesas, suítes amplas, gastronomia autoral e um serviço all-inclusive discreto e impecável. Com apenas 124 hóspedes e 51 tripulantes, oferece uma das mais altas proporções de atenção por hóspede dos rios da Europa.",
  gallery: [
    "/photos/ship-exterior.jpg",
    "/photos/ship-dining.jpg",
    "/photos/ship-suite.jpg",
  ],
  moreInfoTitle: "Detalhes para aproveitar melhor o navio",
  moreInfoText:
    "Use este espaco para incluir orientacoes especificas da QIMO: servicos a bordo, horarios importantes, pontos de encontro, funcionamento de bares, dress code ou qualquer informacao operacional confirmada pela equipe.",
  moreInfoItems: [
    "Informacoes do navio podem ser atualizadas no painel conforme a operadora confirmar novos detalhes.",
    "Fotos adicionais aparecem automaticamente nesta pagina quando incluidas na galeria.",
  ],
  stats: [
    { n: "124", l: "hóspedes" },
    { n: "51", l: "tripulantes" },
    { n: "62", l: "suítes" },
    { n: "4", l: "decks" },
  ],
  facts: [
    { label: "Reinaugurado", value: "2019 (transformação completa)" },
    { label: "Dimensões", value: "110 m × 11,4 m · 5.000 GT" },
    { label: "Rios", value: "Garonne · Dordogne · estuário do Gironde" },
    { label: "Pensão", value: "All-inclusive de luxo" },
  ],
  dining: [
    {
      name: "Le Grand Fromage",
      text: "O restaurante principal, com menus que celebram a cozinha regional a partir de ingredientes locais e frescos.",
    },
    {
      name: "La Brasserie",
      text: "Um espaço mais descontraído, com o melhor da tradição bistrô francesa e vistas para os rios.",
    },
    {
      name: "La Cave des Vins",
      text: "Uma adega íntima onde conhecedores se reúnem para jantares harmonizados, sob reserva.",
    },
  ],
  suitesList: [
    { name: "Riverview Grand Suite", size: "280 sq ft (~26 m²)", note: "Entre as maiores suítes dos rios da Europa." },
    { name: "Suíte", size: "210 sq ft (~19,5 m²)", note: "Amplo conforto com estar e vista para o rio." },
    { name: "Sacada Francesa", size: "151 sq ft (~14 m²)", note: "Janela panorâmica que se abre para a paisagem." },
  ],
  highlights: [
    {
      icon: "Sparkles",
      title: "Soleil Deck & piscina infinita",
      text: "O deck superior, em tecidos vibrantes, abriga a única piscina de borda infinita dos rios — vistas deslumbrantes do campo francês.",
    },
    {
      icon: "UtensilsCrossed",
      title: "Gastronomia a bordo",
      text: "Três ambientes de refeição que celebram o terroir do Sudoeste francês, com produtos locais e adega regional.",
    },
    {
      icon: "Wine",
      title: "Vinhos & degustações",
      text: "Uma seleção de Bordeaux servida sem conta a pagar, além de jantares harmonizados na La Cave des Vins.",
    },
    {
      icon: "Music",
      title: "Espetáculos & lounge",
      text: "Música ao vivo, palestras e apresentações exclusivas — do French Cancan aos recitais das noites a bordo.",
    },
    {
      icon: "Sparkles",
      title: "Spa & fitness",
      text: "Espaço de bem-estar e centro de fitness para relaxar entre uma excursão e outra.",
    },
    {
      icon: "Bell",
      title: "Serviço & concierge",
      text: "51 tripulantes para 124 hóspedes: arrumação impecável, concierge dedicado e um cuidado quase invisível.",
    },
  ],
  suites: {
    title: "Suítes & acomodações",
    text: "Suítes e camarotes elegantes, muitos com sacada francesa, roupa de cama premium, banheiro em mármore e vista para os rios. Refúgios quentes e serenos, no melhor espírito da hotelaria francesa de luxo.",
  },

  // No-Wallet Trip — tudo incluído
  included: {
    tag: "No-Wallet Trip",
    categories: [
      {
        icon: "UtensilsCrossed",
        titleKey: "inc.food",
        items: [
          "7 cafés da manhã, 7 almoços e 7 jantares",
          "Jantares de gala e recepções de boas-vindas e despedida",
          "Bebidas ilimitadas a bordo: vinhos, destilados, cervejas, cafés especiais, chás e refrigerantes",
        ],
        spirits: [
          "Ketel One",
          "Grey Goose",
          "Bombay Sapphire",
          "Tanqueray",
          "Havana Club Añejo Especial",
          "Appleton V/X",
          "Johnnie Walker Black Label",
          "Maker's Mark",
          "Rémy Martin VSOP",
        ],
      },
      {
        icon: "Compass",
        titleKey: "inc.excursions",
        items: [
          "6 dias de excursões com especialistas locais",
          "Tours “Vamos lá!”, “Viva como um local” e “Dia na Vila”",
          "Sistema Quietvox para áudio nas visitas",
          "Uso de bicicletas e bastões de caminhada",
        ],
      },
      {
        icon: "BedDouble",
        titleKey: "inc.accommodation",
        items: [
          "7 noites no S.S. Bon Voyage, com suítes à beira-rio",
          "Cama Savoir®, lençóis egípcios e cardápio de travesseiros",
          "Wi-Fi gratuito",
        ],
      },
      {
        icon: "Sparkles",
        titleKey: "inc.other",
        items: [
          "Visita a 3 Patrimônios Mundiais da UNESCO",
          "Entretenimento a bordo",
          "Gerente de cruzeiro exclusivo Uniworld",
          "Transfers de chegada e saída incluídos",
          "Gorjetas a bordo e todas as taxas portuárias incluídas",
          "Festas e celebrações a bordo",
        ],
      },
    ],
  },
  note: "Informações do navio conforme a Uniworld (uniworld.com). Instalações e serviços podem variar; a equipe QIMO confirma tudo durante a viagem.",
};
