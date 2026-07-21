export type CmsFieldType =
  | "text"
  | "textarea"
  | "image"
  | "gallery"
  | "list"
  | "boolean"
  | "number"
  | "url"
  | "email"
  | "phone"
  | "coords"
  | "json";

export interface CmsFieldConfig {
  key: string;
  label: string;
  type: CmsFieldType;
  hint?: string;
  section?: string;
}

export interface CmsKindConfig {
  kind: string;
  label: string;
  description: string;
  fields: CmsFieldConfig[];
}

const commonFields: CmsFieldConfig[] = [
  { key: "name", label: "Nome", type: "text", section: "Principal" },
  { key: "slug", label: "Identificador", type: "text", section: "Sistema", hint: "Usado na URL. Evite alterar depois de publicado." },
  { key: "heroImage", label: "Foto de capa", type: "image", section: "Fotos", hint: "Imagem horizontal. Ideal: 1600 x 900 px ou maior." },
  { key: "gallery", label: "Galeria de fotos", type: "gallery", section: "Fotos" },
  { key: "description", label: "Descricao", type: "textarea", section: "Texto" },
  { key: "tagline", label: "Chamada", type: "text", section: "Principal", hint: "Frase curta que aparece em cards e capas." },
  { key: "category", label: "Categoria", type: "text", section: "Principal" },
  { key: "qimoSelect", label: "Selecao QIMO", type: "boolean", section: "Destaques", hint: "Mostra o selo de curadoria QIMO." },
  { key: "website", label: "Site", type: "url", section: "Links" },
  { key: "bookingUrl", label: "Link de reserva", type: "url", section: "Links" },
  { key: "bookingChannel", label: "Canal de reserva", type: "text", section: "Links" },
  { key: "instagram", label: "Instagram", type: "text", section: "Links" },
  { key: "phone", label: "Telefone", type: "phone", section: "Contato" },
  { key: "email", label: "E-mail", type: "email", section: "Contato" },
  { key: "address", label: "Endereco", type: "text", section: "Localizacao" },
  { key: "coords", label: "Coordenadas", type: "coords", section: "Localizacao", hint: "Latitude e longitude usadas no mapa." },
  { key: "visitedOnDays", label: "Visitada nos dias", type: "list", section: "Roteiro" },
  { key: "relatedDay", label: "Dia relacionado", type: "number", section: "Roteiro" },
  { key: "sectionOrder", label: "Ordem das secoes", type: "list", section: "Avancado" },
];

