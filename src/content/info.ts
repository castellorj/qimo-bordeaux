export interface InfoFact {
  slug: string;
  icon: string;
  label: string;
  value: string;
}

export interface EtiquetteTip {
  slug: string;
  text: string;
}

export const infoFacts: InfoFact[] = [
  { slug: "moeda", icon: "Coins", label: "Moeda", value: "Euro (€). Cartões amplamente aceitos; leve algum troco." },
  { slug: "idioma", icon: "Languages", label: "Idioma", value: "Francês. Um 'Bonjour' abre todas as portas." },
  { slug: "fuso-horario", icon: "Clock", label: "Fuso horário", value: "Bordeaux (CET) está +4h ou +5h à frente do horário de Brasília." },
  { slug: "emergencia", icon: "Phone", label: "Emergência", value: "112 (número único europeu)." },
  { slug: "tomadas", icon: "ShieldCheck", label: "Tomadas", value: "Padrão europeu tipo C/E, 230V. Leve um adaptador." },
  { slug: "gorjeta", icon: "Wallet", label: "Gorjeta", value: "Serviço incluído; arredondar é gentileza, não obrigação." },
];

export const etiquetteTips: EtiquetteTip[] = [
  { slug: "bonjour", text: "Cumprimente sempre com 'Bonjour' ao entrar em lojas e restaurantes. É sinal de educação essencial." },
  { slug: "horarios", text: "O almoço costuma ser servido entre 12h e 14h; o jantar a partir das 19h30-20h." },
  { slug: "gorjeta", text: "A gorjeta (service) já está incluída na conta; arredondar é gentileza, não obrigação." },
  { slug: "vinho", text: "Vinho é levado a sério. Pergunte a recomendação do sommelier, ele terá prazer em ajudar." },
  { slug: "discricao", text: "Fale baixo em restaurantes e espaços públicos; discrição é valorizada." },
  { slug: "brinde", text: "Ao brindar, olhe nos olhos e diga 'Santé'. Dizem que dá azar não olhar." },
];
