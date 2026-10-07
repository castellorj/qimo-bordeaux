# Especializada Seguros OS — Especificação de Produto

> Insurance Operating System da corretora Especializada Seguros.
> Documentos relacionados: [USER_FLOWS](USER_FLOWS.md) · [ARCHITECTURE](ARCHITECTURE.md) · [DATABASE_SCHEMA](DATABASE_SCHEMA.md) · [INTEGRATIONS](INTEGRATIONS.md) · [AUTOMATIONS](AUTOMATIONS.md) · [AI_ARCHITECTURE](AI_ARCHITECTURE.md) · [SECURITY_LGPD](SECURITY_LGPD.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [ROADMAP](ROADMAP.md)

## 1. Visão

**"Eliminar trabalho operacional, e não apenas digitalizá-lo."**

Um CRM tradicional transforma papel em formulário — o corretor continua digitando, conferindo e lembrando. O Especializada Seguros OS parte da pergunta oposta: *por que alguém precisaria fazer isso à mão?* Cada funcionalidade só existe se remover um passo manual, e não apenas se mover esse passo para a tela.

### Princípios

| Princípio | O que significa na prática |
|---|---|
| **Digitar uma vez** | Um dado entra uma única vez (cadastro, documento, importação) e é reaproveitado em cotação, proposta, apólice, renovação e comissão. Formulários pré-preenchem tudo que o sistema já sabe. |
| **O sistema lembra, não a pessoa** | Vencimentos, follow-ups, pendências e documentos faltantes viram tarefas automáticas com prazo e responsável. |
| **Humano decide, máquina prepara** | Automação e IA preparam o trabalho (rascunho, sugestão, comparação); dados críticos e envios ao cliente passam por confirmação humana. |
| **Todo dado tem origem** | Campos críticos mostram "Fonte: … · atualizado em …" e grau de confiança. Nada é inventado. |
| **Core + módulos** | O núcleo (clientes, CRM, apólices, documentos, tarefas) é comum; cada ramo (saúde, auto…) é um módulo plugável. Adicionar um ramo não exige reconstruir o sistema. |
| **Integração só por via legítima** | API oficial, API de parceiro, integração autorizada, importação de arquivo ou manual. Nunca scraping nem burla de termos/segurança. |

## 2. Métrica principal: Horas de trabalho operacional economizadas

Exibida no Dashboard (`/`) e em `/relatorios`.

**Como é medida**

1. **Baseline por tarefa** (`OrgSettings.timeBaselines`): minutos que a equipe gasta hoje fazendo a tarefa manualmente (ex.: criar tarefa de renovação = 5 min; transcrever apólice PDF = 12 min; montar comparativo de 5 seguradoras = 40 min). Valores iniciais propostos; **calibrar com cronometragem real** de 1–2 semanas antes do go-live.
2. **Cada execução automática** registra `minutesSaved` (em `AutomationExecution`, `DocumentExtraction` aceita, `ImportJob` concluído, comparativo gerado, proposta montada).
3. **Fatores de ajuste**: extração de documento aceita com correções conta proporcionalmente aos campos não corrigidos; execução "ignorada" (idempotência) conta zero.
4. **Agregação**: soma por período, por usuário, por automação e por tipo — "Este mês: 41 h economizadas (≈ 5 dias úteis)".
5. **Métricas de apoio**: taxa de renovação, tempo médio lead→proposta, propostas sem follow-up, documentos aguardando revisão, % de campos extraídos aceitos sem correção.

> Honestidade: é uma métrica *estimada* a partir de baselines. A tela mostra a fórmula e o baseline usado (fonte), nunca um número sem explicação.

## 3. Personas

| Persona | Objetivo | Dor principal hoje | O que o sistema entrega |
|---|---|---|---|
| **Administrador** | Configurar e proteger o sistema | Acessos espalhados, nenhuma trilha de auditoria | Perfis/RBAC, auditoria, integrações, LGPD (`/configuracoes`) |
| **Gestor** | Crescer a carteira com previsibilidade | Não sabe o que está vencendo nem quem está parado | Dashboard, pipeline, renovações, relatórios, horas economizadas |
| **Corretor** | Vender e renovar mais, com menos digitação | Cotar em vários portais, montar comparativos e propostas à mão | Cotação guiada, multicálculo, comparador, proposta web/PDF/WhatsApp, Especializada AI |
| **Operacional** | Manter apólices, documentos e pendências em dia | Transcrever PDFs, cobrar documentos, conferir dados | Central de Operações, Document AI, Data Import Center, tarefas automáticas |
| **Financeiro** | Garantir que toda comissão prevista seja recebida | Conciliação manual de extratos | Comissões previstas × recebidas, divergências, previsão de caixa |

## 4. Módulos e funcionalidades

Formato: **Funcionalidade** — *Por que alguém faria isso manualmente?* → **Automação proposta**. Rota da DEMO entre parênteses.

### 4.1 Core

**Dashboard** (`/`)
- KPIs (prêmio da carteira, renovações do mês, propostas abertas, comissão prevista, horas economizadas) — *Hoje alguém consolida planilhas no fim do mês.* → Calculados em tempo real a partir dos dados operacionais.

**Central de Operações** (`/operacoes`)
- Fila única priorizada do dia — *O corretor abre e-mail, WhatsApp, planilha de vencimentos e agenda para decidir o que fazer.* → Uma lista ordenada por prazo × prêmio em jogo × tempo aguardando, com ação de 1 clique (ligar, enviar WhatsApp, abrir cotação, concluir).
- "Aguardando cliente/seguradora" com contagem de dias — *Pendências esquecidas no e-mail.* → `waitingOn` + `waitingSince` geram follow-up automático.

**Clientes / Cliente 360** (`/clientes`, `/clientes/[id]`)
- Cadastro único de pessoa — *O mesmo cliente é redigitado em cada portal de seguradora.* → Cadastro uma vez; cotações e propostas puxam os dados. Busca por CEP preenche endereço; validação de CPF; detecção de duplicado na digitação.
- Visão 360 (apólices, ativos, família, empresas, oportunidades, documentos, interações, tarefas, comissões) — *Informação espalhada em pastas e planilhas.* → Agregada numa tela, com linha do tempo.
- Lacunas de cobertura (cross-sell) — *Depende da memória do corretor.* → Regras ("tem auto, não tem residencial", "tem saúde, não tem vida") geram sugestões, sem spam.

**Famílias** (`/familias`, `/familias/[id]`) — *Ninguém enxerga a família como unidade de venda.* → Agrupamento N:N com papéis; visão consolidada de apólices e lacunas; cotação de saúde já traz todos os membros e idades.

**Empresas** (`/empresas`, `/empresas/[id]`) — *Sócios e funcionários ficam desconectados da empresa.* → Vínculos pessoa↔empresa (sócio, administrador, funcionário, contato); oportunidades PME (saúde/odonto empresarial, RC, empresarial) e oportunidades pessoais para os sócios.

**CRM** (`/crm`) — *Pipeline em planilha ou cabeça.* → Kanban + lista com estágios `lead → contato → levantamento → cotação → proposta → negociação → aprovado → emissão → emitido` (+ perdido). Oportunidades nascem sozinhas de renovação, cross-sell e importação. Mudança de estágio é automática quando uma cotação é calculada, proposta enviada/aceita ou apólice emitida.

**Tarefas** (`/tarefas`) — *Lembretes em post-it.* → Tarefas criadas por automação com origem rastreável, deduplicadas.

**Documentos + Document AI** (`/documentos`) — *Abrir o PDF da apólice e transcrever número, vigência, prêmio, coberturas.* → IA lê, classifica, identifica o cliente, extrai campos com confiança, sugere um diff; humano confirma. Ver [AI_ARCHITECTURE](AI_ARCHITECTURE.md).

**Data Import Center** (`/importar`) — *Migrar a carteira atual digitando.* → Upload de planilha, mapeamento de colunas sugerido, matching/duplicados, preview, validação, importação reversível e relatório.

**Automações** (`/automacoes`) — *Rotinas repetitivas (criar renovação, cobrar resposta).* → Motor TRIGGER + CONDIÇÃO + AÇÃO com log e minutos economizados. Ver [AUTOMATIONS](AUTOMATIONS.md).

**Especializada AI** (`/ai`) — *Responder "quem vence este mês?" exige filtrar planilhas.* → Perguntas em português respondidas por ferramentas determinísticas sobre o banco, sempre com fonte.

**Relatórios** (`/relatorios`) — produção, renovação, conversão, comissões, horas economizadas, por corretor/ramo/seguradora.

**Configurações** (`/configuracoes`) — perfis/RBAC, restrição de carteira, janelas de renovação, auditoria, integrações, LGPD.

### 4.2 Comercial

**Cotações** (`/cotacoes`, `/cotacoes/nova`, `/cotacoes/[id]`)
- Escolha do ramo → fluxo específico (saúde, auto, genérico) declarado pelo módulo — *Cada seguradora pede os mesmos dados em formatos diferentes.* → Um formulário canônico por ramo; adapters traduzem para cada seguradora/agregador.
- Multicálculo — *Cotar em 5 portais, um por um.* → Disparo paralelo para os adapters habilitados; resultados normalizados com origem (`source.adapter`, `method`, `receivedAt`).
- Comparador e "O que muda?" — *Montar tabela comparativa no Excel.* → Comparação lado a lado gerada; o resumo textual é derivado deterministicamente do diff estruturado.
- Recomendação — *Justificar a escolha a cada cliente.* → Score explicável (aderência a hospitais desejados, orçamento, preferências) com motivo em texto.

**Rede credenciada** (`/rede`) — *Procurar no site de cada operadora se o hospital X atende o plano Y.* → Base unificada e deduplicada de prestadores, consultável por endereço (raio), por plano e por prestador, com mapa e comparação de redes; cada vínculo mostra a fonte e validade da tabela.

**Propostas** (`/propostas`, `/propostas/[id]`, `/p/[id]`) — *Montar PDF no Word/Canva e enviar.* → Proposta gerada da cotação: página web pública com token, PDF idêntico (mesmo HTML), botão WhatsApp com mensagem pronta; rastreio de visualização; follow-up automático.

**Seguradoras** (`/seguradoras`) — cadastro de seguradoras/operadoras, ramos, método de integração e status.

### 4.3 Pós-venda e financeiro

**Apólices** (`/apolices`, `/apolices/[id]`) — *Arquivar PDF e cadastrar dados à mão.* → Criada a partir da proposta aceita ou do Document AI; dispara renovação e comissões automaticamente.

**Renovações** (`/renovacoes`) — *Planilha de vencimentos revisada "quando dá".* → Renovação criada na emissão; janelas 90/60/30/15/7 geram tarefas e oportunidade; checklist (confirmar dados, mudanças, recotar, enviar proposta).

**Comissões** (`/comissoes`) — *Conferir extrato da seguradora linha a linha.* → Comissões previstas geradas na emissão; extrato importado e conciliado por nº de apólice; divergências e atrasos sinalizados.

### 4.4 Módulos de produto (ramos)

Registro em `src/domain/products.ts`. Cada ramo declara: **forms** (campos do pedido de cotação), **rules** (validações e regras de recomendação/cross-sell), **documents** (documentos exigidos), **comparators** (dimensões de comparação), **integrations** (adapters habilitados). Adicionar um ramo = adicionar um módulo.

| Ramo | DEMO | Observação |
|---|---|---|
| Saúde | Fluxo completo + rede credenciada | Maior complexidade: faixas ANS, rede, coparticipação, reembolso |
| Auto | Fluxo completo + multicálculo simulado | FIPE, perfil, bônus, coberturas |
| Demais (odonto, vida, residencial, empresarial, viagem, condomínio, fiança, RC, cyber, transportes, náutico, aeronáutico, garantia, previdência, equipamentos, outros) | Fluxo genérico | Formulário genérico + campos livres até ganhar módulo próprio |

## 5. Fora de escopo (por ora)

Emissão automática na seguradora sem parceria; cobrança/boletos; app mobile nativo; atendimento de sinistro completo (registra-se como interação/tarefa); portal do cliente com login (a página pública de proposta cobre o caso inicial).

---

## 6. Análise do briefing

### (a) Inconsistências e ambiguidades encontradas

1. **Entidades duplicadas**: o briefing lista *Client*, *Lead*, *Person* e *Company* separadamente. Lead e cliente são estados da mesma pessoa/empresa → modelado como `clientStatus` (`lead | ativo | inativo | null`) + oportunidade em estágio `lead`.
2. **"Multicálculo" real × integrações disponíveis**: o briefing assume cotação automática em todas as seguradoras, mas portais de seguradoras em geral não têm API pública. Multicálculo real depende de agregador contratado ou parcerias (ver INTEGRATIONS).
3. **Rede credenciada "de todas as operadoras"**: não há fonte pública única e atualizada de rede por plano comercial. A ANS publica dados abertos de produtos e prestadores *hospitalares*, mas não clínicas/laboratórios nem nomes comerciais na granularidade de venda. Rede confiável exige tabelas fornecidas pelas operadoras (importação) com data de validade.
4. **"IA que preenche tudo"** × **"IA não inventa dados"**: conciliado como IA que *extrai e sugere* com confiança por campo; humano confirma dados críticos.
5. **Visibilidade de carteira e comissões** não definida por papel (ver (h)).
6. **Faixas etárias**: o briefing fala em "idades"; precificação de saúde usa as 10 faixas ANS (RN 63/2003). O sistema pede a idade e deriva a faixa.
7. **Proposta "PDF"** e **"página web"**: tratadas como a mesma fonte HTML renderizada de duas formas, para nunca divergirem.
8. **Fases do briefing** misturam funcionalidade e dependência externa; o ROADMAP separa "construível já" de "depende de contrato".

### (b) Decisões arquiteturais importantes

- Monólito modular em Next.js 15 + TypeScript; core + módulos de produto (registry).
- Domínio puro e testável; integrações atrás de adapters com `capabilities.method` explícito.
- Postgres + Prisma; PostGIS para geo; pg_trgm/unaccent/tsvector para busca; pg-boss para jobs (sem infraestrutura extra).
- Party pattern (Person/Company) com FK reais; dados por ramo em JSONB validado por zod.
- Proveniência e auditoria como requisitos de primeira classe.
- IA por *tool-calling* sobre dados determinísticos; LLM nunca é fonte de número.
- DEMO client-side com dados fictícios (marcados `demo: true`) e repositórios substituíveis.
Detalhes em [ARCHITECTURE](ARCHITECTURE.md).

### (c) O que pode ser construído já (sem dependências externas)

Cadastro único, Cliente 360, famílias, empresas, CRM, tarefas, central de operações, apólices (cadastro manual/importação), renovações e janelas, motor de automações, comissões previstas, Data Import Center, proposta web/PDF, link WhatsApp (`wa.me`, sem API), comparador, RBAC, auditoria, Especializada AI determinística, Document AI com extração por regras para documentos de texto.

### (d) O que depende de dados

- **Tabelas de preço de saúde** por operadora/plano/faixa (fornecidas pelas operadoras ou pelo agregador; mudam com reajuste).
- **Rede credenciada** por plano (planilhas/PDFs das operadoras; dados abertos ANS como complemento hospitalar).
- **Carteira atual** (planilhas, sistema legado, PDFs de apólices) para o Data Import Center.
- **Baselines de tempo** para a métrica de horas economizadas.
- **Regras de comissão** por seguradora/ramo e repasse por corretor.

### (e) O que depende de API

WhatsApp Business Cloud API (envio de templates, recebimento de documentos); e-mail (Gmail API / Microsoft Graph) para captura de documentos; geocodificação (Google/Mapbox); LLM (Claude API) para Document AI em PDFs/imagens e linguagem natural; OCR (ex.: Textract/Document AI, a definir); CEP (ViaCEP); FIPE (via provedor terceiro).

### (f) O que depende de contratos/parcerias

Multicálculo (agregador como Agger/Quiver, Segfy, Infocap etc., ou parceria direta com seguradoras); acesso a APIs de parceiro das seguradoras para cotação/emissão/consulta de apólice; tabelas de rede e preço das operadoras; BSP do WhatsApp (ou conta direta na Meta); provedor de FIPE com SLA; DPA com provedor de LLM e de OCR.

### (g) Melhorias propostas (além do briefing)

1. **Proveniência por campo** + chip "Fonte" em toda a UI.
2. **Score de priorização** da Central de Operações (prazo × prêmio × espera) explicável.
3. **Importação reversível** (cada linha guarda o que criou).
4. **Validade da rede** (`NetworkDataSource.validUntil`, status expirando/expirada) exibida em toda consulta de rede.
5. **Dedupe de prestadores** por CNES + similaridade de nome (trigram) com aliases.
6. **Conciliação de comissões** por extrato importado.
7. **Registro de consentimento LGPD** e requisições de titular dentro do sistema.
8. **CNPJ alfanumérico**: a Receita Federal passa a emitir CNPJ alfanumérico a partir de jul/2026 — o campo é `varchar(14)` e a validação deve aceitar o novo formato (a confirmar a regra final de DV com a especificação oficial).
9. **Atalhos de teclado e ⌘K** para uso intensivo pela equipe.

### (h) Decisões de negócio que precisam do cliente

| # | Decisão | Proposta padrão |
|---|---|---|
| 1 | Quem vê comissões (valores e %)? | Admin, Gestor e Financeiro; corretor vê apenas as próprias |
| 2 | Corretor vê só a própria carteira por padrão? | Sim (`restrictWalletToOwner = true`); gestor vê tudo |
| 3 | Com quais seguradoras/operadoras a corretora realmente trabalha (e em quais ramos)? | Levantar lista; a DEMO usa nomes fictícios |
| 4 | Contratar agregador de multicálculo ou construir adapters próprios? | Contratar agregador para auto/residencial/vida; adapters próprios só onde houver API de parceiro |
| 5 | WhatsApp: qual BSP (ou conta direta na Meta) e qual número? | Avaliar 2–3 BSPs; número dedicado da corretora |
| 6 | Prazos de retenção (leads perdidos, documentos, gravações) | Ver proposta em SECURITY_LGPD; validar com jurídico |
| 7 | Baselines de tempo por tarefa | Cronometrar 1–2 semanas |
| 8 | Regras de cross-sell aceitáveis (frequência, canais) | Máx. 1 sugestão ativa por cliente/ramo; sem envio automático ao cliente |
| 9 | Quem pode enviar proposta ao cliente sem revisão? | Corretor dono; operacional precisa de aprovação |