const registry: CmsKindConfig[] = [
  {
    kind: "city",
    label: "Cidades",
    description: "Cidades e portos visitados no roteiro.",
    fields: [
      ...commonFields,
      { key: "region", label: "Regiao", type: "text", section: "Principal" },
      { key: "history", label: "Historia", type: "textarea", section: "Texto" },
      { key: "curiosities", label: "Curiosidades", type: "list", section: "Listas" },
      { key: "toDo", label: "O que fazer", type: "list", section: "Listas" },
      { key: "photoSpots", label: "Pontos para foto", type: "list", section: "Listas" },
      { key: "bestTimes", label: "Melhores horarios", type: "textarea", section: "Dicas" },
      { key: "restaurants", label: "Restaurantes", type: "list", section: "Dicas" },
      { key: "cafes", label: "Cafes", type: "list", section: "Dicas" },
      { key: "shops", label: "Compras", type: "list", section: "Dicas" },
      { key: "localWines", label: "Vinhos locais", type: "list", section: "Dicas" },
    ],
  },
  {
    kind: "winery",
    label: "Vinicolas",
    description: "Vinicolas, maisons e experiencias de vinho do roteiro.",
    fields: [
      ...commonFields,
      { key: "appellation", label: "Denominacao", type: "text", section: "Principal" },
      { key: "classification", label: "Classificacao", type: "text", section: "Principal" },
      { key: "family", label: "Proprietarios", type: "text", section: "Principal" },
      { key: "history", label: "Historia", type: "textarea", section: "Texto" },
      { key: "terroir", label: "Terroir", type: "textarea", section: "Vinho" },
      { key: "grapes", label: "Castas", type: "list", section: "Vinho" },
      { key: "production", label: "Producao", type: "textarea", section: "Vinho" },
      { key: "icons", label: "Vinhos iconicos", type: "list", section: "Vinho" },
      { key: "historicVintages", label: "Safras historicas", type: "list", section: "Vinho" },
      { key: "scores", label: "Notas da critica", type: "json", section: "Avancado" },
      { key: "averagePrice", label: "Preco medio", type: "text", section: "Compra" },
      { key: "whatToBuy", label: "O que comprar", type: "list", section: "Compra" },
      { key: "whatToTaste", label: "O que provar", type: "list", section: "Vinho" },
      { key: "curiosities", label: "Curiosidades", type: "list", section: "Listas" },
      { key: "visitHours", label: "Horario de visita", type: "textarea", section: "Visita" },
      { key: "dressCode", label: "Traje", type: "text", section: "Visita" },
    ],
  },
  {
    kind: "restaurant",
    label: "Restaurantes",
    description: "Restaurantes, reservas e informacoes praticas.",
    fields: [
      ...commonFields,
      { key: "city", label: "Cidade", type: "text", section: "Localizacao" },
      { key: "neighborhood", label: "Bairro / regiao", type: "text", section: "Localizacao" },
      { key: "category", label: "Categoria", type: "text", section: "Principal", hint: "michelin, bistro, wine-bar ou contemporary." },
      { key: "chef", label: "Chef", type: "text", section: "Principal" },
      { key: "specialty", label: "Especialidade", type: "text", section: "Principal" },
      { key: "stars", label: "Estrelas / distincao", type: "text", section: "Principal" },
      { key: "michelin", label: "Michelin", type: "text", section: "Principal" },
      { key: "averageTicket", label: "Ticket medio", type: "text", section: "Reserva" },
      { key: "priceBand", label: "Faixa de preco", type: "text", section: "Reserva", hint: "Até €50, €50 a €100 ou Acima de €100." },
      { key: "bestFor", label: "Melhor ocasiao", type: "text", section: "Principal" },
      { key: "duration", label: "Tempo medio", type: "text", section: "Principal" },
      { key: "dressCode", label: "Traje", type: "text", section: "Reserva" },
      { key: "days", label: "Funcionamento", type: "textarea", section: "Reserva" },
      { key: "hours", label: "Horarios", type: "textarea", section: "Reserva" },
      { key: "reservationRequired", label: "Reserva recomendada", type: "boolean", section: "Reserva" },
      { key: "reservationAdvice", label: "Antecedencia recomendada", type: "text", section: "Reserva" },
      { key: "menuUrl", label: "Cardapio", type: "url", section: "Links" },
      { key: "mapsUrl", label: "Link do mapa", type: "url", section: "Links" },
      { key: "highlights", label: "Destaques", type: "list", section: "Destaques" },
      { key: "seals", label: "Selos editoriais", type: "list", section: "Destaques", hint: "Use no maximo tres no guia." },
      { key: "googleRating", label: "Nota Google", type: "number", section: "Destaques", hint: "Media publica do Google Maps, de 1 a 5." },
      { key: "googleReviewsCount", label: "Quantidade de avaliacoes Google", type: "number", section: "Destaques" },
      { key: "googleRatingDate", label: "Data da consulta Google", type: "text", section: "Destaques" },
      { key: "qimoScores", label: "Notas editoriais internas", type: "json", section: "Avancado" },
      { key: "qimoNote", label: "Recomendacao QIMO", type: "textarea", section: "Destaques" },
      { key: "sommelierTip", label: "Dica do Sommelier", type: "textarea", section: "Texto" },
      { key: "practical", label: "Informacoes praticas", type: "json", section: "Reserva" },
      { key: "sourcePrimary", label: "Fonte principal", type: "url", section: "Validade" },
      { key: "sourceSecondary", label: "Fontes secundarias", type: "list", section: "Validade" },
      { key: "lastVerified", label: "Ultima verificacao", type: "text", section: "Validade" },
      { key: "informationStatus", label: "Status da informacao", type: "text", section: "Validade" },
      { key: "adminStatus", label: "Status do restaurante", type: "text", section: "Validade", hint: "ativo, oculto, temporariamente-fechado ou encerrado." },
      { key: "featured", label: "Destaque", type: "boolean", section: "Destaques" },
      { key: "sortOrder", label: "Ordem", type: "number", section: "Avancado" },
    ],
  },
  {
    kind: "wine",
    label: "Vinhos",
    description: "Biblioteca de denominacoes e estilos de Bordeaux.",
    fields: [
      ...commonFields,
      { key: "bank", label: "Margem", type: "text", section: "Principal" },
      { key: "color", label: "Cor", type: "text", section: "Principal" },
      { key: "grapes", label: "Castas", type: "list", section: "Vinho" },
      { key: "profile", label: "Perfil sensorial", type: "textarea", section: "Vinho" },
      { key: "serveTemp", label: "Temperatura de servico", type: "text", section: "Servico" },
      { key: "pairings", label: "Harmonizacoes", type: "list", section: "Servico" },
      { key: "aging", label: "Potencial de guarda", type: "text", section: "Servico" },
      { key: "topProducers", label: "Principais produtores", type: "list", section: "Vinho" },
      { key: "qimoNote", label: "Nota QIMO", type: "textarea", section: "Destaques" },
    ],
  },
  {
    kind: "gastronomy",
    label: "Gastronomia",
    description: "Pratos, produtos e harmonizacoes regionais.",
    fields: [
      ...commonFields,
      { key: "whereToTry", label: "Onde provar", type: "list", section: "Dicas" },
      { key: "pairing", label: "Harmonizacao", type: "textarea", section: "Dicas" },
    ],
  },
  {
    kind: "experience",
    label: "Experiencias",
    description: "Experiencias selecionadas e passeios especiais.",
    fields: [
      ...commonFields,
      { key: "duration", label: "Duracao", type: "text", section: "Principal" },
      { key: "location", label: "Local", type: "text", section: "Localizacao" },
      { key: "venueUrl", label: "Site do local", type: "url", section: "Links" },
    ],
  },
  {
    kind: "shopping",
    label: "Compras",
    description: "Compras, lembrancas e orientacoes praticas.",
    fields: [
      ...commonFields,
      { key: "whereToBuy", label: "Onde comprar", type: "list", section: "Dicas" },
      { key: "priceRange", label: "Faixa de preco", type: "text", section: "Compra" },
      { key: "taxFree", label: "Tax Free", type: "boolean", section: "Compra" },
    ],
  },
  {
    kind: "chef",
    label: "Chef",
    description: "Experiencias gastronomicas extras.",
    fields: [
      ...commonFields,
      { key: "chef", label: "Chef", type: "text", section: "Principal" },
      { key: "duration", label: "Duracao", type: "text", section: "Principal" },
      { key: "price", label: "Preco", type: "text", section: "Reserva" },
    ],
  },
  {
    kind: "chef_profile",
    label: "Perfil do Chef",
    description: "Texto institucional e reconhecimentos do Thomas Troisgros na pagina Chef.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema", hint: "Registro unico do perfil. Evite alterar." },
      { key: "name", label: "Nome", type: "text", section: "Principal" },
      { key: "kicker", label: "Chamada pequena", type: "text", section: "Principal" },
      { key: "title", label: "Titulo principal", type: "text", section: "Principal" },
      { key: "lead", label: "Texto principal", type: "textarea", section: "Biografia" },
      { key: "body", label: "Trajetoria", type: "textarea", section: "Biografia" },
      { key: "closingQuote", label: "Frase de fechamento", type: "textarea", section: "Biografia" },
      { key: "michelinLabel", label: "Titulo reconhecimento Michelin", type: "text", section: "Reconhecimentos" },
      { key: "michelinText", label: "Texto reconhecimento Michelin", type: "textarea", section: "Reconhecimentos" },
      { key: "hotListLabel", label: "Titulo Hot List", type: "text", section: "Reconhecimentos" },
      { key: "hotListText", label: "Texto Hot List", type: "textarea", section: "Reconhecimentos" },
      { key: "bestChefLabel", label: "Titulo The Best Chef", type: "text", section: "Reconhecimentos" },
      { key: "bestChefText", label: "Texto The Best Chef", type: "textarea", section: "Reconhecimentos" },
      { key: "fiftyBestLabel", label: "Titulo 50 Best", type: "text", section: "Reconhecimentos" },
      { key: "fiftyBestText", label: "Texto 50 Best", type: "textarea", section: "Reconhecimentos" },
      { key: "lineageLabel", label: "Titulo linhagem Troisgros", type: "text", section: "Reconhecimentos" },
      { key: "lineageText", label: "Texto linhagem Troisgros", type: "textarea", section: "Reconhecimentos" },
    ],
  },
  {
    kind: "partner_offer",
    label: "Ofertas",
    description: "Anuncios e beneficios de parceiros QIMO exibidos no Concierge.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema", hint: "Chave interna. Evite alterar depois de publicado." },
      { key: "partner", label: "Parceiro", type: "text", section: "Principal" },
      { key: "title", label: "Titulo da oferta", type: "text", section: "Principal" },
      { key: "description", label: "Descricao comercial", type: "textarea", section: "Texto" },
      { key: "benefit", label: "Beneficio", type: "text", section: "Destaque", hint: "Ex.: 10% off, brinde, degustacao especial." },
      { key: "coupon", label: "Cupom / codigo", type: "text", section: "Destaque" },
      { key: "validUntil", label: "Validade", type: "text", section: "Destaque" },
      { key: "image", label: "Imagem", type: "image", section: "Fotos" },
      { key: "ctaLabel", label: "Texto do botao", type: "text", section: "Botao" },
      { key: "url", label: "Link do botao", type: "url", section: "Botao" },
      { key: "qimoSelect", label: "Selecao QIMO", type: "boolean", section: "Destaque" },
    ],
  },
  {
    kind: "ship",
    label: "Navio",
    description: "Pagina do SS Bon Voyage, fotos, numeros e informacoes a bordo.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema", hint: "Registro unico do navio. Evite alterar." },
      { key: "name", label: "Nome do navio", type: "text", section: "Principal" },
      { key: "tagline", label: "Chamada", type: "text", section: "Principal" },
      { key: "intro", label: "Introducao", type: "textarea", section: "Texto" },
      { key: "gallery", label: "Galeria de fotos", type: "gallery", section: "Fotos", hint: "Fotos adicionais exibidas na pagina do navio." },
      { key: "stats", label: "Numeros do navio", type: "json", section: "Dados" },
      { key: "facts", label: "Ficha rapida", type: "json", section: "Dados" },
      { key: "highlights", label: "Destaques", type: "json", section: "Vida a bordo" },
      { key: "dining", label: "Gastronomia", type: "json", section: "Vida a bordo" },
      { key: "suites", label: "Suites (texto)", type: "json", section: "Acomodacoes" },
      { key: "suitesList", label: "Lista de suites", type: "json", section: "Acomodacoes" },
      { key: "included", label: "Tudo incluido", type: "json", section: "No-Wallet Trip" },
      { key: "moreInfoTitle", label: "Titulo do bloco extra", type: "text", section: "Mais informacoes" },
      { key: "moreInfoText", label: "Texto do bloco extra", type: "textarea", section: "Mais informacoes" },
      { key: "moreInfoItems", label: "Lista de informacoes extras", type: "list", section: "Mais informacoes" },
      { key: "note", label: "Nota de rodape", type: "textarea", section: "Texto" },
    ],
  },
  {
    kind: "info_fact",
    label: "Info uteis",
    description: "Cards de informacoes praticas da pagina Informacoes uteis.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema" },
      { key: "icon", label: "Icone", type: "text", section: "Principal" },
      { key: "label", label: "Titulo", type: "text", section: "Principal" },
      { key: "value", label: "Texto", type: "textarea", section: "Texto" },
    ],
  },
  {
    kind: "etiquette_tip",
    label: "Etiqueta",
    description: "Dicas de etiqueta e cultura local da pagina Informacoes uteis.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema" },
      { key: "text", label: "Dica", type: "textarea", section: "Texto" },
    ],
  },
  {
    kind: "french_phrase",
    label: "Frases em frances",
    description: "Frases rapidas usadas na tela Concierge.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema" },
      { key: "pt", label: "Português", type: "text", section: "Texto" },
      { key: "fr", label: "Francês", type: "text", section: "Texto" },
      { key: "hint", label: "Pronúncia aproximada", type: "text", section: "Texto" },
    ],
  },
  {
    kind: "document_category",
    label: "Documentos",
    description: "Categorias da tela Documentos.",
    fields: [
      { key: "slug", label: "Identificador", type: "text", section: "Sistema", hint: "Usado como chave estavel. Evite alterar depois de publicado." },
      { key: "key", label: "Nome da categoria", type: "text", section: "Principal" },
      { key: "icon", label: "Icone", type: "text", section: "Principal", hint: "Nome de icone Lucide, como FileText, ShieldCheck, Ticket ou QrCode." },
      { key: "description", label: "Descricao", type: "textarea", section: "Texto" },
    ],
  },
];

