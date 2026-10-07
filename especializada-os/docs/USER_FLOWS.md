# Fluxos de Usuário

Cada fluxo indica a rota da DEMO, os passos, o que o sistema faz sozinho (⚙) e onde o humano confirma (✋). Na DEMO, integrações externas são simuladas e rotuladas como tal.

---

## 1. Central de Operações — rotina da manhã (`/operacoes`)

Persona: Corretor ou Operacional, 8h30.

1. Login → aterrissa em `/operacoes` (configurável; gestor aterrissa no Dashboard).
2. Cabeçalho: "Hoje: 14 itens · 3 vencidos · R$ 182 mil em prêmio em jogo".
3. ⚙ Fila priorizada única, agrupada em blocos:
   - **Vencidos e de hoje** (tarefas com `due ≤ hoje`).
   - **Renovações em janela** (90/60/30/15/7 dias).
   - **Propostas sem resposta** (enviadas há ≥ `followUpDays`).
   - **Aguardando cliente/seguradora** (com dias de espera).
   - **Documentos aguardando revisão** (Document AI).
   - **Sugestões de cross-sell** (máx. 1 por cliente/ramo).
4. Ordenação: `score = urgência(prazo) × peso(prêmio em jogo) × fator(espera)`; tooltip explica o score.
5. Cada item tem ações em linha: **WhatsApp** (mensagem pré-redigida, ✋ revisar antes de enviar), **Abrir** (cliente/apólice/proposta), **Cotar**, **Concluir**, **Adiar** (+1d/+3d/+1sem com motivo).
6. Concluir registra interação + auditoria e contabiliza minutos economizados quando a tarefa foi criada por automação.
7. Ao zerar a fila: estado vazio "Tudo em dia" + resumo de horas economizadas no dia.

## 2. Novo cliente — digitar uma vez (`/clientes` → "+ Novo")

1. "+ Novo" (topbar ou tecla `N`) → **Pessoa** ou **Empresa**.
2. Pessoa: digita CPF → ⚙ valida dígitos; ⚙ busca duplicado (CPF exato / nome+nascimento similar) → se existir, oferece abrir o existente.
3. Nome, nascimento, celular/WhatsApp, e-mail. CEP → ⚙ preenche logradouro, bairro, cidade, UF (ViaCEP; DEMO: base local) → número/complemento.
4. Opcional na mesma tela: **adicionar familiares** (cria Household com papéis) e **ativos** (veículo por placa/FIPE, imóvel pelo endereço).
5. Corretor responsável (padrão: quem cadastra), origem, consentimentos (✋ checkbox de marketing por WhatsApp/e-mail, separado de comunicação operacional).
6. Salvar → ⚙ `client.created` dispara: verificação de cross-sell, auditoria, oportunidade inicial se origem = lead.
7. Daqui em diante, cotação/proposta/apólice puxam esses dados — nada é redigitado.

## 3. Cliente 360 (`/clientes/[id]`)

Layout: cabeçalho (nome, status, corretor, chips de ramos que possui, CPF mascarado — revelar exige permissão e gera `view_sensitive` na auditoria) + abas:

| Aba | Conteúdo |
|---|---|
| Visão geral | KPIs (prêmio anual, nº apólices, próxima renovação, comissão anual*), lacunas de cobertura, próximas tarefas, linha do tempo |
| Apólices | Vigentes/históricas com chip de fonte |
| Cotações e propostas | Status e últimas visualizações |
| Família / Empresas | Vínculos com atalho para `/familias/[id]` e `/empresas/[id]` |
| Ativos | Veículos, imóveis, embarcações |
| Documentos | Com status de extração |
| Interações | WhatsApp, e-mail, ligações, sistema |

*conforme permissão `commissions.view`. Ações rápidas: Nova cotação (ramo pré-sugerido pelas lacunas), WhatsApp, Nova tarefa, Upload de documento.

## 4. Família (`/familias/[id]`)

