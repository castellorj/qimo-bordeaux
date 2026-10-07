# Guia de integração com seguradoras (integração própria)

> Decisão do cliente: **integração própria** — um conector por seguradora, sem agregador de multicálculo, **sem scraping/RPA**.
> Base: pesquisa de 07/10/2026 em [research/integracoes-seguradoras-2026-10.md](research/integracoes-seguradoras-2026-10.md) (fontes linkadas lá; várias páginas só puderam ser lidas pelo resumo do buscador — itens "a confirmar" precisam ser validados com cada seguradora).

## 1. O que a pesquisa mostrou (resumo)

1. **Não existe padrão de mercado nem portal público de APIs para corretores nas grandes de auto** (Porto/Azul/Itaú, Tokio Marine, Allianz, Mapfre, Yelum, Suhai). Elas atendem o corretor por **portais web**; a integração sistêmica é feita por **acordos bilaterais**, hoje concentrados em softwares de multicálculo.
2. **Há caminhos concretos de API para parceiros** em: Bradesco Seguros (portal de APIs com certificado digital e ambientes de homologação), Junto e Pottencial (garantia — corretores já cotam/emitem por API), allseg (RE, garantia, vida — APIs para corretores com sistema próprio), Sompo (portal de desenvolvedores corporate/agro), Icatu e MAG (vida/previdência para parceiros). HDI tem API OAuth2 citada em fonte **não oficial** — pedir confirmação.
3. **RPA é proibido** nos termos dos portais (ex.: termo do corretor da Tokio Marine veda compartilhar senha com "robôs ou aceleradores de cálculo"). Reforça o caminho: API autorizada, arquivo oficial ou manual.
4. **Saúde:** nenhuma operadora pesquisada oferece API ao corretor; existem portais de cotação e layouts próprios de movimentação cadastral (enviados pela empresa cliente). Rede e preços continuam por **importação de tabelas** + dados abertos da ANS.
5. **Extrato de comissões:** não há layout padrão (FENACOR/CNseg); cada seguradora tem o seu, disponível no portal → **importação de arquivo com layout por seguradora** (já implementado).
6. **Open Insurance:** só S1/S2 são obrigadas; a corretora só acessa dados de apólices com consentimento se for **SPOC** (S.A., PL mín. R$ 1 mi, credenciamento SUSEP) ou usar uma (2 credenciadas em 04/2026). Opção para **2027+**, não substitui as integrações bilaterais.

## 2. Estratégia: três vias atrás de um mesmo contrato

Cada seguradora × capacidade usa a melhor via disponível — e pode evoluir sem mexer no resto do sistema (`src/integrations/insurers/contract.ts`):

| Via | Quando | Exemplo | Status no sistema |
|---|---|---|---|
| **API autorizada** | Seguradora liberou acesso técnico | Junto/Pottencial (garantia), allseg, Bradesco (parcelas) | Contrato `InsurerAdapterV2`, cofre de credenciais, cliente HTTP com retry/circuit breaker, modelo de adapter (`adapters/_template.ts`) |
| **Arquivo oficial** | Seguradora disponibiliza exportação no portal | Extratos de comissão, relatórios de apólices/parcelas | **Pronto:** Comissões → *Conciliar extrato* (layout por seguradora, conciliação previsto × recebido) |
| **Manual assistido** | Sem API nem arquivo | Cálculo de auto nas grandes, hoje | **Pronto:** "cotação manual" no mesmo comparativo, com origem e responsável |

## 3. Ordem recomendada (ondas)

**Onda 0 — semanas 0–2 (interno)**
- Ranking de seguradoras por prêmio/comissão e ramo na carteira (o Data Import Center gera isso após importar a carteira).
- Reunir: CNPJ, **código SUSEP**, códigos de produtor/sucursal em cada seguradora.
- Montar o **kit de integração** (seção 5).

**Onda 1 — meses 1–3: quem já tem API para parceiros**
| Seguradora | Pedir | Uso no sistema |
|---|---|---|
| Junto, Pottencial | Acesso à API de cotação/emissão de garantia | Multicálculo de garantia + emissão |
| allseg | APIs de RE, garantia e vida | Multicálculo residencial/empresarial |
| Bradesco Seguros | Onboarding no portal de APIs (parcelas, residencial) — confirmar elegibilidade de corretor | Parcelas/boletos na Central e na apólice |
| HDI (e Yelum) | Confirmação oficial da API OAuth2 (cotação, proposta, apólice, sinistro) | Primeiro conector de **auto** |
| Sompo | Se houver carteira corporate/agro | Cotação/sinistro |

