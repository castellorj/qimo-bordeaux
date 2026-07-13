// Internacionalização — Português · Inglês · Espanhol
export type Locale = "pt" | "en" | "es";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "pt", label: "PT", flag: "🇧🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export const DEFAULT_LOCALE: Locale = "pt";

// String localizada e lista localizada
export type LStr = Record<Locale, string>;
export type LArr = Record<Locale, string[]>;

export function L(v: LStr | string | undefined, locale: Locale): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[locale] ?? v[DEFAULT_LOCALE] ?? "";
}

export function LA(v: LArr | string[] | undefined, locale: Locale): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return v[locale] ?? v[DEFAULT_LOCALE] ?? [];
}

// Dicionário de interface
type Dict = Record<string, LStr>;

export const ui: Dict = {
  // marca
  brandSub: { pt: "Bordeaux Experience", en: "Bordeaux Experience", es: "Bordeaux Experience" },
  // navegação
  "nav.home": { pt: "Início", en: "Home", es: "Inicio" },
  "nav.programacao": { pt: "Programação", en: "Itinerary", es: "Programa" },
  "nav.barco": { pt: "O Navio", en: "The Ship", es: "El Barco" },
  "nav.mapa": { pt: "Mapa", en: "Map", es: "Mapa" },
  "nav.cidades": { pt: "Cidades", en: "Cities", es: "Ciudades" },
  "nav.vinicolas": { pt: "Vinícolas", en: "Wineries", es: "Bodegas" },
  "nav.experiencias": { pt: "Experiências", en: "Experiences", es: "Experiencias" },
  "nav.chef": { pt: "Chef", en: "Chef", es: "Chef" },
  "navd.chef": { pt: "Experiências por Thomas Troisgros", en: "Experiences by Thomas Troisgros", es: "Experiencias por Thomas Troisgros" },
  "hero.chef.k": { pt: "Curadoria Thomas Troisgros", en: "Curated by Thomas Troisgros", es: "Curaduría Thomas Troisgros" },
  "hero.chef.i": {
    pt: "Experiências gastronômicas exclusivas para reservar à parte.",
    en: "Exclusive dining experiences, available on request.",
    es: "Experiencias gastronómicas exclusivas para reservar aparte.",
  },
  "nav.vinhos": { pt: "Vinhos", en: "Wines", es: "Vinos" },
  "nav.gastronomia": { pt: "Gastronomia", en: "Cuisine", es: "Gastronomía" },
  "nav.compras": { pt: "Compras", en: "Shopping", es: "Compras" },
  "nav.concierge": { pt: "Concierge", en: "Concierge", es: "Concierge" },
  "nav.informacoes": { pt: "Informações úteis", en: "Useful info", es: "Información útil" },
  "nav.documentos": { pt: "Documentos", en: "Documents", es: "Documentos" },
  "nav.reservas": { pt: "Reservas", en: "Bookings", es: "Reservas" },
  "nav.paginas": { pt: "Páginas", en: "Pages", es: "Páginas" },
  "navd.paginas": { pt: "Guias e conteúdos extras", en: "Extra guides & content", es: "Guías y contenidos extra" },
  "nav.roteiro": { pt: "Roteiro", en: "Route", es: "Ruta" },
  "nav.restaurantes": { pt: "Restaurantes", en: "Restaurants", es: "Restaurantes" },
  "navd.restaurantes": { pt: "Mesas para reservar", en: "Tables to book", es: "Mesas para reservar" },
  "hero.restaurantes.k": { pt: "À mesa", en: "At the table", es: "En la mesa" },
  "hero.restaurantes.i": {
    pt: "As mesas mais memoráveis de Bordeaux.",
    en: "The most memorable tables in Bordeaux.",
    es: "Las mesas más memorables de Bordeaux.",
  },
  "nav.hoje": { pt: "Hoje", en: "Today", es: "Hoy" },
  "nav.viagem": { pt: "Viagem", en: "Trip", es: "Viaje" },
  "nav.descobrir": { pt: "Descobrir", en: "Discover", es: "Descubrir" },
  "nav.mais": { pt: "Mais", en: "More", es: "Más" },
  "navd.viagem": { pt: "Programação, mapa e documentos", en: "Itinerary, map & documents", es: "Programa, mapa y documentos" },
  "navd.descobrir": { pt: "Vinícolas, vinhos, mesas e experiências", en: "Wineries, wines, tables & experiences", es: "Bodegas, vinos, mesas y experiencias" },
  "navd.mais": { pt: "Concierge, clima e utilidades", en: "Concierge, weather & utilities", es: "Concierge, clima y utilidades" },
  "hero.viagem.k": { pt: "Sua viagem", en: "Your trip", es: "Tu viaje" },
  "hero.viagem.i": { pt: "Tudo sobre o roteiro em um só lugar.", en: "Everything about the itinerary in one place.", es: "Todo sobre el itinerario en un solo lugar." },
  "hero.descobrir.k": { pt: "Para explorar", en: "To explore", es: "Para explorar" },
  "hero.descobrir.i": { pt: "O melhor de Bordeaux, escolhido pela QIMO.", en: "The best of Bordeaux, curated by QIMO.", es: "Lo mejor de Bordeaux, elegido por QIMO." },
  "hero.mais.k": { pt: "Sempre à mão", en: "Always at hand", es: "Siempre a mano" },
  "hero.mais.i": { pt: "Concierge, utilidades e informações da viagem.", en: "Concierge, utilities and trip info.", es: "Concierge, utilidades e información del viaje." },
  // descrições de menu
  "navd.programacao": { pt: "Dia a dia da viagem", en: "Day by day", es: "Día a día" },
  "navd.barco": { pt: "SS Bon Voyage, a bordo", en: "SS Bon Voyage, on board", es: "SS Bon Voyage, a bordo" },
  "navd.mapa": { pt: "Portos, vinícolas e pontos", en: "Ports, wineries & spots", es: "Puertos, bodegas y puntos" },
  "navd.cidades": { pt: "Os destinos do roteiro", en: "The destinations", es: "Los destinos" },
  "navd.vinicolas": { pt: "Châteaux e casas visitadas", en: "Châteaux & houses", es: "Châteaux y casas" },
  "navd.experiencias": { pt: "Momentos exclusivos", en: "Exclusive moments", es: "Momentos exclusivos" },
  "navd.vinhos": { pt: "Biblioteca de apelações", en: "Appellation library", es: "Biblioteca de denominaciones" },
  "navd.gastronomia": { pt: "O que provar", en: "What to taste", es: "Qué probar" },
  "navd.compras": { pt: "O que levar & Tax Free", en: "What to buy & Tax Free", es: "Qué llevar y Tax Free" },
  "navd.concierge": { pt: "Suporte & emergências", en: "Support & emergencies", es: "Soporte y emergencias" },
  "navd.informacoes": { pt: "Clima, moeda, etiqueta", en: "Weather, currency, etiquette", es: "Clima, moneda, etiqueta" },
  "navd.documentos": { pt: "Passaporte, vouchers, seguro", en: "Passport, vouchers, insurance", es: "Pasaporte, vouchers, seguro" },
  "navd.reservas": { pt: "Seus passeios reservados", en: "Your booked activities", es: "Tus paseos reservados" },
  "docs.intro": {
    pt: "Seus documentos ficam armazenados apenas neste aparelho e continuam disponiveis mesmo sem conexao. Recomendamos manter tambem as vias oficiais.",
    en: "Your documents stay stored only on this device and remain available offline. We recommend keeping the official copies too.",
    es: "Tus documentos quedan almacenados solo en este dispositivo y siguen disponibles sin conexion. Recomendamos conservar tambien las copias oficiales.",
  },
  "docs.add": { pt: "Adicionar", en: "Add", es: "Agregar" },
  "docs.empty": { pt: "Nenhum documento adicionado.", en: "No documents added.", es: "Ningun documento agregado." },
  // comum
  menu: { pt: "Menu", en: "Menu", es: "Menú" },
  search: { pt: "Buscar", en: "Search", es: "Buscar" },
  searchPlaceholder: { pt: "Buscar em todo o guia…", en: "Search the whole guide…", es: "Buscar en toda la guía…" },
  searchHint: { pt: "Busque por cidades, vinícolas, vinhos, experiências, pratos…", en: "Search cities, wineries, wines, experiences, dishes…", es: "Busca ciudades, bodegas, vinos, experiencias, platos…" },
  searchEmpty: { pt: "Nada encontrado para", en: "No results for", es: "Sin resultados para" },
  seeMap: { pt: "Ver o mapa da viagem", en: "See the trip map", es: "Ver el mapa del viaje" },
  startExperience: { pt: "Começar experiência", en: "Start the experience", es: "Comenzar la experiencia" },
  openConcierge: { pt: "Abrir o concierge", en: "Open the concierge", es: "Abrir el concierge" },
  knowShip: { pt: "Conhecer o navio", en: "Discover the ship", es: "Conocer el barco" },
  fullItinerary: { pt: "Ver a programação completa", en: "See the full itinerary", es: "Ver el programa completo" },
  // Botão de cada dia na programação. A contagem "· N atividade(s)" usa as palavras abaixo;
  // deixe-as em branco no painel para remover o "· N ..." do botão.
  "prog.seeDay": { pt: "Ver programação do dia", en: "See the day's schedule", es: "Ver el programa del día" },
  "prog.hideDay": { pt: "Ocultar programação", en: "Hide schedule", es: "Ocultar programa" },
  "prog.activity": { pt: "atividade", en: "activity", es: "actividad" },
  "prog.activities": { pt: "atividades", en: "activities", es: "actividades" },
  explore: { pt: "Explorar", en: "Explore", es: "Explorar" },
  details: { pt: "Detalhes", en: "Details", es: "Detalles" },
  openMap: { pt: "Abrir no mapa", en: "Open in maps", es: "Abrir en el mapa" },
  day: { pt: "Dia", en: "Day", es: "Día" },
  // rodapé
  footerTagline: {
    pt: "Cruzeiro fluvial SS Bon Voyage · 25 de outubro a 1º de novembro de 2026. Um concierge digital de luxo para tornar cada instante memorável.",
    en: "SS Bon Voyage river cruise · 25 October to 1 November 2026. A digital luxury concierge to make every moment memorable.",
    es: "Crucero fluvial SS Bon Voyage · 25 de octubre al 1 de noviembre de 2026. Un concierge digital de lujo para hacer memorable cada instante.",
  },
  footerRights: { pt: "Experiências de viagem de alto padrão", en: "High-end travel experiences", es: "Experiencias de viaje de alto nivel" },
  visitSite: { pt: "Site da QIMO", en: "QIMO website", es: "Sitio de QIMO" },
  // home / intro
  qimoPresents: { pt: "QIMO apresenta", en: "QIMO presents", es: "QIMO presenta" },
  heroSub: {
    pt: "Sete noites navegando pelos rios da grande Bordeaux, entre Grands Crus, châteaux e as mesas mais memoráveis da França. A bordo do SS Bon Voyage.",
    en: "Seven nights sailing the rivers of greater Bordeaux, among Grands Crus, châteaux and France's most memorable tables. Aboard the SS Bon Voyage.",
    es: "Siete noches navegando por los ríos de la gran Bordeaux, entre Grands Crus, châteaux y las mesas más memorables de Francia. A bordo del SS Bon Voyage.",
  },
  boardingLabel: { pt: "para o embarque", en: "to departure", es: "para el embarque" },
  tripStarted: { pt: "A viagem começou", en: "The journey has begun", es: "El viaje ha comenzado" },
  introKicker: { pt: "Descubra o inesquecível", en: "Discover the unforgettable", es: "Descubre lo inolvidable" },
  introTitle: {
    pt: "As melhores jornadas não são apenas sobre destinos",
    en: "The finest journeys are not only about destinations",
    es: "Los mejores viajes no tratan solo de destinos",
  },
  introText: {
    pt: "Na QIMO, conectamos pessoas, lugares e histórias. Este guia foi criado para acompanhar cada momento da sua viagem por Bordeaux — do primeiro brinde ao último pôr do sol sobre os vinhedos.",
    en: "At QIMO, we connect people, places and stories. This guide was created to accompany every moment of your journey through Bordeaux — from the first toast to the last sunset over the vineyards.",
    es: "En QIMO, conectamos personas, lugares e historias. Esta guía fue creada para acompañar cada momento de tu viaje por Bordeaux — desde el primer brindis hasta el último atardecer sobre los viñedos.",
  },
  // home sections
  nextExperience: { pt: "Próxima experiência", en: "Next experience", es: "Próxima experiencia" },
  lastExperience: { pt: "Última experiência", en: "Last experience", es: "Última experiencia" },
  numbersDays: { pt: "dias de roteiro", en: "days of itinerary", es: "días de ruta" },
  numbersNights: { pt: "noites a bordo", en: "nights on board", es: "noches a bordo" },
  numbersCities: { pt: "cidades & portos", en: "cities & ports", es: "ciudades y puertos" },
  numbersCrus: { pt: "Grands Crus & casas", en: "Grands Crus & houses", es: "Grands Crus y casas" },
  itineraryKicker: { pt: "O itinerário", en: "The itinerary", es: "El itinerario" },
  itineraryTitle: { pt: "Oito dias, dois rios, um estuário", en: "Eight days, two rivers, one estuary", es: "Ocho días, dos ríos, un estuario" },
  navigateKicker: { pt: "Navegue pelo guia", en: "Browse the guide", es: "Navega por la guía" },
  navigateTitle: { pt: "Tudo à mão, com simplicidade", en: "Everything at hand, simply", es: "Todo a mano, con sencillez" },
  shipHomeKicker: { pt: "O seu lar flutuante", en: "Your floating home", es: "Tu hogar flotante" },
  shipHomeTitle: { pt: "Um château sobre as águas", en: "A château upon the water", es: "Un château sobre las aguas" },
  shipHomeText: {
    pt: "O SS Bon Voyage é um super navio-boutique de luxo que navega exclusivamente pela grande Bordeaux. Arte e antiguidades francesas, suítes amplas, gastronomia autoral e um serviço all-inclusive discreto — cada noite a bordo é uma extensão da viagem.",
    en: "The SS Bon Voyage is a boutique luxury super ship sailing exclusively through greater Bordeaux. French art and antiques, spacious suites, signature cuisine and a discreet all-inclusive service — every night on board is an extension of the journey.",
    es: "El SS Bon Voyage es un súper barco boutique de lujo que navega exclusivamente por la gran Bordeaux. Arte y antigüedades francesas, suites amplias, gastronomía de autor y un servicio all-inclusive discreto — cada noche a bordo es una extensión del viaje.",
  },
  qimoSealTitle: { pt: "Os momentos que assinamos", en: "The moments we sign", es: "Los momentos que firmamos" },
  qimoSealText: {
    pt: "Uma curadoria dos instantes mais preciosos da viagem — reservados, íntimos e inesquecíveis.",
    en: "A curation of the trip's most precious moments — private, intimate and unforgettable.",
    es: "Una curaduría de los instantes más preciosos del viaje — reservados, íntimos e inolvidables.",
  },
  conciergeCtaTitle: { pt: "A QIMO ao seu lado, sempre", en: "QIMO by your side, always", es: "QIMO a tu lado, siempre" },
  conciergeCtaText: {
    pt: "Concierge, emergências, transporte e suporte da equipe — a um toque de distância, inclusive offline.",
    en: "Concierge, emergencies, transport and team support — one tap away, even offline.",
    es: "Concierge, emergencias, transporte y soporte del equipo — a un toque, incluso sin conexión.",
  },
  seloQimo: { pt: "Seleção QIMO", en: "QIMO Selection", es: "Selección QIMO" },
  // Tela Hoje / concierge contextual
  greetMorning: { pt: "Bom dia", en: "Good morning", es: "Buenos días" },
  greetAfternoon: { pt: "Boa tarde", en: "Good afternoon", es: "Buenas tardes" },
  greetEvening: { pt: "Boa noite", en: "Good evening", es: "Buenas noches" },
  whatNow: { pt: "O que faço agora?", en: "What now?", es: "¿Qué hago ahora?" },
  howToGet: { pt: "Como chegar", en: "Get directions", es: "Cómo llegar" },
  startNav: { pt: "Iniciar navegação", en: "Start navigation", es: "Iniciar navegación" },
  seeDetails: { pt: "Ver detalhes", en: "See details", es: "Ver detalles" },
  hideDetails: { pt: "Ocultar detalhes", en: "Hide details", es: "Ocultar detalles" },
  recommendations: { pt: "Recomendações", en: "Recommendations", es: "Recomendaciones" },
  yourTrip: { pt: "Sua viagem a Bordeaux", en: "Your trip to Bordeaux", es: "Tu viaje a Bordeaux" },
  exploreBordeaux: { pt: "Explorar Bordeaux", en: "Explore Bordeaux", es: "Explorar Bordeaux" },
  exploreBordeauxSub: {
    pt: "Vinícolas, mesas, vinhos e experiências.",
    en: "Wineries, tables, wines and experiences.",
    es: "Bodegas, mesas, vinos y experiencias.",
  },
  onBoard: { pt: "A bordo do SS Bon Voyage", en: "Aboard the SS Bon Voyage", es: "A bordo del SS Bon Voyage" },
  recWalk: { pt: "Calçado confortável", en: "Comfortable shoes", es: "Calzado cómodo" },
  recCoat: { pt: "Leve um casaco", en: "Bring a coat", es: "Lleva un abrigo" },
  recWater: { pt: "Leve água", en: "Bring water", es: "Lleva agua" },
  recDress: { pt: "Dress code", en: "Dress code", es: "Código de vestimenta" },
  recSun: { pt: "Óculos de sol", en: "Sunglasses", es: "Gafas de sol" },
  readMore: { pt: "Ler mais", en: "Read more", es: "Leer más" },
  readLess: { pt: "Ler menos", en: "Read less", es: "Leer menos" },
  // Botões de reserva / concierge
  "act.reserveVisit": { pt: "Reservar visita", en: "Book a visit", es: "Reservar visita" },
  "act.reserveTable": { pt: "Reservar mesa", en: "Book a table", es: "Reservar mesa" },
  "act.reserveQimo": { pt: "Reservar com a QIMO", en: "Book with QIMO", es: "Reservar con QIMO" },
  "act.reserveHotel": { pt: "Reservar", en: "Book", es: "Reservar" },
  "act.site": { pt: "Site oficial", en: "Official site", es: "Sitio oficial" },
  "act.maps": { pt: "Como chegar", en: "Directions", es: "Cómo llegar" },
  "act.call": { pt: "Ligar", en: "Call", es: "Llamar" },
  "act.email": { pt: "E-mail", en: "Email", es: "E-mail" },
  "act.instagram": { pt: "Instagram", en: "Instagram", es: "Instagram" },
  "act.menu": { pt: "Cardápio", en: "Menu", es: "Carta" },
  "act.book": { pt: "Reservar", en: "Book", es: "Reservar" },
  reserveVia: { pt: "Reserva via", en: "Booking via", es: "Reserva vía" },
  conciergeHint: {
    pt: "A equipe QIMO cuida da reserva por você.",
    en: "The QIMO team handles the booking for you.",
    es: "El equipo QIMO se encarga de la reserva.",
  },
  // navio
  "ship.kicker": { pt: "O seu lar flutuante", en: "Your floating home", es: "Tu hogar flotante" },
  "ship.aboard": { pt: "A bordo", en: "On board", es: "A bordo" },
  "ship.life": { pt: "A vida a bordo", en: "Life on board", es: "La vida a bordo" },
  "ship.dining": { pt: "Gastronomia a bordo", en: "Dining on board", es: "Gastronomía a bordo" },
  "ship.accommodations": { pt: "Acomodações", en: "Accommodations", es: "Alojamiento" },
  "ship.moments": { pt: "Momentos a bordo", en: "Moments on board", es: "Momentos a bordo" },
  "ship.momentsText": {
    pt: "Palestras e apresentações exclusivas durante a navegação.",
    en: "Exclusive lectures and performances while cruising.",
    es: "Charlas y presentaciones exclusivas durante la navegación.",
  },
  // Tudo incluído
  "inc.title": { pt: "Tudo incluído", en: "All-inclusive", es: "Todo incluido" },
  "inc.subtitle": {
    pt: "Uma viagem sem carteira: deixe o cartão na suíte e aproveite. Tudo já está no seu roteiro.",
    en: "A no-wallet trip: leave your card in the suite and enjoy. It's all already included.",
    es: "Un viaje sin billetera: deja la tarjeta en la suite y disfruta. Todo ya está incluido.",
  },
  "inc.food": { pt: "Alimentação", en: "Dining", es: "Gastronomía" },
  "inc.excursions": { pt: "Excursões e atividades", en: "Excursions & activities", es: "Excursiones y actividades" },
  "inc.accommodation": { pt: "Acomodação", en: "Accommodation", es: "Alojamiento" },
  "inc.other": { pt: "Outras experiências", en: "Other experiences", es: "Otras experiencias" },
  "inc.bar": { pt: "Bar premium a bordo", en: "Premium bar on board", es: "Bar premium a bordo" },
  // page hero: títulos das seções
  "hero.programacao.k": { pt: "O roteiro dia a dia", en: "The day-by-day itinerary", es: "El itinerario día a día" },
  "hero.programacao.i": {
    pt: "Dia a dia, entre dois rios e um estuário.",
    en: "Day by day, between two rivers and an estuary.",
    es: "Día a día, entre dos ríos y un estuario.",
  },
  "hero.cidades.k": { pt: "Os destinos", en: "The destinations", es: "Los destinos" },
  "hero.cidades.i": {
    pt: "As escalas do roteiro, uma a uma.",
    en: "The stops of the journey, one by one.",
    es: "Las escalas del viaje, una a una.",
  },
  "hero.vinicolas.k": { pt: "Châteaux & casas", en: "Châteaux & houses", es: "Châteaux y casas" },
  "hero.vinicolas.i": {
    pt: "Os châteaux e Grands Crus da viagem.",
    en: "The châteaux and Grands Crus of the journey.",
    es: "Los châteaux y Grands Crus del viaje.",
  },
  "hero.vinhos.k": { pt: "Biblioteca de apelações", en: "Appellation library", es: "Biblioteca de denominaciones" },
  "hero.vinhos.i": {
    pt: "Um mapa sensorial das grandes apelações.",
    en: "A sensory map of the great appellations.",
    es: "Un mapa sensorial de las grandes denominaciones.",
  },
  "hero.experiencias.k": { pt: "Momentos exclusivos", en: "Exclusive moments", es: "Momentos exclusivos" },
  "hero.experiencias.i": {
    pt: "Os momentos que a QIMO assina.",
    en: "The moments QIMO signs.",
    es: "Los momentos que firma QIMO.",
  },
  "hero.gastronomia.k": { pt: "À mesa em Bordeaux", en: "At the table in Bordeaux", es: "En la mesa de Bordeaux" },
  "hero.gastronomia.i": {
    pt: "O que provar em Bordeaux.",
    en: "What to taste in Bordeaux.",
    es: "Qué probar en Bordeaux.",
  },
  "hero.compras.k": { pt: "O que levar de Bordeaux", en: "What to bring from Bordeaux", es: "Qué llevar de Bordeaux" },
  "hero.compras.i": {
    pt: "O que levar de Bordeaux.",
    en: "What to bring home from Bordeaux.",
    es: "Qué llevar de Bordeaux.",
  },
  "trip.ship": { pt: "SS Bon Voyage", en: "SS Bon Voyage", es: "SS Bon Voyage" },
  "trip.dates": { pt: "25 out — 1 nov 2026", en: "25 Oct — 1 Nov 2026", es: "25 oct — 1 nov 2026" },
  "trip.nights": { pt: "7 noites", en: "7 nights", es: "7 noches" },
  "trip.region": { pt: "Bordeaux · Gironde · Dordogne", en: "Bordeaux · Gironde · Dordogne", es: "Bordeaux · Gironde · Dordogne" },

  // Restaurantes — cabeçalho, categorias e ordenação
  "rest.kicker": { pt: "Onde comer em Bordeaux", en: "Where to eat in Bordeaux", es: "Dónde comer en Bordeaux" },
  "rest.title": { pt: "Curadoria gastronômica QIMO", en: "QIMO gastronomic curation", es: "Curaduría gastronómica QIMO" },
  "rest.intro": {
    pt: "Restaurantes, wine bars e experiências validados para consulta rápida no celular, com reserva, mapa e recomendação editorial em cada ficha.",
    en: "Restaurants, wine bars and experiences vetted for quick mobile reference, each with booking, map and editorial recommendation.",
    es: "Restaurantes, wine bars y experiencias validados para consulta rápida en el móvil, con reserva, mapa y recomendación editorial en cada ficha.",
  },
  "rest.cat.michelin.t": { pt: "Experiências Michelin e alta gastronomia", en: "Michelin experiences and fine dining", es: "Experiencias Michelin y alta gastronomía" },
  "rest.cat.michelin.i": { pt: "Mesas para ocasiões especiais, menus degustação, serviço de alto padrão e cartas de vinho para explorar Bordeaux com profundidade.", en: "Tables for special occasions, tasting menus, top-tier service and wine lists to explore Bordeaux in depth.", es: "Mesas para ocasiones especiales, menús degustación, servicio de alto nivel y cartas de vino para explorar Bordeaux a fondo." },
  "rest.cat.bistro.t": { pt: "Bistrôs e clássicos bordaleses", en: "Bistros and Bordeaux classics", es: "Bistrós y clásicos bordeleses" },
  "rest.cat.bistro.i": { pt: "Cozinha francesa tradicional, casas históricas e endereços com atmosfera local para almoços e jantares sem excesso de formalidade.", en: "Traditional French cuisine, historic houses and local-atmosphere spots for relaxed lunches and dinners.", es: "Cocina francesa tradicional, casas históricas y direcciones con atmósfera local para almuerzos y cenas sin exceso de formalidad." },
  "rest.cat.wineBar.t": { pt: "Wine bars e experiências para amantes de vinho", en: "Wine bars and experiences for wine lovers", es: "Wine bars y experiencias para amantes del vino" },
  "rest.cat.wineBar.i": { pt: "Taças, caves, degustações e conversas com curadores para descobrir denominações, produtores e estilos de Bordeaux.", en: "Glasses, cellars, tastings and conversations with curators to discover Bordeaux appellations, producers and styles.", es: "Copas, cavas, degustaciones y charlas con curadores para descubrir denominaciones, productores y estilos de Bordeaux." },
  "rest.cat.contemporary.t": { pt: "Experiências autênticas e contemporâneas", en: "Authentic and contemporary experiences", es: "Experiencias auténticas y contemporáneas" },
  "rest.cat.contemporary.i": { pt: "Mercados, mesas criativas e restaurantes modernos para alternar a alta gastronomia com uma Bordeaux mais cotidiana e atual.", en: "Markets, creative tables and modern restaurants to balance fine dining with an everyday, current Bordeaux.", es: "Mercados, mesas creativas y restaurantes modernos para alternar la alta gastronomía con una Bordeaux más cotidiana y actual." },
  "rest.sort.thomas": { pt: "Recomendados por Thomas Troisgros", en: "Recommended by Thomas Troisgros", es: "Recomendados por Thomas Troisgros" },
  "rest.sort.sophisticated": { pt: "Mais sofisticados", en: "Most sophisticated", es: "Más sofisticados" },
  "rest.sort.value": { pt: "Melhor custo-benefício", en: "Best value", es: "Mejor relación calidad-precio" },
  "rest.sort.near": { pt: "Mais próximos", en: "Closest", es: "Más cercanos" },
  "rest.sort.price": { pt: "Faixa de preço", en: "Price range", es: "Rango de precio" },
  "rest.cat.michelin.s": { pt: "Alta gastronomia", en: "Fine dining", es: "Alta gastronomía" },
  "rest.cat.bistro.s": { pt: "Bistrô", en: "Bistro", es: "Bistró" },
  "rest.cat.wineBar.s": { pt: "Wine bar", en: "Wine bar", es: "Wine bar" },
  "rest.cat.contemporary.s": { pt: "Contemporâneo", en: "Contemporary", es: "Contemporáneo" },
  "rest.book": { pt: "Reservar mesa", en: "Book a table", es: "Reservar mesa" },
  "rest.contact": { pt: "Entrar em contato", en: "Get in touch", es: "Contactar" },

  // Chef (Troisgros)
  "chef.curator": { pt: "Curadoria de Thomas Troisgros", en: "Curated by Thomas Troisgros", es: "Curaduría de Thomas Troisgros" },
  "chef.lead": {
    pt: "Experiências gastronômicas exclusivas, criadas para os hóspedes da QIMO e reservadas à parte. Vagas limitadas — fale com a nossa equipe para garantir a sua.",
    en: "Exclusive gastronomic experiences created for QIMO guests and booked separately. Limited spots — talk to our team to secure yours.",
    es: "Experiencias gastronómicas exclusivas, creadas para los huéspedes de QIMO y reservadas aparte. Plazas limitadas — habla con nuestro equipo para asegurar la tuya.",
  },
  "chef.cta": { pt: "Reservar com a QIMO", en: "Book with QIMO", es: "Reservar con QIMO" },
  "chef.empty": { pt: "Em breve — experiências sendo finalizadas.", en: "Coming soon — experiences being finalized.", es: "Pronto — experiencias en preparación." },

  // Concierge — rótulos internos
  "conc.grp.support": { pt: "Suporte QIMO", en: "QIMO support", es: "Soporte QIMO" },
  "conc.grp.emergency": { pt: "Emergências & assistência", en: "Emergencies & assistance", es: "Emergencias y asistencia" },
  "conc.grp.utils": { pt: "Transporte & utilidades", en: "Transport & utilities", es: "Transporte y utilidades" },
  "conc.ship.cta": { pt: "Conhecer o navio", en: "Discover the ship", es: "Conocer el barco" },
  "conc.cur.euro": { pt: "Euro (€)", en: "Euro (€)", es: "Euro (€)" },
  "conc.cur.real": { pt: "Real (R$)", en: "Real (R$)", es: "Real (R$)" },
  "conc.cur.live": { pt: "Cotação ao vivo", en: "Live rate", es: "Cotización en vivo" },
  "conc.cur.approx": { pt: "Cotação aproximada", en: "Approximate rate", es: "Cotización aproximada" },

  // Tax Free (Compras)
  "taxfree.title": { pt: "Tax Free — como funciona", en: "Tax Free — how it works", es: "Tax Free — cómo funciona" },
  "taxfree.intro": {
    pt: "Residentes fora da União Europeia têm direito ao reembolso do IVA (TVA) em compras acima de € 100,01 na mesma loja, no mesmo dia.",
    en: "Residents outside the European Union are entitled to a VAT (TVA) refund on purchases over € 100.01 in the same store, on the same day.",
    es: "Los residentes fuera de la Unión Europea tienen derecho al reembolso del IVA (TVA) en compras superiores a € 100,01 en la misma tienda, el mismo día.",
  },
  "taxfree.step1": { pt: "Peça o formulário Tax Free (Détaxe) na loja, apresentando o passaporte.", en: "Ask for the Tax Free (Détaxe) form in the store, showing your passport.", es: "Pide el formulario Tax Free (Détaxe) en la tienda, mostrando el pasaporte." },
  "taxfree.step2": { pt: "Guarde as compras lacradas e as notas fiscais até o embarque.", en: "Keep purchases sealed and receipts until boarding.", es: "Guarda las compras selladas y los recibos hasta el embarque." },
  "taxfree.step3": { pt: "No aeroporto, valide o formulário nos quiosques PABLO (leitura do código de barras) antes do check-in.", en: "At the airport, validate the form at the PABLO kiosks (barcode scan) before check-in.", es: "En el aeropuerto, valida el formulario en los quioscos PABLO (lectura del código de barras) antes del check-in." },
  "taxfree.step4": { pt: "Receba o reembolso em cartão ou dinheiro, conforme o operador (Global Blue, Planet).", en: "Receive the refund by card or cash, depending on the operator (Global Blue, Planet).", es: "Recibe el reembolso en tarjeta o efectivo, según el operador (Global Blue, Planet)." },
  "taxfree.note": {
    pt: "O reembolso costuma variar de 12% a 15% do valor. Chegue com antecedência ao aeroporto para validar a détaxe.",
    en: "The refund is usually 12% to 15% of the value. Arrive at the airport early to validate the détaxe.",
    es: "El reembolso suele ser del 12% al 15% del valor. Llega con antelación al aeropuerto para validar la détaxe.",
  },

  // Tela de entrada (login/boas-vindas) — PT editável no painel; EN/ES fixos aqui
  "gate.kicker": { pt: "Bordeaux Experience", en: "Bordeaux Experience", es: "Bordeaux Experience" },
  "gate.title1": { pt: "Bem-vindo a bordo", en: "Welcome aboard", es: "Bienvenido a bordo" },
  "gate.sub1": {
    pt: "Seu concierge digital pela grande Bordeaux. Informe seu telefone para entrar.",
    en: "Your digital concierge through greater Bordeaux. Enter your phone number to access the guide.",
    es: "Tu concierge digital por la gran Bordeaux. Ingresa tu teléfono para acceder a la guía.",
  },
  "gate.btn1": { pt: "Entrar", en: "Enter", es: "Entrar" },
  "gate.checking": { pt: "Verificando…", en: "Checking…", es: "Verificando…" },
  "gate.title2": { pt: "Complete seu cadastro", en: "Complete your registration", es: "Completa tu registro" },
  "gate.sub2": { pt: "Só mais um passo para abrir o seu guia.", en: "Just one more step to open your guide.", es: "Solo un paso más para abrir tu guía." },
  "gate.name": { pt: "Nome completo *", en: "Full name *", es: "Nombre completo *" },
  "gate.email": { pt: "E-mail *", en: "Email *", es: "Correo *" },
  "gate.btn2": { pt: "Entrar no guia", en: "Enter the guide", es: "Entrar a la guía" },
  "gate.registering": { pt: "Cadastrando…", en: "Registering…", es: "Registrando…" },
  "gate.back": { pt: "← Voltar", en: "← Back", es: "← Volver" },
  "gate.errPhone": { pt: "Informe um telefone válido, com DDD.", en: "Enter a valid phone number.", es: "Ingresa un teléfono válido." },
  "gate.errForm": { pt: "Preencha nome e e-mail válidos.", en: "Enter a valid name and email.", es: "Ingresa un nombre y correo válidos." },
  "gate.priv": { pt: "Seus dados são tratados com discrição. Sem senha, sem spam.", en: "Your details are handled with discretion. No password, no spam.", es: "Tus datos se tratan con discreción. Sin contraseña, sin spam." },
  "hero.concierge.k": { pt: "Concierge QIMO", en: "QIMO Concierge", es: "Concierge QIMO" },
  "hero.concierge.t": { pt: "Tudo ao seu alcance", en: "Everything within reach", es: "Todo a tu alcance" },
  "hero.concierge.i": {
    pt: "O essencial da viagem, sempre à mão — contatos, etiqueta de bordo e informações do navio.",
    en: "The essentials of the trip, always at hand — contacts, on-board etiquette and ship information.",
    es: "Lo esencial del viaje, siempre a mano — contactos, etiqueta de a bordo e información del barco.",
  },
  "hero.informacoes.k": { pt: "Antes e durante", en: "Before and during", es: "Antes y durante" },
  "hero.informacoes.i": {
    pt: "Clima, moeda, fuso, etiqueta e tudo o que ajuda a viver Bordeaux como um local.",
    en: "Weather, currency, time zone, etiquette and all that helps you live Bordeaux like a local.",
    es: "Clima, moneda, huso horario, etiqueta y todo lo que ayuda a vivir Bordeaux como un local.",
  },
  "hero.documentos.k": { pt: "Seu cofre de viagem", en: "Your travel vault", es: "Tu caja fuerte de viaje" },
  "hero.documentos.i": {
    pt: "Passaporte, seguro, passagens, vouchers e QR codes — guardados apenas neste dispositivo e offline.",
    en: "Passport, insurance, tickets, vouchers and QR codes — stored only on this device and offline.",
    es: "Pasaporte, seguro, billetes, vouchers y códigos QR — guardados solo en este dispositivo y sin conexión.",
  },
  "hero.reservas.k": { pt: "Seus passeios", en: "Your activities", es: "Tus paseos" },
  "hero.reservas.i": {
    pt: "As atividades que você reservou — para você e seus acompanhantes.",
    en: "The activities you booked — for you and your companions.",
    es: "Las actividades que reservaste — para ti y tus acompañantes.",
  },
  "hero.mapa.k": { pt: "A geografia da viagem", en: "The trip's geography", es: "La geografía del viaje" },
  "hero.mapa.i": {
    pt: "Portos, cidades e vinícolas do roteiro. Toque em qualquer ponto para abrir a rota no seu mapa.",
    en: "Ports, cities and wineries of the route. Tap any point to open the route in your maps.",
    es: "Puertos, ciudades y bodegas de la ruta. Toca cualquier punto para abrir la ruta en tu mapa.",
  },
};