1. Criar família a partir do titular ("Família Silva") ou no cadastro de pessoa.
2. Adicionar membros existentes ou novos (nome + nascimento bastam para dependentes; `clientStatus = null`).
3. Visão consolidada: apólices por membro, matriz membro × ramo (✔ coberto / — lacuna), prêmio total da família.
4. "Cotar saúde para a família" → abre fluxo de saúde com todos os beneficiários e idades preenchidos.

## 5. Empresa (`/empresas/[id]`)

1. Cadastro por CNPJ (DEMO: manual; futuro: consulta a base pública de CNPJ, a definir provedor).
2. Vínculos: sócios (com %), administradores, funcionários-chave, contatos.
3. Visão: apólices da empresa (saúde PME, RC, empresarial, frota), nº de funcionários → elegibilidade PME, oportunidades pessoais dos sócios (ex.: sócio sem seguro de vida).
4. Ações: cotar saúde PME (beneficiários a partir de planilha de funcionários via Data Import Center), cotar empresarial.

## 6. CRM — pipeline (`/crm`)

1. Kanban com colunas `lead · contato · levantamento · cotação · proposta · negociação · aprovado · emissão · emitido` + área "perdido". Alternância Kanban/Lista; filtros por corretor, ramo, seguradora, origem.
2. Cartão: cliente, ramo (ícone/cor), prêmio estimado, dias no estágio, próximo passo.
3. Arrastar muda estágio (registra `stageHistory`); mover para "perdido" exige motivo.
4. ⚙ Mudanças automáticas: cotação calculada → `cotacao`; proposta enviada → `proposta`; proposta aceita → `aprovado`; apólice emitida → `emitido`.
5. ⚙ Oportunidades nascem de renovação (90 dias), cross-sell e importação, com `origin` visível.

## 7. Cotação de Saúde (`/cotacoes/nova` → Saúde)

Wizard com resumo lateral persistente:

1. **Beneficiários** — escolher cliente/família (pré-preenche) ou adicionar nomes; idade obrigatória.
2. **Idades → faixas ANS** — ⚙ mostra a faixa de cada vida (0-18 … 59+).
3. **Endereço** — do cadastro ou CEP; ⚙ geocodifica para busca de rede por proximidade.
4. **Hospitais desejados** — busca com autocomplete fuzzy (nome/alias), ou "próximos de casa" no mapa; múltipla escolha.
5. **Orçamento** — mensal total (opcional).
6. **Preferências** — segmento (individual/adesão/PME/empresarial), acomodação, coparticipação (sim/não/indiferente), reembolso mínimo, abrangência.
7. **Recomendação** — ⚙ filtra planos elegíveis; calcula preço por vida × faixa; score = cobertura de hospitais desejados (peso alto) + aderência ao orçamento + preferências; mostra "Recomendado" com motivo em texto ("Único plano que inclui os 3 hospitais desejados dentro do orçamento").
8. **Comparação** — 2 a 4 planos lado a lado: preço total e por vida, acomodação, coparticipação, reembolso, abrangência, hospitais desejados ✔/✖ com serviços (internação, PS, maternidade), validade da tabela de rede. "O que muda?" entre dois planos gerado do diff.
9. **Rede** — mapa dos prestadores do plano selecionado, com filtros por tipo/serviço.
10. **Proposta** — selecionar opções + recomendada, descrever necessidade → gera proposta (fluxo 10).

Resultado salvo em `/cotacoes/[id]` com `source` de cada preço (DEMO: "Tabela fictícia DEMO").

## 8. Rede credenciada (`/rede`)

Três modos em abas + mapa (Leaflet/OSM na DEMO):

| Modo | Entrada | Saída |
|---|---|---|
| **Por endereço** | Endereço/CEP + raio (km) + tipo/serviço | Prestadores no raio, com os planos que os atendem; distância |
| **Por plano** | Operadora → plano | Lista + mapa de prestadores, filtros por tipo/especialidade/cidade |
| **Por prestador** | Nome do hospital/clínica (fuzzy, aliases) | Planos que atendem, por serviço (internação, PS, maternidade…) |

