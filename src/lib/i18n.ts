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
  "nav.vinhos": { pt: "Vinhos", en: "Wines", es: "Vinos" },
  "nav.gastronomia": { pt: "Gastronomia", en: "Cuisine", es: "Gastronomía" },
  "nav.compras": { pt: "Compras", en: "Shopping", es: "Compras" },
  "nav.concierge": { pt: "Concierge", en: "Concierge", es: "Concierge" },
  "nav.informacoes": { pt: "Informações úteis", en: "Useful info", es: "Información útil" },
  "nav.documentos": { pt: "Documentos", en: "Documents", es: "Documentos" },
  "nav.favoritos": { pt: "Favoritos", en: "Favorites", es: "Favoritos" },
  "nav.roteiro": { pt: "Roteiro", en: "Route", es: "Ruta" },
  "nav.restaurantes": { pt: "Restaurantes", en: "Restaurants", es: "Restaurantes" },
  "navd.restaurantes": { pt: "Mesas para reservar", en: "Tables to book", es: "Mesas para reservar" },
  "hero.restaurantes.k": { pt: "À mesa", en: "At the table", es: "En la mesa" },
  "hero.restaurantes.i": {
    pt: "As melhores mesas de Bordeaux e Saint-Émilion — reserve pelo canal oficial em um toque.",
    en: "The finest tables of Bordeaux and Saint-Émilion — book through the official channel in one tap.",
    es: "Las mejores mesas de Bordeaux y Saint-Émilion — reserva por el canal oficial en un toque.",
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
  "navd.favoritos": { pt: "Seu roteiro pessoal", en: "Your personal list", es: "Tu lista personal" },
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
    pt: "SS Bon Voyage · 25 de outubro a 1º de novembro de 2026. Todos os horários estão sujeitos a alterações e serão confirmados a bordo.",
    en: "SS Bon Voyage · 25 October to 1 November 2026. All times are subject to change and will be confirmed on board.",
    es: "SS Bon Voyage · 25 de octubre al 1 de noviembre de 2026. Todos los horarios están sujetos a cambios y se confirman a bordo.",
  },
  "hero.cidades.k": { pt: "Os destinos", en: "The destinations", es: "Los destinos" },
  "hero.cidades.i": {
    pt: "Cada escala do roteiro em profundidade: história, curiosidades, o que fazer, onde fotografar e as melhores mesas.",
    en: "Every stop in depth: history, curiosities, what to do, where to photograph and the best tables.",
    es: "Cada escala en profundidad: historia, curiosidades, qué hacer, dónde fotografiar y las mejores mesas.",
  },
  "hero.vinicolas.k": { pt: "Châteaux & casas", en: "Châteaux & houses", es: "Châteaux y casas" },
  "hero.vinicolas.i": {
    pt: "Os Grands Crus, châteaux e maisons visitados na viagem — história, terroir, vinhos icônicos e o que provar.",
    en: "The Grands Crus, châteaux and maisons visited — history, terroir, iconic wines and what to taste.",
    es: "Los Grands Crus, châteaux y maisons visitados — historia, terroir, vinos icónicos y qué probar.",
  },
  "hero.vinhos.k": { pt: "Biblioteca de apelações", en: "Appellation library", es: "Biblioteca de denominaciones" },
  "hero.vinhos.i": {
    pt: "Um mapa sensorial das grandes denominações: castas, perfil, temperatura, harmonizações, guarda e produtores.",
    en: "A sensory map of the great appellations: grapes, profile, temperature, pairings, ageing and producers.",
    es: "Un mapa sensorial de las grandes denominaciones: uvas, perfil, temperatura, maridajes, guarda y productores.",
  },
  "hero.experiencias.k": { pt: "Momentos exclusivos", en: "Exclusive moments", es: "Momentos exclusivos" },
  "hero.experiencias.i": {
    pt: "Degustações privadas, jantares harmonizados, piqueniques entre vinhedos e passeios inesquecíveis.",
    en: "Private tastings, paired dinners, vineyard picnics and unforgettable outings.",
    es: "Degustaciones privadas, cenas maridadas, picnics entre viñedos y paseos inolvidables.",
  },
  "hero.gastronomia.k": { pt: "À mesa em Bordeaux", en: "At the table in Bordeaux", es: "En la mesa de Bordeaux" },
  "hero.gastronomia.i": {
    pt: "O que provar e onde encontrar cada especialidade — do foie gras ao canelé, das ostras aos macarons.",
    en: "What to taste and where to find each specialty — from foie gras to canelé, oysters to macarons.",
    es: "Qué probar y dónde encontrar cada especialidad — del foie gras al canelé, de las ostras a los macarons.",
  },
  "hero.compras.k": { pt: "O que levar de Bordeaux", en: "What to bring from Bordeaux", es: "Qué llevar de Bordeaux" },
  "hero.compras.i": {
    pt: "Do vinho às facas Laguiole, dos queijos às trufas — o que vale a pena, e como funciona o Tax Free.",
    en: "From wine to Laguiole knives, cheeses to truffles — what's worth it, and how Tax Free works.",
    es: "Del vino a los cuchillos Laguiole, de los quesos a las trufas — qué vale la pena, y cómo funciona el Tax Free.",
  },
  "hero.concierge.k": { pt: "Sempre ao seu lado", en: "Always by your side", es: "Siempre a tu lado" },
  "hero.concierge.i": {
    pt: "A equipe QIMO, emergências, transporte e ferramentas úteis — a um toque, inclusive offline.",
    en: "The QIMO team, emergencies, transport and useful tools — one tap away, even offline.",
    es: "El equipo QIMO, emergencias, transporte y herramientas útiles — a un toque, incluso sin conexión.",
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
  "hero.favoritos.k": { pt: "Seu roteiro pessoal", en: "Your personal list", es: "Tu lista personal" },
  "hero.favoritos.i": {
    pt: "Tudo que você salvou, reunido em um só lugar — e disponível offline no seu dispositivo.",
    en: "Everything you saved, gathered in one place — and available offline on your device.",
    es: "Todo lo que guardaste, reunido en un solo lugar — y disponible sin conexión en tu dispositivo.",
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
  { key: "nav.favoritos", grp: "Menu" }, { key: "nav.mais", grp: "Menu" },
  { key: "nav.programacao", grp: "Menu" }, { key: "nav.barco", grp: "Menu" }, { key: "nav.mapa", grp: "Menu" },
  { key: "nav.cidades", grp: "Menu" }, { key: "nav.vinicolas", grp: "Menu" }, { key: "nav.restaurantes", grp: "Menu" },
  { key: "nav.vinhos", grp: "Menu" }, { key: "nav.gastronomia", grp: "Menu" }, { key: "nav.experiencias", grp: "Menu" },
  { key: "nav.compras", grp: "Menu" }, { key: "nav.concierge", grp: "Menu" }, { key: "nav.informacoes", grp: "Menu" },
  { key: "whatNow", grp: "Botões" }, { key: "howToGet", grp: "Botões" }, { key: "startNav", grp: "Botões" },
  { key: "seeDetails", grp: "Botões" }, { key: "startExperience", grp: "Botões" }, { key: "openConcierge", grp: "Botões" },
  { key: "knowShip", grp: "Botões" }, { key: "exploreBordeaux", grp: "Botões" }, { key: "fullItinerary", grp: "Botões" },
  { key: "act.reserveTable", grp: "Reservas" }, { key: "act.reserveVisit", grp: "Reservas" },
  { key: "act.reserveQimo", grp: "Reservas" }, { key: "act.site", grp: "Reservas" }, { key: "act.maps", grp: "Reservas" },
  { key: "act.call", grp: "Reservas" }, { key: "act.menu", grp: "Reservas" },
  { key: "seloQimo", grp: "Marca" }, { key: "brandSub", grp: "Marca" },
];