**Onda 2 — meses 1–6, em paralelo: pedido formal às grandes de auto/RE**
Porto/Azul/Itaú, Tokio Marine, Allianz, Mapfre, Zurich, Suhai, Chubb, AXA — via gerente comercial, **por escrito** (modelo na seção 6). Enquanto não houver API: arquivos oficiais (comissões, parcelas) + cotação manual. Na Tokio, avaliar o cotador white-label "Negócios Digitais" no site da corretora como solução autorizada.

**Onda 3 — contínua: vida e saúde**
Icatu e MAG (APIs de parceiros). Saúde: portais de cotação + importação de tabelas e rede, layouts de movimentação cadastral quando a empresa cliente já os usa.

**Onda 4 — 2027+: Open Insurance**
Acompanhar a revisão normativa de 2026 e as iniciativas da FENACOR; avaliar parceria com SPOC para trazer apólices dos clientes com consentimento.

## 4. Como cada conector é construído (checklist técnico)

1. **Documentação oficial + contrato** de uso de dados (LGPD: papéis de controlador/operador, finalidade, retenção).
2. **Credenciais de homologação no cofre** (`credentials.ts`) — nunca no código nem no navegador; mTLS quando exigido.
3. **Copiar `adapters/_template.ts`** → `adapters/<seguradora>.ts`; implementar só as capacidades liberadas (`bindings`).
4. **Mapear** requisição canônica → formato da seguradora (CEP, FIPE, condutor, coberturas, franquia) e resposta → `QuoteResult` normalizado (prêmio, franquia, coberturas, assistências, comissão, nº do cálculo).
5. **Testes de contrato** com respostas reais anonimizadas (o teste valida que prêmio/coberturas/comissão são normalizados e que respostas inválidas viram erro, nunca valor inventado).
6. **Homologação** com a seguradora (cenários: aceito, recusado, pendência, erro).
7. **Produção** com `healthCheck`, logs mascarados (CPF/e-mail/telefone), alerta de erro e **fallback automático para cotação manual**.
8. Marcar as etapas no checklist do card da seguradora (/seguradoras).

## 5. Kit de integração (enviar a cada seguradora)

- Dados da corretora: razão social, CNPJ, **código SUSEP**, códigos de produtor/sucursal, responsável técnico e comercial.
- Escopo pedido por capacidade: cálculo, transmissão de proposta, consulta de apólice/parcelas/2ª via, extrato de comissões, status de sinistro.
- Arquitetura resumida: sistema próprio, chamadas apenas servidor-a-servidor, IPs fixos, suporte a OAuth2/mTLS/certificado ICP-Brasil.
- Segurança e LGPD: encarregado (DPO), criptografia em trânsito e repouso, trilha de auditoria por chamada, política de retenção, nenhum compartilhamento de senha de portal, nenhum robô.
- Volumes estimados (cotações/mês por ramo) — ajuda na priorização da seguradora.

## 6. Modelo de pedido (e-mail ao gerente comercial)

> **Assunto:** Especializada Seguros — solicitação de integração técnica (código SUSEP XXXXXX)
>
> Olá, [nome]. A Especializada Seguros está implantando um sistema próprio de gestão e gostaria de integrá-lo à [Seguradora] por um canal **oficial e autorizado** (não usamos robôs nem compartilhamento de senhas). Gostaríamos de saber:
> 1. Existe API ou web service de **cálculo/cotação** e **transmissão de proposta** disponível para corretoras com sistema próprio? Quais ramos?
> 2. Há API ou arquivo para **extrato de comissões**, **posição de parcelas/2ª via de boleto** e **status de sinistro**?
> 3. Quais são os requisitos (contrato, certificação, ambiente de homologação, volume mínimo)?
> 4. Quem é o contato técnico para iniciarmos?
>
> Seguem em anexo nossos dados cadastrais e o resumo de segurança/LGPD. Obrigado!

## 7. O que já está pronto no código

- `src/integrations/insurers/contract.ts` — contrato de produção por capacidade + erros normalizados.
- `src/integrations/insurers/credentials.ts` — cofre (variáveis de ambiente; trocar por secrets manager).
- `src/integrations/insurers/http.ts` — timeout, retry com backoff, circuit breaker, idempotência, logs com dados pessoais mascarados.
- `src/integrations/insurers/adapters/_template.ts` — modelo de conector (sem endpoints reais).
- `src/integrations/insurers/commission-statements.ts` + **/comissoes/conciliacao** — integração por arquivo de extrato, funcionando hoje.
- /seguradoras — caminho de integração de cada seguradora (onda, evidência pública ou "a confirmar") e checklist de onboarding.