**Comparar redes**: selecionar 2–4 planos → matriz prestador × plano (✔/✖ por serviço), contagem de exclusivos e comuns, destaque para os hospitais desejados do cliente. Todo resultado mostra "Fonte: tabela {operadora} · importada em … · válida até …" e alerta quando expirando/expirada.

## 9. Cotação Auto + multicálculo (`/cotacoes/nova` → Auto)

1. Segurado (cliente) e **veículo** (do cadastro, ou novo por placa/FIPE: marca → modelo → ano → versão → ⚙ valor FIPE com mês de referência).
2. Perfil: condutor principal (idade ⚙ calculada pelo nascimento), CEP de pernoite, uso (particular/comercial/aplicativo), garagem casa/trabalho, condutor jovem, classe de bônus.
3. Coberturas: casco (100%/110%/sem), RCF danos materiais/corporais, APP, vidros, carro reserva (0/7/15/30), franquia (reduzida/normal/majorada).
4. **Calcular** → ⚙ dispara em paralelo para os adapters habilitados (DEMO: simulador determinístico por seguradora fictícia). Resultados chegam com status `ok | recusado | erro | manual_pendente`.
5. Tela de resultado: tabela ordenável (prêmio, franquia, coberturas, assistências, comissão* conforme permissão), chips de origem por linha; seguradoras sem integração aparecem como "Cotação manual pendente" com tarefa gerada.
6. Comparador lado a lado + "O que muda?".
7. Gerar proposta.

## 10. Proposta — web / PDF / WhatsApp (`/propostas/[id]`, `/p/[id]`)

1. A partir da cotação: escolher opções (1–4), marcar recomendada, motivo (⚙ sugerido pelo score, ✋ editável), necessidade do cliente, validade.
2. Pré-visualização idêntica à página pública.
3. **Enviar**:
   - **WhatsApp**: DEMO/Fase 1 abre `wa.me/<número>?text=` com mensagem e link; Fase com API: template aprovado (categoria utility) via Cloud API.
   - **Link** copiável; **PDF** (DEMO: imprimir/salvar como PDF do navegador; produção: Chromium headless renderizando a mesma página).
4. `/p/[id]` (público, token não adivinhável, sem dados sensíveis desnecessários): opções, recomendação, coberturas, rede (saúde), botões "Quero esta opção" e "Falar no WhatsApp".
5. ⚙ Visualização registra `viewedAt` e notifica o dono; sem resposta em X dias → follow-up automático.
6. Aceite → status `aceita`, oportunidade → `aprovado`, tarefa de emissão.

## 11. Apólice (`/apolices/[id]`)

1. Origem: proposta aceita (dados já existentes), Document AI (PDF da apólice) ou importação.
2. Dados: número, seguradora, ramo, produto, vigência, prêmio, comissão, bem/beneficiários, plano de saúde; chip de fonte em cada bloco.
3. ⚙ Ao criar/emitir: armazena PDF, vincula ao cliente, cria Renovação (`dueDate = end`), programa comissões previstas, move oportunidade para `emitido`.
4. Abas: documentos, comissões, histórico de alterações, renovação.

## 12. Renovação inteligente (`/renovacoes`)

1. ⚙ Renovação criada na emissão (status `identificada`).
2. ⚙ Janelas (configuráveis, padrão 90/60/30/15/7 dias antes do fim):

| Dias | Ação automática |
|---|---|
| 90 | Cria oportunidade (`origin = renovacao`) e tarefa "Confirmar dados e mudanças com o cliente" |
| 60 | Tarefa "Recotar" + abre cotação pré-preenchida com dados da apólice atual |
| 30 | Tarefa "Enviar proposta de renovação" (prioridade alta se ainda não enviada) |
| 15 | Alerta ao dono e ao gestor; follow-up se proposta sem resposta |
| 7 | Alerta crítico; item fixo no topo da Central de Operações |

