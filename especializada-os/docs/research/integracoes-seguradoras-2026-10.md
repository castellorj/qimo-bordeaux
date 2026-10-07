# Integração direta corretora ↔ seguradoras/operadoras (Brasil): pesquisa

Data da pesquisa: 2026-10-07. Escopo: corretora no RJ que vai construir integrações próprias (sem multicálculo de terceiros), sem scraping nem RPA.

**Nota de método.** A ferramenta de busca funcionou, mas o proxy de saída bloqueou a leitura direta de quase todos os sites (gov.br, bradescoseguros.com.br, chubb.com, revistaapolice, cqcs, sensedia, opinbrasil etc.). Por isso, muitas afirmações abaixo se apoiam no **título e no trecho da página mostrados pelo buscador**, e não na leitura completa. Quando a afirmação depende só de matéria de imprensa ou de fonte não oficial, isso está indicado. "Não confirmado" quer dizer que não encontrei fonte pública verificável.

---

## 1. Resumo executivo (10 pontos)

1. **Não existe padrão de mercado nem portal público de APIs para corretores na maioria das grandes seguradoras.** Quase todas se relacionam com o corretor por portais web (Corretor Online, Portal Nosso Corretor, Portal de Negócios etc.). A integração sistêmica acontece por **acordos bilaterais**, em geral com software houses de multicálculo. Fontes: [Mutuus: como o multicálculo se conecta](https://www.mutuus.net/blog/multicalculo-de-seguros/), [CQCS: Teleport via WebService](https://cqcs.com.br/noticia/corretores-apontam-sistemas-de-multicalculos-mais-usados/).
2. **Há evidência pública e concreta de API para parceiros em:**
   - Bradesco Seguros: portal de APIs com Swagger, certificado digital e ambientes de desenvolvimento, homologação e produção;
   - Sompo: dev portal com APIs de cotação, sinistros e financeiro;
   - Pottencial: portal do desenvolvedor no qual corretoras cotam e emitem;
   - Junto Seguros: cerca de 30% das apólices vêm de integração por API;
   - allseg: APIs de cotação e emissão para corretores com sistema próprio;
   - Icatu: portal de APIs com mais de 200 parceiros;
   - MAG: plataforma de APIs;
   - Chubb: Chubb Studio, focado em parceiros digitais;
   - MetLife: Xcelerator, focado em parceiros digitais;
   - HDI: API OAuth2 cuja existência aparece num pacote **não oficial**.

   Fontes estão na tabela.
3. **Porto Seguro (e Azul e Itaú Auto, do mesmo grupo): nenhum portal público de APIs para corretores foi encontrado.** A Porto comprou o controle da Segfy, que é um multicálculo ([Revista Apólice, 2021](https://revistaapolice.com.br/2021/02/porto-seguro-adquire-plataforma-de-tecnologia-segfy/)). Isso indica que a estratégia de integração passa pela própria Segfy. Que a Porto ofereça API de cálculo a corretoras individuais: **não confirmado**.
4. **A proibição de RPA está documentada.** O termo de aceite do corretor da Tokio Marine proíbe compartilhar senha com "aceleradores/robôs de cálculo", sob pena de suspensão do acesso ([Termo de Aceite Tokio Marine 2022](https://portal.tokiomarine.com.br/portal_static/manuais/pdf/TERMO_DE_ACEITE_CORRETOR_SET_2022.pdf); versão 2025 em [link](https://portal.tokiomarine.com.br/portal_static/manuais/pdf/TERMOS_DE_ACEITE_CORRETOR_2025_01.pdf)). Isso confirma que o caminho legítimo é uma integração autorizada (API, web service ou arquivo).
5. **As software houses obtêm cálculo por web service da seguradora, mediante autorização e ajustes técnicos feitos com cada seguradora** ([Mutuus](https://www.mutuus.net/blog/multicalculo-de-seguros/)). A seguradora também precisa cadastrar os usuários; por exemplo, a Suhai gerou código de venda para os usuários do multicálculo ADMSEG ([Revista Apólice](https://revistaapolice.com.br/2016/01/grupo-admseg-e-suhai-seguradora-fazem-parceria/)). Não há programa público de credenciamento de "software house" aberto a qualquer corretora (**não confirmado** que exista).
6. **Open Insurance (OPIN) não é um atalho viável para a corretora no curto prazo.**
   - Participação obrigatória: só seguradoras S1 e S2 ([Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/quem-sao-as-empresas-obrigadas-a-participar-do-open-insurance)).
   - Quem recebe dados do cliente com consentimento são participantes credenciados (seguradoras e SPOCs). Uma corretora só entra se virar SPOC: sociedade anônima, PL mínimo de R$ 1 milhão, credenciamento na SUSEP ([CQCS](https://cqcs.com.br/noticia/veja-quem-pode-ser-uma-spoc-no-mercado-de-seguros/)).
7. **Regulação do OPIN, em ordem:**
   - Res. CNSP 450/2022 extinguiu a SISS e criou a SPOC ([CQCS 20/10/2022](https://cqcs.com.br/noticia/alexandre-camillo-acaba-com-a-siss-e-muda-o-open-insurance-que-e-aberto-aos-corretores-de-seguros/)).
   - Res. CNSP 474 e 475/2024 e Circ. 706 e 707/2024 adiaram o Bloco 6 da Fase 3 para 30/06/2025 ([Demarest](https://www.demarest.com.br/susep-publica-novos-prazos-e-regras-para-a-implementacao-do-open-insurance-e-a-participacao-das-sociedades-processadoras-de-ordem-do-cliente/)).
   - Res. SUSEP 61/2025, de 29/10/2025, reduziu o prazo de saída voluntária e criou o Manual de Monitoramento ([Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/susep-publica-alteracoes-na-norma-do-open-insurance)).
   - O Plano de Regulação 2026 prevê revisão das normas do OPIN ([Demarest](https://www.demarest.com.br/susep-aprova-plano-de-regulacao-para-2026/)).
8. **Situação do OPIN em 2026:** só 2 SPOCs credenciadas (Guru SPOC e OpenPower), demanda do consumidor baixa e resultados concretos projetados para 2027 ([LetsMoney](https://www.letsmoney.com.br/noticias/open-insurance-spocs-demanda-escala/)). Fonte de imprensa, não lida na íntegra.
9. **Padrões de troca de dados:**
   - Comissões: nenhum layout FENACOR ou CNseg para extrato de comissões foi encontrado (**não confirmado** que exista).
   - ACORD: adoção no Brasil **não confirmada**.
   - Boletos: o padrão bancário é o CNAB 240/400 da FEBRABAN ([Tecnospeed](https://blog.tecnospeed.com.br/padroes-de-remessa-e-de-retorno/)). Ele é usado entre a seguradora e o banco, não entre a seguradora e o corretor.
   - Saúde: o TISS (ANS) regula operadora ↔ prestador, não o corretor ([Unimed: Padrão TISS](https://www.unimed.coop.br/site/web/araraquara/tiss)).
   - A FENACOR lançou o PDMIS 2035, que menciona diretrizes de integração tecnológica, mas sem especificação técnica publicada ([CQCS](https://cqcs.com.br/noticia/pdmis-mostra-novas-frentes-que-reformulam-o-setor-de-seguros/)).
10. **Recomendação:**
    - Começar pelas seguradoras com API documentada e foco em corretor: Bradesco Seguros, Junto, Pottencial, Sompo, allseg e HDI (confirmar oficialmente).
    - Ao mesmo tempo, abrir pedidos formais, por meio do gerente comercial, às seguradoras de maior volume da carteira (Porto/Azul/Itaú, Tokio, Allianz, Mapfre, Yelum).
    - Pedir a todas, por escrito, se fornecem extrato de comissões e posição de parcelas por arquivo ou API.

---

## 2. Tabelas por seguradora/operadora

### 2.1 Seguros (ramos elementares, vida, garantia)

| Seguradora | Programa/portal de APIs | O que oferece | Como obter acesso | Fonte | Status confirmado? |
|---|---|---|---|---|---|
| Porto Seguro | Nenhum portal público de APIs para corretor encontrado. Corretor Online é portal web. | Portal: gestão de carteira, cotação e emissão (web). Grupo controla a Segfy (multicálculo). | Não confirmado. Caminho provável: gerente comercial da Porto ou parceria Segfy. | [Revista Apólice – Corretor Online](https://revistaapolice.com.br/2018/11/porto-seguro-investe-no-portal-do-corretor-online/); [Porto adquire Segfy](https://revistaapolice.com.br/2021/02/porto-seguro-adquire-plataforma-de-tecnologia-segfy/) | Portal web: sim. API para corretor: **não confirmado** |
| Azul Seguros / Itaú Seguros Auto e Residência | Sem portal de APIs encontrado. São empresas do Grupo Porto. | Não confirmado. | Não confirmado. Mesmo canal da Porto. | [startupi / Grupo Porto](https://startupi.com.br/?p=194224); [CQCS 04/2026](https://cqcs.com.br/noticia/com-foco-em-inclusao-azul-seguros-consolida-novo-produto-e-amplia-negocios-para-corretores/) | **Não confirmado** |
| Tokio Marine | Sem portal público de APIs. Tem Portal Nosso Corretor, Brokertech, SuperApp e "Negócios Digitais" (cotador configurável para o site do corretor). | Cotação, emissão e acompanhamento no portal. Cotador white-label embutível no site, WhatsApp e e-mail. Portal Garantia com IA. | Adesão ao Negócios Digitais pelo portal (Brokertech). Termo proíbe robôs de cálculo. | [CQCS 2023](https://cqcs.com.br/noticia/tokio-marine-reformula-plataforma-exclusiva-para-os-corretores/); [Tutorial Negócios Digitais](https://marketing.tokiomarine.com.br/Arquivos/e-mails/2022/Corretor/Residencial_Digital/Tutorial_Negocios_Digitais.pdf); [Termo de aceite](https://portal.tokiomarine.com.br/portal_static/manuais/pdf/TERMO_DE_ACEITE_CORRETOR_SET_2022.pdf) | Portais: sim. API para corretor: **não confirmado** |
| Allianz (Brasil) | O grupo tem portais de API em outros países (ex.: Portugal, com Quote & Buy e sinistros). Para o Brasil, nenhum portal público encontrado. | Brasil: não confirmado. | Não confirmado. | [Allianz Portugal APIs](https://portugal.apis.allianz.com); [CQCS 08/2026](https://cqcs.com.br/noticia/diretor-executivo-comercial-da-allianz-destaca-proximidade-com-corretorese-avanco-da-ia/) | Brasil: **não confirmado** |
| HDI Seguros | Existe API OAuth2, com base `openapi-int.hdi.com.br` (ambiente "int"). Endpoints: `/marketplace/offer/v1/` e `/insurance/policy/v1/`. Fonte é pacote Laravel **não oficial**. | Pelo pacote: autenticação, cotação, proposta, consulta de apólice e sinistros. | Credenciais: client_id/secret, API key, código SUSEP e código de sucursal, obtidos junto à HDI. Processo oficial não confirmado. | [Packagist laravel-hdi-seguros](https://packagist.org/packages/jorzelalves/laravel-hdi-seguros) | Existência: provável (fonte não oficial). Programa oficial: **não confirmado** |
| Yelum (ex-Liberty, Grupo HDI/Talanx) | Nenhum portal público de APIs encontrado. | Não confirmado. | Não confirmado. | [Revista Apólice 06/2024](https://revistaapolice.com.br/?p=114484) | **Não confirmado** |
| Bradesco Seguros | Sim: portal de APIs (apiportal.bradescoseguros.com.br) e guia "Onboarding Parceiro BS". | APIs como "Lista Parcelas por Apólice" e "Parcelas em Aberto". Documentação de APIs do Residencial. Ambientes de desenvolvimento, homologação e produção. Coleções Postman. | Onboarding de parceiro: credenciais e certificado digital (mTLS). Corretor como elegível: não confirmado. | [API ParcelasPorApolice](https://www.bradescoseguros.com.br/portalapis/Portal/dist/API-ParcelasPorApolice.json); [API ParcelasEmAberto](https://www.bradescoseguros.com.br/portalapis/Portal/dist/API-ParcelasEmAberto.json); [Onboarding Parceiro](https://www.bradescoseguros.com.br/portalapis/Portal/assets/img/ONBOARDING_PARCEIRO_BS_v2.pdf) | Portal: **sim** (por trechos do buscador). Elegibilidade de corretor: não confirmado |
| Mapfre | Nenhum portal público de APIs encontrado. | Não confirmado. | Não confirmado. | [CQCS 11/2025](https://cqcs.com.br/noticia/mapfre-promove-encontro-com-corretores-mineiros-e-destaca-estrategia-de-proximidade-com-o-mercado/) | **Não confirmado** |
| Zurich (Brasil) | O grupo tem o marketplace global "Zurich eXchange" (cerca de 50 APIs abertas). No Brasil há menção à plataforma "Zews" com catálogo de APIs para parceiros. | Integração padronizada para parceiros (detalhes não confirmados). | Não confirmado. | [Crowdfund Insider 11/2022](https://www.crowdfundinsider.com/2022/11/198321-zurich-insurance-group-introduces-api-marketplace-zurich-exchange/); [Revista Apólice](https://revistaapolice.com.br/?p=124980) | Global: sim. Brasil/corretor: **não confirmado** |
| Sompo | Sim: "Portal Developers Sompo" (Sensedia), voltado a corporate e agro. | APIs de financeiro, sinistros, cotação e Open Insurance. Aplicações "certificadas" antes de conectar. | Certificação da aplicação. Detalhes não públicos. | [Baguete](https://www.baguete.com.br/noticias/sompo-gere-apis-com-sensedia); [Sensedia case](https://www.sensedia.com/customer-story/sompo-insurance-sees-a-5x-increase-in-developers-using-its-dev-portal) | **Sim** (notícia de cerca de 2019; status atual não confirmado) |
| Suhai | Nenhuma API pública. Integra via multicálculo (ex.: ADMSEG). | Auto (roubo e furto). | Parceria com software house e código de venda. | [Revista Apólice 2016](https://revistaapolice.com.br/2016/01/grupo-admseg-e-suhai-seguradora-fazem-parceria/) | API direta: **não confirmado** |
| Chubb | Chubb Studio: APIs e SDKs (subscrição, sinistros, serviço) para parceiros de distribuição digital (varejo, bancos, fintechs). | Distribuição embarcada (B2B2C). | Parceria comercial (página "Parceira com a Chubb"). Foco não é corretor tradicional. | [Chubb – plataformas digitais](https://www.chubb.com/br-pt/partnership/business/digital-platforms.html); [Chubb Studio](https://www.chubb.com/br-pt/about-us/chubb-studio.html) | Programa: **sim**. Uso por corretora para RE/auto: não confirmado |
| AXA (Brasil) | Centro de Excelência de integrações com API Gateway (webMethods). Plataformas digitais de cotação e emissão para corretores (RC, D&O, E&O). | Portais digitais. API externa para corretor: não confirmado. | Não confirmado. | [Baguete – AXA CoE](https://www.baguete.com.br/noticias/axa-cria-centro-focado-em-integracoes); [Revista Apólice 2024](https://revistaapolice.com.br/2024/04/axa-no-brasil-lanca-plataforma-digital-para-o-seguro-eo/) | API para corretor: **não confirmado** |
| SulAmérica (seguros/vida) | Nenhum portal de APIs encontrado. Tem Portal do Corretor e cotadores. | Portal web. | Não confirmado. | [Revista Apólice 2019](https://revistaapolice.com.br/2019/05/sulamerica-lanca-novo-portal-do-corretor/) | **Não confirmado** |
| Icatu | Sim: "portal de APIs" (desde 2018), com mais de 200 parceiros (bancos, fintechs, insurtechs, corretoras digitais). | Vida e previdência com jornada 100% digital. | Parceria comercial. URL e processo não encontrados. | [TI Inside 2020](https://tiinside.com.br/08/06/2020/icatu-acelera-solucoes-digitais-para-clientes-corretores-parceiros-e-startups/); [CQCS 2023](https://cqcs.com.br/noticia/icatu-investe-forte-em-tecnologia-e-na-parceria-com-o-corretor/) | **Sim** (por imprensa) |
| MAG Seguros | Plataforma de APIs (Sensedia) para parceiros venderem e montarem ofertas. | Vida (modelos de contrato por tipo de negócio). | Parceria. Processo não público. | [Sensedia – MAG](https://www.sensedia.com/customer-stories/case-sensedia-mag-seguros) | **Sim** (case do fornecedor) |
| Prudential do Brasil | Nenhuma API pública. Proposta digital e aceite remoto. | Portal e ferramentas digitais. | Não confirmado. | [CQCS 2022](https://cqcs.com.br/noticia/prudential-do-brasil-investe-em-canal-corretor-para-ampliar-participacao-no-segmento-coletivo/) | **Não confirmado** |
| MetLife | MetLife Xcelerator (com Klimber): integração por API para parceiros digitais (bancos, carteiras, e-commerce). | Seguros embarcados. | Parceria comercial. | [CQCS 07/2024](https://cqcs.com.br/noticia/metlife-brasil-ultrapassa-marca-de-2-milhoes-de-clientes-com-a-plataforma-xcelerator/) | **Sim** (foco B2B2C, não corretor) |
| Junto Seguros | Sim: integração por API usada por corretores (cerca de 30% das apólices). Seção "API Junto" no site. Agentes de IA via MCP (AWS Bedrock) "disponível a qualquer corretor cadastrado". | Cotação e emissão instantânea de seguro garantia, consulta de carteira, cancelamento e alteração. | Ser corretor cadastrado na Junto e pedir integração. | [Revista Apólice 05/2025](https://revistaapolice.com.br/2025/05/junto-seguros-lanca-plataforma-para-assessorias-e-reforca-foco-em-tecnologia/); [Revista Apólice 09/2026](https://revistaapolice.com.br/?p=142547); [TI Inside 01/2026](https://tiinside.com.br/21/01/2026/ia-ja-apoia-35-do-codigo-e-10-das-cotacoes-na-junto-seguros/) | **Sim** |
| Pottencial | Sim: "portal do desenvolvedor" (Sensedia). | Corretora parceira integrada cota e emite. Tempo de integração caiu de 3 meses para 20 dias. | Ser corretora parceira e integrar pelo portal. | [Baguete](https://www.baguete.com.br/noticias/pottencial-adota-solucao-da-sensedia) | **Sim** (data da notícia não confirmada) |
| allseg (extra; não pedida) | APIs para corretores com sistema próprio. | Cotação e emissão: Residencial, Empresarial, Garantia, RC Ônibus e Vida. E&O e D&O em desenvolvimento. Documentação e suporte de TI. | Pedido à seguradora. | [CQCS 04/2025](https://cqcs.com.br/noticia/com-investimento-em-apis-allseg-impulsiona-inovacao-e-amplia-oportunidades-para-parceiros/) | **Sim** |
| CNP Seguradora (extra; não pedida) | Portal de Parceiros e cotador digital de vida em grupo (2026). | Portal web (cotação até emissão). | Não confirmado. | [Revista Apólice 06/2026](https://revistaapolice.com.br/2026/06/cnp-seguradora-digitaliza-cotacao-do-vida-em-grupo/) | Portal: sim. API: **não confirmado** |

### 2.2 Operadoras de saúde

| Operadora | Programa/portal de APIs | O que oferece | Como obter acesso | Fonte | Status confirmado? |
|---|---|---|---|---|---|
| Bradesco Saúde | Nenhuma API pública para corretor. Tem CAC (Canal de Atendimento ao Corretor) com automações e IA para inclusão, exclusão e alteração. | Movimentação via canal web. | Portal do corretor. | [Monitor Mercantil](https://monitormercantil.com.br/funcionalidades-no-cac-para-otimizar-a-jornada-do-corretor/) | API: **não confirmado** |
| SulAmérica Saúde | Cotador Saúde e Odonto (PME até 99 vidas). Contratos citam a MECSAS (movimentação eletrônica de cadastro). | Cotação e proposta online. Movimentação eletrônica para a empresa contratante. | Portal. Layout da MECSAS não público. | [Revista Apólice](https://revistaapolice.com.br/?p=78479); [Condições gerais SulAmérica](https://www.sulamerica.com.br/saude/cg/CondicoesGeraisSaudeAHOPMEMais.pdf) | API para corretor: **não confirmado** |
| Amil | Plataforma de vendas para corretores (PEGA). | Venda PME e grandes empresas 100% eletrônica. | Portal. | [CQCS 06/2023](https://cqcs.com.br/noticia/amil-lanca-nova-plataforma-para-corretores/) | API: **não confirmado** |
| Porto Saúde | Ferramenta de cotação rápida (PME). | Cotação em menos de 1 minuto. | Portal. | [Monitor Mercantil](https://monitormercantil.com.br/porto-saude-retoma-etapa-turbo/) | API: **não confirmado** |
| Unimed | Swagger interno para integração de sistemas de gestão com os apps Unimed. Nada voltado ao corretor. | Guia médico por cooperativa (web). | Não aplicável ao corretor. | [Unimed – integrações dos apps](https://www.unimed.coop.br/site/web/unimedlab/-/entendendo-as-integracoes-dos-aplicativos) | API para corretor: **não confirmado** |
| Hapvida NotreDame | Novo Portal do Corretor: simuladores PME e middle, propostas. App do corretor com venda individual 100% digital. | Portal e app. | Portal. | [Hapvida RI](https://api.mziq.com/mzfilemanager/v2/d/6bbd1770-f9f4-44e8-a1b1-d26b7585eec1/b6be6ea1-4337-b658-b068-a0672cffbc5a?origin=1) | API: **não confirmado** |
| Omint | PME Web: plataforma de cotação para corretores (12/2024). | Cotação saúde e odonto. | Portal. | [CQCS 12/2024](https://cqcs.com.br/noticia/omint-saude-lanca-pme-web-em-evento-para-corretores/) | API: **não confirmado** |
| Care Plus | Nada encontrado. | — | — | — | **Não confirmado** |

**Dados públicos de saúde (alternativa a pedir arquivos às operadoras):**
- A ANS publica dados abertos de operadoras, planos e prestadores ([ANS PDA](https://www.gov.br/ans/pt-br/arquivos/acesso-a-informacao/perfil-do-setor/dados-abertos/pda-edicao-2017-2019/pda_ans_conjunto_dados_2017_2019_fases.pdf)).
- Operadoras com mais de 100 mil beneficiários devem publicar a rede assistencial no site (RN 285) ([Estado de Minas](https://www.em.com.br/app/noticia/economia/2012/06/25/internas_economia,302131/planos-de-saude-devem-disponibilizar-a-rede-assistencial-completa-em-seu-site.shtml)).
- Tabelas de preço PME por API ou arquivo para corretoras: **não confirmado** em nenhuma operadora.

---

## 3. Como as software houses obtêm cálculo (Questão 2)

- **Mecanismo.** As plataformas de multicálculo "se conectam aos servidores das seguradoras" via web service. As seguradoras "precisam autorizar a sua utilização" e são feitos "ajustes técnicos necessários" ([Mutuus](https://www.mutuus.net/blog/multicalculo-de-seguros/)). O Teleport (TEx) é descrito como "integrado via WebService às principais seguradoras", com 22 seguradoras ([CQCS](https://cqcs.com.br/noticia/corretores-apontam-sistemas-de-multicalculos-mais-usados/); [Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/tex-amplia-ecossistema-do-teleport-com-chegada-da-allseg)).
- **Cada integração é um acordo bilateral** anunciado como parceria. Exemplos:
  - Youse com Agger e Corretagem Fácil, 07/2025 ([Revista Apólice](https://revistaapolice.com.br/2025/07/youse-entra-em-multicalculo-com-agger-e-corretagem-facil/));
  - Justos com TEx, 04/2024 ([Revista Apólice](https://revistaapolice.com.br/2024/04/tex-e-seguradora-justos-firmam-parceria/));
  - Affinity com Agger, 12/2025 ([Revista Apólice](https://revistaapolice.com.br/2025/12/affinity-avanca-em-transformacao-digital-e-integra-multicalculo-agger/)).
- **Cadastro comercial.** A seguradora cria códigos de venda para os usuários do multicálculo, como fez a Suhai com a ADMSEG ([Revista Apólice](https://revistaapolice.com.br/2016/01/grupo-admseg-e-suhai-seguradora-fazem-parceria/)).
- **Concentração de mercado e conflito de interesse:**
  - a Porto controla a Segfy ([Revista Apólice](https://revistaapolice.com.br/2021/02/porto-seguro-adquire-plataforma-de-tecnologia-segfy/));
  - a Totvs comprou a Agger por R$ 260 milhões ([IT Forum](https://itforum.com.br/?p=9604474));
  - a Quiver pertence à Dimensa ([Descomplica](https://descomplica.com.br/blog/quiver-dimensa-tecnologia-mercado-seguros-2/)).

  As seguradoras investem em poucos canais agregados, o que reduz o incentivo para abrir a mesma API a cada corretora individual.
- **Uma corretora pode obter o mesmo acesso?**
  - Não há programa público de credenciamento de "software house" em nenhuma das seguradoras pesquisadas (**não confirmado** que exista).
  - Há precedentes de acesso direto:
    - Minuto Seguros: corretora digital com cotação em tempo real em mais de 15 seguradoras, comprada pela Creditas ([Brazil Journal](https://braziljournal.com/creditas-compra-minuto-seguros-e-abre-nova-vertical/)). Que use API direta, e não terceiros: **não confirmado**.
    - allseg, Junto e Pottencial dizem explicitamente que corretoras com sistema próprio podem integrar (fontes na tabela).
  - Na prática, o acesso depende de volume e relacionamento comercial. Exigências típicas mínimas, mais segurança e LGPD: **não confirmado** publicamente.
- **Evidência de "API de cálculo" oferecida diretamente a corretoras:**
  - **Sim:** allseg (RE, garantia, vida), Junto (garantia), Pottencial (garantia e outros) e Sompo (cotação, corporate e agro).
  - **Provável:** HDI (cotação, segundo pacote não oficial).
  - **Não confirmado:** auto nas grandes (Porto, Tokio, Allianz, Mapfre, Bradesco Auto, Yelum, Suhai).

---

## 4. Open Insurance Brasil (Questão 3)

**Quem é obrigado:**
- Seguradoras S1 e S2 participam obrigatoriamente (Res. CNSP 415/2021).
- S3, S4 e as do sandbox participam voluntariamente.

Fonte: [Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/quem-sao-as-empresas-obrigadas-a-participar-do-open-insurance).

**Fases:**
- Fase 1: dados públicos de produtos e canais.
- Fase 2: dados pessoais com consentimento (desde 09/2022).
- Fase 3: "serviços de iniciação de movimentação": contratação, endosso, aviso de sinistro, resgate, portabilidade e sorteio. Os prazos foram escalonados até 29/11/2024, e o **Bloco 6** (pessoas, microsseguros, previdência, capitalização) foi adiado para **30/06/2025**.

Fontes: [Demarest PDF 2023](https://demarest.com.br/wp-content/uploads/2023/08/Open-Insurance-tem-novas-datas-de-implantacao-veja-beneficios-ao-consumidor-1.pdf); [Voto CNSP 2 (27/11/2024)](https://www.gov.br/susep/pt-br/arquivos/arquivos-dos-documentos-e-publicacoes/votos/data-27_11_24/voto_cnsp_2_-_opin_assinado.pdf); [InfoMoney](https://www.infomoney.com.br/minhas-financas/susep-prorroga-prazos-de-implementacao-do-open-insurance/).

**Cotação via OPIN:**
- A imprensa descreve que, no modelo SPOC, as seguradoras "respondem às solicitações de cotação" ([InfoMoney](https://www.infomoney.com.br/minhas-financas/primeira-spoc-pede-autorizacao-para-funcionar-qual-sera-o-impacto-para-o-consumidor-de-seguros/)).
- Especificação técnica das APIs de cotação (nomes, escopo por ramo, obrigatoriedade): **não confirmada**. A documentação oficial está em opinbrasil.atlassian.net e no [Manual de APIs (SUSEP)](https://www.gov.br/susep/pt-br/assuntos/open-insurance/arquivos/manual-de-apis-do-open-insurance-v1-2.pdf), ambos inacessíveis daqui.

**Linha do tempo regulatória:**
- **Res. CNSP 450/2022** (20/10/2022): extinguiu a SISS (Sociedade Iniciadora de Serviço de Seguro) e criou a **SPOC** (Sociedade Processadora de Ordem do Cliente). Abriu ao corretor a possibilidade de ser SPOC, desde que tenha objeto exclusivo de intermediação e iniciação de serviços ([CQCS](https://cqcs.com.br/noticia/alexandre-camillo-acaba-com-a-siss-e-muda-o-open-insurance-que-e-aberto-aos-corretores-de-seguros/)). Detalhe das demais mudanças (Circ. 681/2022): não confirmado ([Lefosse](https://lefosse.com/noticias/alerta/susep-publica-circular-n-681-2022-e-resolucao-cnsp-n-450-2022-alterando-disposicoes-sobre-o-open-insurance/)).
- **Requisitos de SPOC (Res. CNSP 429/2021):**
  - sociedade anônima;
  - PL mínimo de R$ 1 milhão;
  - não pode reter risco;
  - credenciamento na SUSEP.

  Fontes: [CQCS 03/2024](https://cqcs.com.br/noticia/veja-quem-pode-ser-uma-spoc-no-mercado-de-seguros/); [Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/2024-e-as-spocs-o-corretor-de-seguros-na-sua-forma-mais-evoluida).
- **Res. CNSP 466/2024:** mudou a governança (arts. 39 e 42 da 415), vigente desde 01/06/2024 ([OKAI](https://okai.com.br/documento/2024-04-26/resolucao-cnsp-n-º-466)).
- **Res. CNSP 474 e 475/2024 e Circ. SUSEP 706 e 707/2024:** novos prazos. A 475 cancela o credenciamento da SPOC que não se registrar no OPIN em até 30 dias ([Demarest](https://www.demarest.com.br/susep-publica-novos-prazos-e-regras-para-a-implementacao-do-open-insurance-e-a-participacao-das-sociedades-processadoras-de-ordem-do-cliente/); [Legismap](https://legismap.com.br/leis-e-normas/resolucao-cnsp-n-475-de-27-11-2024)).
- **Res. SUSEP 61/2025** (29/10/2025):
  - saída voluntária do OPIN passa de 12 meses para 30 dias (imediata sem consentimentos ativos);
  - cria o Manual de Monitoramento;
  - define conteúdos mínimos do Manual de Experiência do Cliente e da Plataforma de Resolução de Disputas.

  Fonte: [Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/susep-publica-alteracoes-na-norma-do-open-insurance).
- **Plano de Regulação 2026** (Res. SUSEP 72/2025, alterada pela Res. SUSEP 91 de 18/08/2026): prevê revisão das normas do OPIN conforme o Grupo de Trabalho da Portaria 8.442/2024 ([Demarest](https://www.demarest.com.br/susep-aprova-plano-de-regulacao-para-2026/); [Legismap – Res. 91/2026](https://legismap.com.br/leis-e-normas/resolucao-susep-n-091-de-18-08-2026)). Conteúdo final da revisão: não confirmado.

**SPOCs credenciadas:**
- Guru SPOC ([Contxto](https://www.contxto.com/en/brazil/guru-spoc-receives-green-light-for-open-insurance-operations-in-brazil/)).
- OpenPower, Portaria 16/24 ([Revista Apólice](https://revistaapolice.com.br/?p=116484)).
- Total de 2 em 04/2026 ([LetsMoney](https://www.letsmoney.com.br/noticias/open-insurance-spocs-demanda-escala/)).
- FENACOR, ENS e Ibracor anunciaram a IPR Brasil e a "OpenCor Brasil" para credenciar corretores no OPIN ([Revista Apólice](https://revistaapolice.com.br/?p=103250)). Status operacional em 2026: **não confirmado**.

**A corretora pode obter dados de apólices dos clientes com consentimento via OPIN?** Só se ela mesma for SPOC, ou usando os serviços de uma SPOC. O OPIN não prevê a corretora como receptora direta. Fonte: definição de SPOC como participante credenciado "exclusivamente através do consentimento" ([Legismap](https://legismap.com.br/conteudos/artigos-e-noticias/2024-e-as-spocs-o-corretor-de-seguros-na-sua-forma-mais-evoluida)).

**Prazo realista:** a demanda é baixa e os resultados concretos são projetados para 2027 ([LetsMoney](https://www.letsmoney.com.br/noticias/open-insurance-spocs-demanda-escala/)). Para a corretora, o OPIN é uma opção de médio e longo prazo (2027 ou depois) e não substitui as integrações bilaterais.

**Alternativas relacionadas da SUSEP:**
- O SRO (registro de operações) permite ao **consumidor** consultar apólices em seu nome ("Consulta de Seguros"); não há API para corretor ([SUSEP – SRO](https://www.gov.br/susep/pt-br/assuntos/sistema-de-registro-de-operacoes)).
- A SUSEP oferece API JWT de consulta de corretores para empresas (seguradoras), útil apenas para validação cadastral ([SUSEP – instruções](https://www.gov.br/susep/pt-br/arquivos/arquivos-licenciamento/corretor-de-seguros/empresa-consulta-api-corretores-instrucoes.pdf/@@download/file)).

---

## 5. Padrões de troca de dados (Questão 4)

- **Extrato de comissões:** não encontrei layout padronizado FENACOR, CNseg ou SUSEP (**não confirmado** que exista). Hoje cada seguradora fornece o extrato no seu portal ou em arquivo proprietário. O app HDI Corretor tem consulta de comissões ([Revista Apólice 2022](https://revistaapolice.com.br/2022/08/hdi-seguros-investe-em-novos-recursos-para-corretores-parceiros/)).
- **FENACOR:** o PDMIS 2035 menciona "diretrizes para integração tecnológica entre plataformas" e capacitação em APIs, sem especificação técnica publicada ([CQCS 06/2026](https://cqcs.com.br/noticia/pdmis-mostra-novas-frentes-que-reformulam-o-setor-de-seguros/); [Livro PDMIS](https://legismap.com.br/images/phocadownload/livro-pdmis-2035.pdf)).
- **CNseg:** há discussão sobre padronização de dados enviados a registradoras e à SUSEP, não entre corretor e seguradora ([InfoMoney](https://www.infomoney.com.br/?p=2214030)).
- **ACORD:** é um padrão global com membros em mais de 100 países ([ACORD](https://acord.org/about)). Adoção por seguradoras brasileiras: **não confirmado**.
- **Boletos:**
  - O CNAB 240/400 (FEBRABAN) é o padrão de remessa e retorno entre empresa e banco ([Tecnospeed](https://blog.tecnospeed.com.br/padroes-de-remessa-e-de-retorno/)).
  - A corretora não recebe o CNAB da seguradora. A segunda via e as parcelas vêm por APIs da seguradora, como as de parcelas da Bradesco Seguros ([API ParcelasEmAberto](https://www.bradescoseguros.com.br/portalapis/Portal/dist/API-ParcelasEmAberto.json)).
  - Para a cobrança própria da corretora (ex.: comissões a receber de parceiros), vale CNAB ou API de cobrança do banco.
- **Averbação de transportes:** existe integração via API da Porto (AverbePorto), segundo uma biblioteca PHP de terceiros ([Packagist averbporto](https://packagist.org/packages/liontecnologia/averbporto)). Relevante só se a corretora atuar com transportes.
- **Saúde:**
  - O TISS (ANS) é obrigatório entre operadora e prestador ([Unimed – TISS](https://www.unimed.coop.br/site/web/araraquara/tiss)).
  - A movimentação cadastral usa layouts proprietários por operadora, por exemplo um guia de especificação XML da Mapfre ([Mapfre guia](https://www.mapfre.com.br/media/MAP_GUIA_ESPECIFICACAO_tcm909-618444.pdf)) e a MECSAS da SulAmérica. Não há padrão para corretor.

---

## 6. Requisitos típicos, prazos e custos (Questão 5)

- **Credenciais e segurança:**
  - Bradesco Seguros: certificado digital mais credenciais, ambientes de desenvolvimento, homologação e produção, coleções Postman ([Onboarding BS](https://www.bradescoseguros.com.br/portalapis/Portal/assets/img/ONBOARDING_PARCEIRO_BS_v2.pdf)).
  - HDI: OAuth2 com client_id e secret, mais API key, **código SUSEP** e código de sucursal ([pacote não oficial](https://packagist.org/packages/jorzelalves/laravel-hdi-seguros)).
  - Sompo: aplicação "certificada" antes de conectar ([Baguete](https://www.baguete.com.br/noticias/sompo-gere-apis-com-sensedia)).
- **Relação comercial prévia:** a corretora precisa estar cadastrada na seguradora; a Junto, por exemplo, exige "corretor cadastrado" ([Revista Apólice 09/2026](https://revistaapolice.com.br/?p=142547)). Volume mínimo: **não confirmado** publicamente.
- **Prazo de integração:** na Pottencial, de 3 meses para 20 dias após o portal do desenvolvedor ([Baguete](https://www.baguete.com.br/noticias/pottencial-adota-solucao-da-sensedia)). Outras seguradoras: **não confirmado**.
- **Custos:** nenhuma seguradora publica tarifa de API para corretor (**não confirmado**).
- **LGPD:** em toda integração a corretora atua como controladora ou operadora de dados pessoais do segurado. Espere cláusulas de proteção de dados no contrato de integração (inferência; não há fonte específica).
- **Regras de uso:** os termos de portal proíbem robôs e compartilhamento de senha (Tokio Marine). Integrações precisam ser formalmente autorizadas ([Termo Tokio](https://portal.tokiomarine.com.br/portal_static/manuais/pdf/TERMO_DE_ACEITE_CORRETOR_SET_2022.pdf)).

---

## 7. Plano recomendado

**Fase 0 (semanas 0–2): levantamento interno**
1. Ranking das seguradoras por prêmio e comissão na carteira da corretora, e por ramo (auto, residencial, vida, empresarial, saúde).
2. Ter em mãos o código SUSEP da corretora e os códigos de produtor e sucursal em cada seguradora (a HDI pede esses dados na API).
3. Preparar um "kit de integração": CNPJ, código SUSEP, descrição da arquitetura, política de segurança e LGPD (DPO, criptografia, logs), IPs fixos, possibilidade de certificado ICP-Brasil/mTLS.

**Fase 1 (meses 1–3): seguradoras com API documentada para parceiros**
- **Bradesco Seguros:** pedir onboarding no portal de APIs (parcelas e boletos, residencial). Confirmar se corretor é elegível.
- **Junto e Pottencial:** garantia, com cotação e emissão por API já usadas por corretores.
- **allseg:** RE, garantia e vida.
- **Sompo:** corporate e agro, se forem relevantes.
- **HDI:** pedir formalmente acesso à API OAuth2 (cotação, proposta, apólice, sinistro). Validar com a HDI, já que a fonte atual é não oficial. Perguntar se cobre a Yelum.

**Fase 2 (meses 1–6, em paralelo): pedido formal às grandes de auto e RE**
- Porto/Azul/Itaú, Tokio Marine, Allianz, Mapfre, Yelum, Suhai, Zurich, Chubb e AXA, por meio do gerente comercial ou da assessoria. Pedir por escrito:
  - existe API ou web service de cálculo e transmissão para corretoras com sistema próprio;
  - contrato e homologação exigidos;
  - extrato de comissões por arquivo ou API;
  - posição de parcelas e segunda via de boleto;
  - status de sinistro.
- Onde não houver API, aceitar **arquivos oficiais exportados pela seguradora** (extratos e relatórios do portal baixados manualmente e importados). Isso não é scraping e é compatível com a restrição.
- Na Tokio Marine, avaliar o cotador white-label do "Negócios Digitais" para o site da corretora como solução intermediária autorizada ([Tutorial](https://marketing.tokiomarine.com.br/Arquivos/e-mails/2022/Corretor/Residencial_Digital/Tutorial_Negocios_Digitais.pdf)).

**Fase 3 (contínua): vida e saúde**
- Vida e previdência: Icatu e MAG têm plataformas de API para parceiros. Pedir enquadramento como parceiro.
- Saúde: nenhuma operadora pesquisada mostrou API para corretor.
  - Usar os portais de cotação (Omint PME Web, Cotador SulAmérica, Amil, Hapvida, Porto Saúde).
  - Pedir layouts de movimentação cadastral pelos quais a empresa cliente já envia arquivos, como a MECSAS da SulAmérica.
  - Usar dados abertos da ANS para operadoras e planos.

**Fase 4 (2027 ou depois): Open Insurance**
- Acompanhar a revisão normativa de 2026 e a OpenCor/IPR (FENACOR).
- Avaliar parceria com uma SPOC (Guru ou OpenPower) para obter, com consentimento, os dados de apólices dos clientes.
- Tornar-se SPOC (S.A., PL de R$ 1 milhão, credenciamento) só se houver escala.

**Arquitetura sugerida (inferência, sem fonte):**
- Uma camada de "conectores" por seguradora com um modelo canônico interno: cotação, proposta, apólice, parcela, comissão, sinistro.
- Conectores do tipo API e do tipo importação de arquivo atrás da mesma interface.
- Auditoria por chamada (LGPD).
- Isso permite começar pelos arquivos e trocar por API à medida que cada seguradora libera acesso.