export type UiOverrides = Record<string, Partial<Record<Locale, string>>>;

export function makeT(locale: Locale, overrides?: UiOverrides) {
  return (key: string) => {
    const ov = overrides?.[key]?.[locale];
    if (ov) return ov;
    const entry = ui[key];
    return entry ? entry[locale] ?? entry[DEFAULT_LOCALE] : key;
  };
}

// Chaves editáveis pela equipe (rótulos de botões e seções principais)
export const EDITABLE_LABELS: { key: string; grp: string }[] = [
  { key: "nav.hoje", grp: "Menu" }, { key: "nav.viagem", grp: "Menu" }, { key: "nav.descobrir", grp: "Menu" },
  { key: "nav.reservas", grp: "Menu" }, { key: "nav.mais", grp: "Menu" },
  { key: "nav.programacao", grp: "Menu" }, { key: "nav.barco", grp: "Menu" }, { key: "nav.mapa", grp: "Menu" },
  { key: "nav.cidades", grp: "Menu" }, { key: "nav.vinicolas", grp: "Menu" }, { key: "nav.restaurantes", grp: "Menu" },
  { key: "nav.vinhos", grp: "Menu" }, { key: "nav.gastronomia", grp: "Menu" }, { key: "nav.experiencias", grp: "Menu" },
  { key: "nav.compras", grp: "Menu" }, { key: "nav.concierge", grp: "Menu" }, { key: "nav.informacoes", grp: "Menu" },
  // Tela Hoje — todos os textos da tela inicial do hóspede
  { key: "onBoard", grp: "Tela Hoje" }, { key: "greetMorning", grp: "Tela Hoje" }, { key: "greetAfternoon", grp: "Tela Hoje" }, { key: "greetEvening", grp: "Tela Hoje" },
  { key: "boardingLabel", grp: "Tela Hoje" }, { key: "whatNow", grp: "Tela Hoje" }, { key: "recommendations", grp: "Tela Hoje" },
  { key: "exploreBordeaux", grp: "Tela Hoje" }, { key: "exploreBordeauxSub", grp: "Tela Hoje" },
  { key: "recWalk", grp: "Tela Hoje" }, { key: "recCoat", grp: "Tela Hoje" }, { key: "recWater", grp: "Tela Hoje" }, { key: "recSun", grp: "Tela Hoje" }, { key: "recDress", grp: "Tela Hoje" },
  { key: "prog.seeDay", grp: "Programação" }, { key: "prog.hideDay", grp: "Programação" },
  { key: "prog.activity", grp: "Programação" }, { key: "prog.activities", grp: "Programação" },
  { key: "howToGet", grp: "Botões" }, { key: "startNav", grp: "Botões" },
  { key: "seeDetails", grp: "Botões" }, { key: "hideDetails", grp: "Botões" }, { key: "startExperience", grp: "Botões" }, { key: "openConcierge", grp: "Botões" },
  { key: "knowShip", grp: "Botões" }, { key: "fullItinerary", grp: "Botões" },
  { key: "act.reserveTable", grp: "Reservas" }, { key: "act.reserveVisit", grp: "Reservas" },
  { key: "act.reserveQimo", grp: "Reservas" }, { key: "act.site", grp: "Reservas" }, { key: "act.maps", grp: "Reservas" },
  { key: "act.call", grp: "Reservas" }, { key: "act.menu", grp: "Reservas" },
  { key: "seloQimo", grp: "Marca" }, { key: "brandSub", grp: "Marca" },
  { key: "nav.documentos", grp: "Menu" }, { key: "nav.paginas", grp: "Menu" }, { key: "nav.chef", grp: "Menu" },
  { key: "navd.viagem", grp: "Descricoes de menu" }, { key: "navd.descobrir", grp: "Descricoes de menu" }, { key: "navd.mais", grp: "Descricoes de menu" },
  { key: "navd.programacao", grp: "Descricoes de menu" }, { key: "navd.barco", grp: "Descricoes de menu" }, { key: "navd.mapa", grp: "Descricoes de menu" },
  { key: "navd.cidades", grp: "Descricoes de menu" }, { key: "navd.vinicolas", grp: "Descricoes de menu" }, { key: "navd.restaurantes", grp: "Descricoes de menu" },
  { key: "navd.vinhos", grp: "Descricoes de menu" }, { key: "navd.gastronomia", grp: "Descricoes de menu" }, { key: "navd.experiencias", grp: "Descricoes de menu" },
  { key: "navd.compras", grp: "Descricoes de menu" }, { key: "navd.concierge", grp: "Descricoes de menu" }, { key: "navd.informacoes", grp: "Descricoes de menu" },
  { key: "navd.documentos", grp: "Descricoes de menu" }, { key: "navd.reservas", grp: "Descricoes de menu" }, { key: "navd.paginas", grp: "Descricoes de menu" }, { key: "navd.chef", grp: "Descricoes de menu" },
  { key: "docs.intro", grp: "Documentos" }, { key: "docs.add", grp: "Documentos" }, { key: "docs.empty", grp: "Documentos" },
  { key: "hero.programacao.k", grp: "Topo das paginas" }, { key: "hero.programacao.i", grp: "Topo das paginas" },
  { key: "hero.cidades.k", grp: "Topo das paginas" }, { key: "hero.cidades.i", grp: "Topo das paginas" },
  { key: "hero.vinicolas.k", grp: "Topo das paginas" }, { key: "hero.vinicolas.i", grp: "Topo das paginas" },
  { key: "hero.restaurantes.k", grp: "Topo das paginas" }, { key: "hero.restaurantes.i", grp: "Topo das paginas" },
  { key: "hero.vinhos.k", grp: "Topo das paginas" }, { key: "hero.vinhos.i", grp: "Topo das paginas" },
  { key: "hero.gastronomia.k", grp: "Topo das paginas" }, { key: "hero.gastronomia.i", grp: "Topo das paginas" },
  { key: "hero.experiencias.k", grp: "Topo das paginas" }, { key: "hero.experiencias.i", grp: "Topo das paginas" },
  { key: "hero.compras.k", grp: "Topo das paginas" }, { key: "hero.compras.i", grp: "Topo das paginas" },
  { key: "hero.chef.k", grp: "Topo das paginas" }, { key: "hero.chef.i", grp: "Topo das paginas" },
  { key: "hero.concierge.k", grp: "Topo das paginas" }, { key: "hero.concierge.t", grp: "Topo das paginas" }, { key: "hero.concierge.i", grp: "Topo das paginas" },
  { key: "trip.ship", grp: "Sua viagem" }, { key: "trip.dates", grp: "Sua viagem" }, { key: "trip.nights", grp: "Sua viagem" }, { key: "trip.region", grp: "Sua viagem" },
  { key: "rest.kicker", grp: "Restaurantes" }, { key: "rest.title", grp: "Restaurantes" }, { key: "rest.intro", grp: "Restaurantes" },
  { key: "rest.cat.michelin.t", grp: "Restaurantes" }, { key: "rest.cat.michelin.i", grp: "Restaurantes" },
  { key: "rest.cat.bistro.t", grp: "Restaurantes" }, { key: "rest.cat.bistro.i", grp: "Restaurantes" },
  { key: "rest.cat.wineBar.t", grp: "Restaurantes" }, { key: "rest.cat.wineBar.i", grp: "Restaurantes" },
  { key: "rest.cat.contemporary.t", grp: "Restaurantes" }, { key: "rest.cat.contemporary.i", grp: "Restaurantes" },
  { key: "rest.sort.thomas", grp: "Restaurantes" }, { key: "rest.sort.sophisticated", grp: "Restaurantes" }, { key: "rest.sort.value", grp: "Restaurantes" },
  { key: "rest.sort.near", grp: "Restaurantes" }, { key: "rest.sort.price", grp: "Restaurantes" },
  { key: "rest.cat.michelin.s", grp: "Restaurantes" }, { key: "rest.cat.bistro.s", grp: "Restaurantes" }, { key: "rest.cat.wineBar.s", grp: "Restaurantes" }, { key: "rest.cat.contemporary.s", grp: "Restaurantes" },
  { key: "rest.book", grp: "Restaurantes" }, { key: "rest.contact", grp: "Restaurantes" },
  { key: "chef.curator", grp: "Chef" }, { key: "chef.lead", grp: "Chef" }, { key: "chef.cta", grp: "Chef" }, { key: "chef.empty", grp: "Chef" },
  { key: "conc.grp.support", grp: "Concierge" }, { key: "conc.grp.emergency", grp: "Concierge" }, { key: "conc.grp.utils", grp: "Concierge" }, { key: "conc.ship.cta", grp: "Concierge" },
  { key: "conc.cur.euro", grp: "Concierge" }, { key: "conc.cur.real", grp: "Concierge" }, { key: "conc.cur.live", grp: "Concierge" }, { key: "conc.cur.approx", grp: "Concierge" },
  { key: "taxfree.title", grp: "Tax Free" }, { key: "taxfree.intro", grp: "Tax Free" }, { key: "taxfree.note", grp: "Tax Free" },
  { key: "taxfree.step1", grp: "Tax Free" }, { key: "taxfree.step2", grp: "Tax Free" }, { key: "taxfree.step3", grp: "Tax Free" }, { key: "taxfree.step4", grp: "Tax Free" },
  { key: "gate.kicker", grp: "Tela de entrada" }, { key: "gate.title1", grp: "Tela de entrada" }, { key: "gate.sub1", grp: "Tela de entrada" },
  { key: "gate.btn1", grp: "Tela de entrada" }, { key: "gate.title2", grp: "Tela de entrada" }, { key: "gate.sub2", grp: "Tela de entrada" },
  { key: "gate.name", grp: "Tela de entrada" }, { key: "gate.email", grp: "Tela de entrada" }, { key: "gate.btn2", grp: "Tela de entrada" },
  { key: "gate.back", grp: "Tela de entrada" }, { key: "gate.errPhone", grp: "Tela de entrada" }, { key: "gate.errForm", grp: "Tela de entrada" }, { key: "gate.priv", grp: "Tela de entrada" },
  { key: "hero.viagem.k", grp: "Topos dos hubs" }, { key: "hero.viagem.i", grp: "Topos dos hubs" },
  { key: "hero.descobrir.k", grp: "Topos dos hubs" }, { key: "hero.descobrir.i", grp: "Topos dos hubs" },
  { key: "hero.mais.k", grp: "Topos dos hubs" }, { key: "hero.mais.i", grp: "Topos dos hubs" },
  { key: "qimoPresents", grp: "Home" }, { key: "heroSub", grp: "Home" }, { key: "introKicker", grp: "Home" },
  { key: "introTitle", grp: "Home" }, { key: "introText", grp: "Home" }, { key: "nextExperience", grp: "Home" },
  { key: "lastExperience", grp: "Home" }, { key: "numbersDays", grp: "Home" }, { key: "numbersNights", grp: "Home" },
  { key: "numbersCities", grp: "Home" }, { key: "numbersCrus", grp: "Home" }, { key: "itineraryKicker", grp: "Home" },
  { key: "itineraryTitle", grp: "Home" }, { key: "navigateKicker", grp: "Home" }, { key: "navigateTitle", grp: "Home" },
  { key: "shipHomeKicker", grp: "Home" }, { key: "shipHomeTitle", grp: "Home" }, { key: "shipHomeText", grp: "Home" },
  { key: "qimoSealTitle", grp: "Home" }, { key: "qimoSealText", grp: "Home" }, { key: "conciergeCtaTitle", grp: "Home" }, { key: "conciergeCtaText", grp: "Home" },
  { key: "ship.kicker", grp: "Navio" }, { key: "ship.aboard", grp: "Navio" }, { key: "ship.life", grp: "Navio" },
  { key: "ship.dining", grp: "Navio" }, { key: "ship.accommodations", grp: "Navio" }, { key: "ship.moments", grp: "Navio" }, { key: "ship.momentsText", grp: "Navio" },
  { key: "inc.title", grp: "Navio" }, { key: "inc.subtitle", grp: "Navio" }, { key: "inc.food", grp: "Navio" },
  { key: "inc.excursions", grp: "Navio" }, { key: "inc.accommodation", grp: "Navio" }, { key: "inc.other", grp: "Navio" }, { key: "inc.bar", grp: "Navio" },
  { key: "act.email", grp: "Reservas" }, { key: "act.instagram", grp: "Reservas" }, { key: "act.book", grp: "Reservas" },
  { key: "reserveVia", grp: "Reservas" }, { key: "conciergeHint", grp: "Reservas" },
  { key: "footerTagline", grp: "Marca" }, { key: "footerRights", grp: "Marca" }, { key: "visitSite", grp: "Marca" },
];