3. Checklist: confirmar dados · registrar mudanças (veículo, endereço, dependentes) · recotar · enviar proposta · emitir.
4. Desfecho: `renovada` (nova apólice com `renewedFromId`) ou `nao_renovada` (motivo).
5. Lista com filtros por janela, ramo, corretor, status; prêmio em risco agregado.

## 13. Document AI (`/documentos`)

1. **Documento chega**: upload, e-mail (futuro), WhatsApp (futuro) ou importação.
2. ⚙ **IA lê**: extração de texto (DEMO: documentos de texto; produção: PDF texto/OCR).
3. ⚙ **Classifica** (apólice, proposta, boleto, carteirinha, CRLV…), com confiança.
4. ⚙ **Identifica o cliente**: CPF/CNPJ → nº de apólice → nome fuzzy; mostra método e confiança.
5. ⚙ **Extrai** campos com confiança por campo (indicador visual).
6. ⚙ **Sugere** um diff: "Criar apólice 123… para Maria Souza" ou "Atualizar vigência de X para Y".
7. ✋ **Humano confirma** — obrigatório se confiança < limiar (padrão 0,85) ou campo crítico (CPF, nº apólice, vigência, prêmio); pode editar valores.
8. ⚙ **Atualiza** entidades com proveniência `document-ai` + `FieldProvenance` + auditoria.
9. ⚙ **Renovação programada** (se apólice) e comissões previstas.

## 14. Data Import Center (`/importar`)

1. **Upload** CSV/XLSX; escolha do destino (clientes PF, empresas, apólices, veículos, rede, comissões).
2. **Colunas**: ⚙ detecção de cabeçalho e sugestão de mapeamento por similaridade de nome e amostra ("CPF/CNPJ", "Dt Nasc" → `birthDate`); ✋ ajustar.
3. **Matching**: ⚙ por CPF/CNPJ, nº de apólice, placa; fuzzy por nome+nascimento.
4. **Duplicados**: dentro do arquivo e contra a base — escolher "atualizar", "criar novo" ou "ignorar" (em lote ou linha a linha).
5. **Preview**: primeiras linhas normalizadas (datas, moeda, CPF formatado).
6. **Validação**: erros bloqueantes (CPF inválido, data impossível) × avisos (telefone sem DDD).
7. **Importação** (job em background em produção).
8. **Relatório**: criados / atualizados / ignorados / com erro; download dos erros; botão **Reverter importação**.

## 15. Importador de rede (`/importar` → Rede, `/rede`)

1. Upload da tabela da operadora (XLSX/CSV; PDF → extração tabular assistida), escolha da operadora/planos e **validade**.
2. Mapeamento de colunas (nome, CNPJ/CNES, endereço, cidade, tipo, serviços, planos).
3. ⚙ **Dedupe fuzzy de prestadores**:
   - chave forte: CNES ou CNPJ → match direto;
   - senão: nome normalizado (sem acento, minúsculo, sem stopwords "hospital", "hosp.", "unidade", "s/a") + similaridade trigram ≥ 0,6 **e** mesma cidade **e** distância geográfica < 300 m (quando houver coordenadas);
   - 0,45–0,6 ou conflito → fila de revisão ✋ ("'Hosp. Sta. Clara – Unid. Centro' = 'Hospital Santa Clara'?").
4. Match aceito vira **alias** do prestador canônico (aprende para próximas importações).
5. ⚙ Cria `NetworkDataSource` (validade, confiança) e vínculos `PlanProvider` com serviços.
6. Relatório: prestadores novos, vinculados, aliases criados, pendentes de revisão; diff contra a tabela anterior ("12 prestadores saíram do plano X").

## 16. Especializada AI (`/ai`)

1. Caixa de pergunta com sugestões ("Quem vence nos próximos 30 dias?", "Clientes com auto sem residencial", "Quais planos atendem o Hospital X?", "Propostas aguardando resposta", "Previsão de comissão do próximo mês").
2. ⚙ Identifica intenção → chama ferramenta(s) determinísticas (`policiesExpiring(30)`, `crossSellGaps('auto','residencial')`…).
3. Resposta: texto curto + tabela de linhas + **fonte** ("Fonte: apólices vigentes · consulta de hoje 08:41") + ações (abrir, criar tarefas em lote, rascunhar WhatsApp ✋).
4. Respeita RBAC (corretor restrito vê só a própria carteira). Se não entende: diz que não sabe e sugere perguntas — nunca inventa.