const byKind = new Map(registry.map((kind) => [kind.kind, kind]));

function inferType(key: string, value: unknown): CmsFieldType {
  if (key === "coords") return "coords";
  if (key === "gallery") return "gallery";
  if (/image|hero|photo|foto/i.test(key)) return "image";
  if (/url|website|site|link/i.test(key)) return "url";
  if (/email/i.test(key)) return "email";
  if (/phone|telefone/i.test(key)) return "phone";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value) && value.every((item) => typeof item === "string" || typeof item === "number")) return "list";
  if (typeof value === "string" && value.length > 70) return "textarea";
  if (typeof value === "string") return "text";
  return "json";
}

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function getContentKindConfig(kind: string): CmsKindConfig | undefined {
  return byKind.get(kind);
}

export function getFieldConfig(kind: string, key: string, value: unknown): CmsFieldConfig {
  const known = byKind.get(kind)?.fields.find((field) => field.key === key);
  if (known) return known;
  return { key, label: humanize(key), type: inferType(key, value), section: "Avancado" };
}

export function sortContentFields(kind: string, data: Record<string, unknown>): Array<[string, unknown]> {
  const config = byKind.get(kind);
  const rank = new Map((config?.fields || []).map((field, index) => [field.key, index]));
  return Object.entries(data).sort(([a], [b]) => {
    const ar = rank.get(a) ?? 1000;
    const br = rank.get(b) ?? 1000;
    return ar - br || a.localeCompare(b);
  });
}
