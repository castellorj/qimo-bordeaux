# Integrações

Camada `src/integrations/`. Todo acesso ao mundo externo passa por um **adapter** com interface estável; o restante do sistema não conhece fornecedores.

> **Regra inegociável:** integração apenas por **API oficial, API de parceiro, integração autorizada por contrato, importação de arquivos fornecidos pelo parceiro, ou processo manual**. **Nada de scraping**, automação de navegador em portais de seguradoras, uso de credenciais de corretor por robôs, quebra de captcha ou qualquer mecanismo que viole termos de uso ou contorne controles de segurança. Quando não existe via legítima, o sistema gera uma **tarefa manual** — e mede quanto tempo ela custa, para orientar a próxima parceria.

Pesquisa feita em out/2026. Itens marcados **(a confirmar)** precisam de validação direta com o fornecedor/regulador antes de contratar ou construir.

---

## 1. Estrutura

```
src/integrations/
  insurers/          InsurerAdapter: um adapter próprio por seguradora (API liberada, arquivo, manual), demo
  health-networks/   NetworkSourceAdapter: tabelas de operadoras, dados abertos ANS
  maps/              MapsAdapter: geocode, reverseGeocode, tiles (osm | google | mapbox)
  whatsapp/          MessagingAdapter: Cloud API direto ou BSP; demo = wa.me
  email/             MailboxAdapter: Gmail API, Microsoft Graph
  ai/                LLMProvider: anthropic (padrão), outros
  storage/           StorageAdapter: s3 | r2 | minio
  document-parsing/  DocumentParser: texto, OCR, extração estruturada
  reference/         CEP (ViaCEP), FIPE (provedor terceiro), CNPJ (a definir)
```

Cada chamada externa registra `IntegrationRun` (operação, duração, ok/erro, payload redigido no storage). Credenciais ficam no secrets manager (`IntegrationCredential.secretRef`).

## 2. Interfaces (TypeScript)

> **Estado atual da DEMO:** `src/integrations/insurers/types.ts` define um `InsurerAdapter` mínimo — `{ insurerId, adapterName, method: IntegrationMethod | 'demo', lines, automatic, quoteAuto?(), quoteGeneric?() }` — implementado por `adapters/demo-calculator.ts` (simulador determinístico). `src/integrations/ai/index.ts` define um `LLMProvider` com `complete({ system, messages, tools })`. As interfaces abaixo são a **evolução proposta** para a Fase 1-real (capabilities explícitas, `issue`/`getPolicy`/`importFile`, saúde no mesmo contrato).