---

## 17. Jornadas ponta a ponta (roteiros de aceite)

Executáveis na DEMO com dados fictícios. Cada passo tem resultado esperado verificável.

### Jornada SAÚDE — "Família Almeida quer plano com o hospital perto de casa"

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login como **Corretor** | Aterrissa em `/operacoes` com fila do dia |
| 2 | `N` → Pessoa: cadastrar titular com CPF, nascimento, CEP; adicionar cônjuge e 2 filhos | Endereço autopreenchido; família criada com 4 membros e papéis |
| 3 | Na família: "Cotar saúde" | Wizard abre com 4 beneficiários e faixas ANS corretas |
| 4 | Endereço do cadastro; escolher 2 hospitais desejados pelo nome (testar digitação com erro/abreviação) | Fuzzy encontra os hospitais |
| 5 | Orçamento R$ X; apartamento; coparticipação indiferente | Planos filtrados; um "Recomendado" com motivo |
| 6 | Comparar 3 planos | Hospitais desejados ✔/✖; "O que muda?" coerente com a tabela |
| 7 | Abrir rede do recomendado no mapa | Prestadores plotados; fonte e validade visíveis |
| 8 | Gerar proposta com 3 opções | `/p/[id]` exibe as opções; botão WhatsApp com mensagem e link |
| 9 | Abrir `/p/[id]` (simula cliente) e aceitar | Status `aceita`; oportunidade → `aprovado`; tarefa de emissão criada |
| 10 | Registrar apólice a partir da proposta | Renovação criada; comissões previstas; oportunidade → `emitido`; horas economizadas incrementadas |

### Jornada AUTO — "Renovação de auto com multicálculo"

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Em `/renovacoes`, filtrar janela 30 dias | Apólice auto fictícia listada com tarefa automática |
| 2 | "Recotar" | Cotação auto pré-preenchida com veículo, condutor, CEP, coberturas da apólice atual |
| 3 | Alterar CEP de pernoite (cliente mudou) | Mudança registrada no checklist da renovação |
| 4 | Calcular | ≥ 4 resultados com origem por linha; ≥ 1 "manual pendente" gera tarefa |
| 5 | Comparar atual × melhor oferta | "O que muda?" lista diferenças de prêmio/franquia/coberturas |
| 6 | Proposta → enviar por WhatsApp | Status `enviada`; follow-up agendado |
| 7 | Simular upload do PDF da nova apólice em `/documentos` | Document AI identifica o cliente, extrai nº/vigência/prêmio, pede confirmação |
| 8 | Confirmar | Nova apólice com `renewedFromId`; renovação `renovada`; nova renovação criada para o próximo ciclo |

### Jornada EMPRESA — "PME com sócios e funcionários"

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | `/importar` → Empresas + Pessoas: subir planilha fictícia com empresa, 2 sócios, 10 funcionários (com 1 duplicado proposital) | Mapeamento sugerido; duplicado detectado; relatório final |
| 2 | Abrir `/empresas/[id]` | Vínculos sócio (%)/funcionário; elegibilidade PME |
| 3 | Cotar saúde PME com os funcionários como beneficiários | Faixas ANS calculadas em lote; planos PME |
| 4 | Ver lacunas | Sugestões: RC/empresarial para a empresa; vida para os sócios |
| 5 | Perguntar na Especializada AI: "Quais sócios de empresas clientes não têm seguro de vida?" | Tabela com fonte; ação "criar tarefas" |
| 6 | Como **Financeiro**: `/comissoes` | Comissões previstas das apólices da jornada; corretor não vê comissões de outros (RBAC) |
| 7 | Como **Admin**: `/configuracoes` → Auditoria | Importação, revelações de CPF e mudanças registradas |