```ts
// insurers/types.ts
export interface InsurerAdapter {
  id: string;                                   // "agregador-x", "seguradora-y-parceiro", "demo-auto"
  insurerIds: ID[];                             // seguradoras que este adapter cobre
  capabilities: {
    lines: ProductLine[];
    method: IntegrationMethod;                  // 'api_oficial'|'api_parceiro'|'integracao_autorizada'|'importacao'|'manual'
    quote: boolean; issue: boolean; getPolicy: boolean; importFile: boolean;
  };
  quote(request: QuoteRequest, ctx: AdapterContext): Promise<QuoteResult[]>;  // sempre preenche result.source
  issue?(proposal: Proposal, accepted: QuoteResult, ctx: AdapterContext): Promise<{ status: 'enviada'|'emitida'|'pendente'; reference: string }>;
  getPolicy?(ref: { number: string; insurerId: ID }, ctx: AdapterContext): Promise<Partial<Policy>>;
  importFile?(file: StoredFile, kind: 'apolices'|'comissoes'|'tabela_preco', ctx: AdapterContext): Promise<ImportPreview>;
  healthCheck?(): Promise<{ ok: boolean; message?: string }>;
}

// health-networks/types.ts
export interface NetworkSourceAdapter {
  id: string;
  kind: 'xlsx'|'csv'|'pdf'|'api'|'manual';
  parse(file: StoredFile, mapping: ColumnMap): AsyncIterable<RawProviderRow>;   // depois: dedupe no domínio
}

// maps/types.ts
export interface MapsAdapter {
  id: 'osm'|'google'|'mapbox';
  geocode(address: string): Promise<{ lat: number; lng: number; confidence: number; cacheUntil?: ISODate } | null>;
  reverseGeocode?(lat: number, lng: number): Promise<Partial<Address> | null>;
  tileLayer(): { url: string; attribution: string };
}

// whatsapp/types.ts
export interface MessagingAdapter {
  id: 'demo-wame'|'meta-cloud'|`bsp-${string}`;
  sendTemplate(to: E164, template: { name: string; lang: 'pt_BR'; params: string[] }, ctx: { partyId: ID; consentRequired: boolean }): Promise<{ externalId: string }>;
  sendText?(to: E164, text: string): Promise<{ externalId: string }>;          // só dentro da janela de atendimento
  onInbound(handler: (msg: InboundMessage) => Promise<void>): void;           // webhook → Interaction / Document
  deepLink(to: E164, text: string): string;                                   // fallback wa.me
}

// email/types.ts
export interface MailboxAdapter { id: 'gmail'|'msgraph'; listNewAttachments(since: Date): AsyncIterable<MailAttachment> }

// ai/types.ts — ver AI_ARCHITECTURE.md
export interface LLMProvider { id: string; complete(...): Promise<...>; toolCall(...): Promise<...>; extractStructured<T>(...): Promise<T> }

// storage/types.ts
export interface StorageAdapter { put(key: string, body: Buffer, meta): Promise<void>; signedUrl(key: string, ttlSec: number): Promise<string>; delete(key: string): Promise<void> }

// document-parsing/types.ts
export interface DocumentParser { id: string; extractText(file: StoredFile): Promise<{ text: string; pages: number; ocr: boolean }> }
```

## 3. Mapa de integrações

Legenda de dependência: **D** = dados, **A** = API, **C** = contrato/parceria.

| Integração | Método | Dependência | Fase | Status na DEMO |
|---|---|---|---|---|
| Multicálculo auto/residencial/vida | Integração própria por seguradora (API liberada/arquivo/manual) | C + A | 3 | Simulador determinístico (valores fictícios) para 6 seguradoras; demais como cotação manual |
| APIs diretas de seguradoras | api_parceiro / integracao_autorizada | C + A | 4+ | — |
| Saúde: preços e rede | importacao (tabelas das operadoras) | D + C | 2 | Planos/rede fictícios |
| ANS dados abertos | importacao (dados públicos) | D | 2 | — |
| Open Insurance | api_oficial (regulado) | C + regulatório | Futuro (a avaliar) | — |
| FIPE | Provedor terceiro (API) | A + C | 2 | Valores fictícios no seed |
| CEP | ViaCEP (API pública) | A | 1 | Base local do seed |
| Geocodificação | Google / Mapbox | A + C | 2 | Coordenadas pré-calculadas |
| Mapas (tiles) | OSM (DEMO) / Google / Mapbox | A | 0/2 | Leaflet + OSM |
| WhatsApp | Meta Cloud API (direto ou BSP) | A + C | 3 | Link `wa.me` |
| E-mail (captura de docs) | Gmail API / Microsoft Graph | A | 3 | — |
| LLM | Anthropic Claude API | A + C (DPA) | 2 | Motor determinístico, sem LLM |
| OCR | Textract / Google Document AI / Azure (a escolher) | A + C | 2 | Regex sobre texto |
| Storage | S3 / R2 / MinIO | A | 1 | Conteúdo em `textContent` (texto) |

---

## 4. Pesquisa por integração

### 4.1 WhatsApp — Meta WhatsApp Business Platform (Cloud API)

- **O que existe:** API oficial da Meta, hospedada pela Meta (Cloud API). Acesso direto via Meta Business ou via **BSP** (Business Solution Provider: ex.: 360dialog, Twilio, Infobip, Gupshup, Zenvia, Take Blip — lista não exaustiva; escolher por preço, suporte em PT-BR e SLA).
- **Templates:** mensagens iniciadas pela empresa fora da janela de atendimento exigem **template pré-aprovado**, categorizado em **marketing**, **utility** ou **authentication**.
- **Modelo de preço:** desde **1º/jul/2025** a cobrança passou a ser **por mensagem (template) entregue**, variando por categoria e país do destinatário (antes era por conversa de 24 h). Mensagens de serviço (não-template, respostas dentro da janela de atendimento de 24 h) são gratuitas; templates *utility* enviados dentro de uma janela de atendimento aberta são gratuitos; há janela gratuita de 72 h para conversas iniciadas por anúncios click-to-WhatsApp / página do Facebook (free entry point). Tabelas por país no site da Meta — **valores para o Brasil a confirmar** na data da contratação.
  Fontes: [Pricing on the WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/pricing), [documentação atual de pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing).
- **Opt-in:** a política de mensagens exige **opt-in** antes de contatar a pessoa: deixar claro que ela aceita receber mensagens e **de qual empresa**, e cumprir a lei local (LGPD). O opt-in pode ser coletado por site, SMS, telefone/IVR, papel. Fonte: [Get opt-in for WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in).
- **No sistema:** `ConsentRecord(purpose='marketing_whatsapp')` obrigatório para templates de marketing; comunicação operacional (proposta solicitada, renovação de apólice existente) usa categoria utility com base legal de execução de contrato — **classificação de cada template a validar com a Meta e o jurídico**. Webhook de entrada cria `Interaction` e, se houver anexo, `Document` (→ Document AI).
- **Dependência:** A + C (conta Meta Business verificada, número dedicado, BSP opcional). **Fase 3.** DEMO: `wa.me/<numero>?text=` (abre o WhatsApp do usuário; nada é enviado pelo sistema).
- **Recomendação (pedida pelo cliente):** **Cloud API da Meta conectada diretamente pelo sistema** (integração própria), número exclusivo da corretora. Motivos: oficial (sem risco de bloqueio), sem mensalidade de intermediário (paga-se à Meta por mensagem de template; respostas na janela de 24h aberta pelo cliente não são cobradas), coerente com a decisão de integração própria e um operador de dados a menos (LGPD). **Alternativa:** BSP oficial (360dialog, Twilio, Gupshup; Blip ou Zenvia com suporte em português) se a equipe quiser painel de atendimento pronto. **Evitar:** APIs não oficiais (automação do WhatsApp Web) — violam os termos e arriscam o número. Conferir a tabela vigente de preços da Meta para o Brasil antes de contratar.

### 4.2 Open Insurance Brasil (SUSEP)

- **O que é:** sistema de seguros aberto regulado pela SUSEP/CNSP (Res. CNSP 415/2021, Circular SUSEP 635/2021 e alterações). Estruturado em fases: **Fase 1** — dados públicos de produtos e canais de atendimento; **Fase 2** — dados cadastrais e de apólices dos clientes (com consentimento); **Fase 3** — movimentação/iniciação de serviços.
  Fontes: [Demarest — Res. CNSP 415/2021 e Circular 635/2021](https://www.demarest.com.br/resolucao-cnsp-no-415-2021-e-circular-susep-no-635-2021-implementacao-e-regulamentacao-do-sistema-de-seguros-aberto-open-insurance/), [PwC/Strategy& — Panorama Open Insurance 2024](https://www.strategyand.pwc.com/br/pt/relatorios/tl-panorama-open-insurance_pub-strategy_2024.pdf).
- **Participantes:** seguradoras, EAPCs e sociedades de capitalização — obrigatório para S1/S2, voluntário para as demais. A Res. CNSP 450/2022 extinguiu a figura da SISS e criou a **SPOC** (Sociedade Processadora de Ordem do Cliente), incluindo **corretores** no ecossistema (podem atuar na plataforma SPOC e na governança). Fontes: [IstoÉ Dinheiro — CNSP altera regras e inclui corretores](https://istoedinheiro.com.br/cnsp-altera-regras-do-open-insurance-inclui-corretores-e-estende-prazos), [CQCS](https://cqcs.com.br/noticia/alexandre-camillo-acaba-com-a-siss-e-muda-o-open-insurance-que-e-aberto-aos-corretores-de-seguros/).
- **Estado recente:** em out/2025 a SUSEP publicou a Resolução SUSEP 61/2025 (alterações na Circular 635, ex.: saída de participantes voluntários) e criou grupo de trabalho para revisar a regulação. Fonte: [Legismap — Resolução SUSEP 61/2025](https://legismap.com.br/conteudos/artigos-e-noticias/susep-publica-alteracoes-na-norma-do-open-insurance), [Legismap — retrospectiva 2025](https://legismap.com.br/conteudos/artigos-e-noticias/retrospectiva-do-open-insurance-em-2025-o-ano-em-que-a-susep-consolidou-o-aprimoramento-continuo-do-ecossistema-de-dados-abertos).
- **Avaliação:** a Fase 1 (dados públicos de produtos) pode, em tese, alimentar o catálogo de produtos. Uma corretora **receber dados de apólices de clientes** via Open Insurance exige ser participante/estar conectada a uma SPOC e o consentimento do cliente — **viabilidade, custos e cronograma a confirmar com a SUSEP/jurídico**. Não é dependência do roadmap; é oportunidade futura. **Status DEMO:** não usado.

### 4.3 ANS — dados abertos

- **O que existe:** a ANS publica dados abertos no Portal Brasileiro de Dados Abertos (dados.gov.br) e na sua página de dados abertos, incluindo (entre outros) **"Operadoras de planos de saúde ativas"** (cadastro de operadoras com registro ANS), **"Produtos e prestadores hospitalares"** (vínculo entre produtos registrados e prestadores **hospitalares**), **"Valor comercial da mensalidade por faixa etária"** e **solicitações de alteração de rede hospitalar** (substituição/redimensionamento, por operadora e plano). Fontes: [PDA ANS — conjuntos de dados (1ª fase)](https://www.gov.br/ans/pt-br/arquivos/acesso-a-informacao/perfil-do-setor/dados-abertos/pda-edicao-2017-2019/pda_ans_conjunto_dados_1fase.pdf), [PDA ANS 2017–2019 — fases](https://www.gov.br/ans/pt-br/arquivos/acesso-a-informacao/perfil-do-setor/dados-abertos/pda-edicao-2017-2019/pda_ans_conjunto_dados_2017_2019_fases.pdf), [Legismap — dados de alteração de rede](https://legismap.com.br/conteudos/artigos-e-noticias/noticias-ans-em-26-04-2021).
- **Cuidados (importante):**
  - A rede nos dados abertos é **hospitalar** — não cobre clínicas, laboratórios e consultórios. **(a confirmar** cobertura atual de cada conjunto.)
  - O vínculo é por **produto registrado na ANS** (nº de registro), que nem sempre corresponde 1:1 ao nome comercial vendido pela corretora; exige mapeamento `HealthPlan.ansProductCode`.
  - Atualização e defasagem variam por conjunto; **não substitui a tabela de rede vigente da operadora** para fins de venda.
  - As operadoras são obrigadas a divulgar a rede em seus portais (RN ANS 285/2011), mas consulta automatizada desses portais seria scraping — **não usar**; pedir arquivos/API à operadora.
- **Uso proposto:** cadastro de operadoras (código ANS), complemento/validação da rede hospitalar importada e alertas de alteração de rede. Fonte primária de venda = tabela da operadora (importação com validade). **Dependência:** D. **Fase 2.** DEMO: não usado (dados fictícios).

### 4.4 Tabela FIPE

- A FIPE publica a tabela no seu site, mas **não oferece API pública oficial documentada**; endpoints usados por bibliotecas são internos ao site, sem garantia de estabilidade ou termos de uso formais, e há bloqueio por volume. Fonte: [TabNews — guia da API FIPE](https://www.tabnews.com.br/dedx/guia-completo-da-api-fipe-como-consultar-precos-de-veiculos-no-brasil).
- **Opções:** APIs de terceiros (ex.: BrasilAPI, Parallelum/"FIPE API" e provedores comerciais de dados veiculares). **Ressalvas:** verificar a origem dos dados e a licença de cada provedor; preferir provedor com contrato/SLA; armazenar `fipeRefMonth` e a fonte; em produção, o **valor FIPE oficial da cotação é o retornado pelo agregador/seguradora**, não o da nossa consulta. **Status DEMO:** valores fictícios. **Fase 2.**

### 4.5 Agregadores de multicálculo — avaliados e **não adotados** (decisão: integração própria)

| Fornecedor | O que oferece (fontes públicas) | Observações |
|---|---|---|
| **Agger** | Multicálculo e gestão para corretoras; divulga conexão com 40+ seguradoras e 15 ramos | Adquirida pela **Dimensa** em 2025 ([Revista Apólice](https://revistaapolice.com.br/?p=142461), [site Agger](https://www.agger.com.br/?p=859)) |
| **Quiver** | Gestão de corretoras e multicálculo | Adquirida pela Dimensa em 2024; Dimensa lançou plataforma "ONE" combinando Quiver + Agger ([Revista Apólice](https://revistaapolice.com.br/?p=122280)). A **Evertec** anunciou a compra da Dimensa em 2026 ([Business Wire](https://www.businesswire.com/news/home/20260202212543/en/EVERTEC-to-Acquire-Dimensa-for-R950-Million)) — acompanhar impacto em roadmap/contratos |
| **Segfy** | Plataforma de gestão + multicálculo, CRM para corretores | Controle majoritário da Porto (Porto Ventures) desde 2021 ([Revista Apólice](https://revistaapolice.com.br/2021/02/porto-seguro-adquire-plataforma-de-tecnologia-segfy/)) — avaliar neutralidade comercial |
| **Infocap** | Multicálculo e gestão (MultiGestor) para auto, vida, residencial | Sediada em Novo Hamburgo/RS, parceira do Sincor-RS ([Revista Apólice](https://revistaapolice.com.br/?p=87474)) |

- **A confirmar com cada fornecedor:** existência de **API para integração** (não apenas uso pela interface deles), ramos e seguradoras cobertos, se a cotação retorna coberturas estruturadas, termos de uso de dados, preço (por usuário/por cálculo), SLA, e se permitem armazenar o resultado.
- **Decisão do cliente (07/10/2026): integração própria.** Um `InsurerAdapter` por seguradora, desenvolvido pela corretora sobre a via que cada seguradora liberar (API para corretores credenciados, layout de arquivo ou integração autorizada). Sem agregador. A tabela acima fica como referência caso a decisão seja revista.
- **Implicações:** (1) o esforço cresce por seguradora — priorizar pelas de maior volume da carteira; (2) cada seguradora precisa **liberar acesso** (convênio/credenciamento) — sem isso ela entra como **cotação manual** no mesmo comparativo, com origem e responsável registrados; (3) nada de scraping/RPA em portais.
- **Onboarding por seguradora** (checklist em /seguradoras): código de corretor/convênio ativo → acesso técnico solicitado → contrato/termos de dados (LGPD) → credenciais de homologação no cofre → adapter desenvolvido e testado → produção com monitoramento e fallback para manual.
- **Catálogo inicial:** ~30 seguradoras e operadoras principais (Porto, Tokio Marine, Allianz, HDI, Bradesco, Zurich, Mapfre, Azul, Yelum, Suhai, Sompo, Chubb, AXA, SulAmérica, Icatu, MAG, Prudential, MetLife, Junto, Pottencial; saúde: Bradesco Saúde, SulAmérica Saúde, Amil, Assim, Porto Saúde, Unimed, Hapvida NotreDame Intermédica, Omint, Care Plus; odonto: OdontoPrev). Ramos de cada uma **a confirmar** pela corretora. **Fase 3.**

### 4.6 Portais de seguradoras

> Plano detalhado por seguradora, kit e modelo de pedido: **[INSURER_INTEGRATION_GUIDE.md](INSURER_INTEGRATION_GUIDE.md)**.


- Em geral, **não há API pública**: o corretor acessa portais autenticados. Algumas seguradoras oferecem **APIs de parceiro** (cotação, emissão, segunda via, extrato de comissões) mediante contrato/credenciamento — **disponibilidade varia por seguradora (a confirmar uma a uma)**.
- **Caminho:** parceria/credenciamento formal; enquanto isso, **importação** de arquivos que a seguradora disponibiliza (extratos de comissão, relatórios de apólices) e **manual** com tarefa. Automação de portal (RPA com login do corretor) **não será feita**.

### 4.7 CEP

- **ViaCEP** (`https://viacep.com.br/ws/{cep}/json/`): gratuito, sem chave, amplamente usado; sem SLA — usar cache e fallback.
- **Correios**: oferecem APIs a clientes com contrato (**a confirmar** produto e condições).
- **BrasilAPI** (agrega fontes) como fallback.
- **Dependência:** A. **Fase 1.** DEMO: base local.

### 4.8 Geocodificação e mapas

- **Google Maps Platform (Geocoding):** termos permitem **cache temporário de lat/lng por até 30 dias consecutivos**; `place_id` pode ser armazenado. Implicação: re-geocodificar ou armazenar `place_id`. Fonte: [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms).
- **Mapbox:** oferece geocodificação "permanente" (armazenamento permitido) em modalidade específica e paga — **a confirmar condições atuais**. Boa opção para armazenar coordenadas de prestadores.
- **Nominatim (OSM público):** **máx. 1 requisição/s**, **proíbe geocodificação em massa** na instância pública, exige User-Agent identificável e cache. Para volume: instância própria ou provedor comercial. Fonte: [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/).
- **Tiles OSM** (DEMO): uso leve com atribuição; produção com volume deve usar provedor de tiles (ver [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)).
- **Recomendação:** geocodificar endereços de prestadores na importação (lote, provedor com direito de armazenamento) e endereços de clientes sob demanda. **Fase 2.**

### 4.9 E-mail (captura de documentos)

- **Gmail API** (Google Workspace): ler anexos de uma caixa dedicada (ex.: `documentos@`). Escopos de leitura de e-mail são **restritos** — para uso interno num Workspace próprio, a configuração como app interno evita a verificação pública; app público exige verificação/avaliação de segurança (**a confirmar** no caso concreto).
- **Microsoft Graph** (Microsoft 365): `Mail.Read` com consentimento do admin do tenant.
- **Recomendação:** caixa dedicada + regra de encaminhamento; nunca ler caixas pessoais. **Fase 3.**

### 4.10 LLM — Anthropic Claude API

- API comercial com tool use e entrada de PDFs/imagens (útil para Document AI). Pelos termos comerciais, dados enviados via API não são usados para treinar modelos por padrão; DPA disponível; retenção e opções de *zero data retention* **a confirmar nos termos vigentes na contratação**.
- Atrás de `LLMProvider` (trocável). Minimização de PII antes do envio (ver AI_ARCHITECTURE e SECURITY_LGPD). **Fase 2.** DEMO: nenhuma chamada a LLM.

### 4.11 OCR / document parsing

- Opções: AWS Textract, Google Document AI, Azure AI Document Intelligence, Tesseract (self-hosted), ou o próprio LLM multimodal para PDFs. Escolha por qualidade em PDFs de apólices brasileiras, custo por página e região de processamento (**preferir processamento no Brasil ou com cláusulas LGPD de transferência internacional**). **Fase 2.**

### 4.12 Storage

- S3 (região sa-east-1), Cloudflare R2 ou MinIO. Bucket privado, URLs assinadas, cifragem, versionamento, lifecycle por retenção. **Fase 1.**

---

## 5. Resumo — o que existe oficialmente

| Tema | API oficial pública? |
|---|---|
| WhatsApp | **Sim** — Meta Cloud API (templates, opt-in, cobrança por mensagem) |
| Open Insurance | **Sim, regulada** — mas acesso a dados de clientes exige participação/consentimento; não é "API aberta" para qualquer corretora (a confirmar viabilidade) |
| ANS | **Dados abertos** (arquivos), não API transacional; rede apenas hospitalar, por produto registrado |
| FIPE | **Não** há API pública oficial; apenas terceiros |
| Seguradoras | **Não**, em geral; APIs de parceiro mediante contrato |
| Multicálculo | **Integração própria** por seguradora (decisão do cliente); agregadores existem mas não serão usados |
| CEP | ViaCEP (pública, não oficial dos Correios); Correios com contrato |
| Geocoding | Google/Mapbox (pagos, com termos de cache); Nominatim com limites rígidos |
| E-mail | Gmail API / Microsoft Graph (oficiais) |
| LLM | Anthropic Claude API (oficial, comercial) |
