# Análise de Segurança da Informação — Especializada Seguros OS

Data: 07/10/2026 · Escopo: DEMO atual (código no repositório) + arquitetura planejada para produção · Complementa [SECURITY_LGPD.md](SECURITY_LGPD.md).

## 1. Veredito

| Pergunta | Resposta |
|---|---|
| A **DEMO** pode ser publicada (link para a equipe testar)? | **Sim**, desde que continue só com dados fictícios. Todos os achados da DEMO foram corrigidos (seção 4). Ela não tem login real e guarda dados no navegador — por isso **não pode receber dados reais**. |
| O sistema pode receber **dados reais de clientes** hoje? | **Não.** Faltam os controles de produção: servidor, banco, login com 2FA, permissões no servidor, criptografia, auditoria imutável, backups (seção 7, Portão 1). |
| Qual é o risco mais grave do negócio? | Vazamento de dados de saúde e CPF (dado sensível pela LGPD) por acesso indevido — conta comprometida, exportação em massa ou integração mal protegida. |

## 2. Método

- Revisão manual do código (todas as telas, casos de uso, integrações).
- Varredura de padrões perigosos (HTML injetado, `eval`, links externos, segredos no código, uso de armazenamento local).
- Auditoria de dependências (`npm audit`).
- Verificação dos cabeçalhos HTTP em execução e testes no navegador (35 rotas + 18 etapas de jornadas) com a política de segurança de conteúdo ativa.
- Modelo de ameaças STRIDE por componente.
- Referências: OWASP Top 10 (2021), OWASP API Security Top 10 (2023), OWASP Top 10 para aplicações com LLM, OWASP ASVS, LGPD, normas SUSEP (aplicabilidade a corretoras **a confirmar com jurídico**).

## 3. Dados tratados e classificação

| Classe | Exemplos | Regra |
|---|---|---|
| **Restrito** | Dados de saúde (beneficiários, idades, hospitais e médicos preferidos, DPS), CPF completo, documentos pessoais, credenciais das seguradoras | Criptografia de campo, acesso mínimo, toda visualização auditada, nunca em e-mail/WhatsApp sem link autenticado |
| **Confidencial** | Apólices, prêmios, comissões, propostas, endereços, telefones, carteira de cada corretor | Acesso por perfil e carteira, exportação restrita e auditada |
| **Interno** | Tarefas, métricas, configurações | Somente usuários autenticados |
| **Público** | Catálogo de seguradoras, conteúdo institucional | Sem restrição |

Dados de saúde são **dado pessoal sensível** (LGPD art. 11) e merecem relatório de impacto (RIPD) antes da produção.

## 4. Achados no código atual e status

| ID | Severidade | Achado | Status |
|---|---|---|---|
| SEC-01 | Alta | **XSS no mapa**: nomes de prestadores (que podem vir de planilha importada) eram inseridos como HTML nos balões do mapa. Um nome malicioso executaria script no navegador do usuário. | **Corrigido** — escape de HTML (`src/lib/security.ts`), teste automático |
| SEC-02 | Média | **Injeção de fórmula em CSV**: relatórios exportados com células começando por `=`, `+`, `-`, `@` poderiam executar fórmulas ao abrir no Excel. | **Corrigido** — células neutralizadas, teste automático |
| SEC-03 | Média | Faltavam **CSP, HSTS e COOP**. | **Corrigido** — CSP restrita (só mapas e fontes autorizados), HSTS 2 anos, `frame-ancestors 'none'`, COOP, Permissions-Policy |
| SEC-04 | Média | Dependência com vulnerabilidade conhecida (PostCSS dentro do Next.js; GHSA-qx2v-qp2m-jg93 e outras). | **Corrigido** — versão segura forçada; `npm audit`: **0 vulnerabilidades** |
| SEC-05 | Baixa | Uploads sem limite de tamanho (documentos, planilhas, extratos, rede). | **Corrigido** — limites de 15 MB (documentos), 2 MB (texto lido), 5 MB (planilhas) |
| SEC-06 | Crítica *para produção* / aceita na DEMO | Dados, "login" e permissões ficam **no navegador**; auditoria é editável; qualquer pessoa com acesso ao computador vê os dados. | **Por projeto da DEMO** — bloqueador do Portão 1 (servidor + banco + 2FA + permissões no servidor) |
| SEC-07 | Média | Página pública da proposta (`/p/...`) usa identificador previsível nos dados de exemplo. | Na DEMO não expõe nada (lê só o navegador local). **Produção:** link com token assinado, expiração, revogação, sem CPF na página |
| SEC-08 | Baixa (privacidade) | Fontes do Google e mapas OpenStreetMap recebem o IP do usuário e a região consultada. | **Produção:** fontes hospedadas no próprio servidor; provedor de mapas com contrato (DPA) |
| SEC-09 | Informativo | CSP ainda permite script inline (necessário ao Next.js sem nonce). | **Produção:** CSP com nonce por requisição |
| SEC-10 | Informativo | Texto de documentos guardado junto do registro na DEMO. | **Produção:** arquivos em storage privado e cifrado, URLs assinadas de curta duração |

**Controles que já estão certos:** CPF mascarado nas listas e visualização completa registrada; comissões restritas ao administrador; revisão humana obrigatória para campos críticos do Document AI e da importação; nada é sobrescrito sem registro; credenciais de seguradoras só no servidor; logs de integração com CPF/e-mail/telefone mascarados; integrações sem scraping; WhatsApp por link oficial (nenhuma chave no navegador); site marcado para não ser indexado.

## 5. Modelo de ameaças (STRIDE)

| Componente | Ameaças principais | Controles de produção |
|---|---|---|
| Login e sessão | Senha vazada, phishing, sessão roubada | SSO Google/Microsoft + **2FA obrigatório para todos**, sessão de 8 h e inatividade de 30 min, cookies `HttpOnly`/`Secure`/`SameSite`, bloqueio por tentativas, alerta de login novo |
| Telas e APIs internas | Acesso a cliente de outro corretor (IDOR), elevação de privilégio, injeção | Permissão e carteira checadas **no servidor** em toda ação, Row-Level Security no Postgres, validação de entrada (zod), ORM parametrizado, proteção CSRF das server actions |
| Banco de dados | Vazamento, adulteração | Rede privada sem IP público, criptografia em repouso (KMS), campos sensíveis cifrados (CPF/saúde) com hash para busca, usuário de aplicação com mínimo privilégio, auditoria append-only |
| Documentos (storage) | Link vazado, malware no upload | Bucket privado, URLs assinadas de minutos, antivírus e checagem do tipo real do arquivo, limite de tamanho, retenção automática |
| Integrações com seguradoras | Credencial vazada, SSRF, resposta adulterada | Cofre de segredos com rotação, mTLS/OAuth2, lista fixa de destinos de saída, timeouts e circuit breaker, validação de toda resposta (valor inválido vira erro, nunca número inventado), logs mascarados |
| WhatsApp e e-mail | Mensagem para pessoa errada, golpe se passando pela corretora | Opt-in registrado, templates aprovados, confirmação do destinatário, documentos só por link autenticado, SPF/DKIM/DMARC `p=reject` no domínio |
| IA (Especializada AI / Document AI) | Prompt injection escondido em documento, vazamento para o provedor, resposta inventada | Ferramentas da IA só de leitura e com permissão do usuário, confirmação humana para gravar, envio mínimo de dados, contrato sem treino e com retenção zero quando disponível, números sempre vindos do banco |
| Página pública da proposta | Enumeração de links, exposição de dados | Token aleatório assinado, expiração, revogação, sem CPF/saúde, limitação de taxa, `noindex` |
| Importação de carteira e rede | Planilha com conteúdo malicioso, importação errada em massa | Escape de conteúdo, neutralização de fórmulas, prévia + validação + confirmação, relatório e possibilidade de desfazer |
| Exportações e relatórios | Exportação em massa por funcionário ou conta invadida | Permissão específica, limite por dia, auditoria, alerta ao administrador, marca d'água com usuário e data |
| Administração e infraestrutura | Conta admin comprometida, erro de configuração | Contas admin separadas, 2FA com chave física, infraestrutura como código, ambientes separados (produção sem acesso direto), revisão de mudanças |
| Backups | Ransomware, perda de dados | Backups cifrados e imutáveis, cópia em outra região, teste de restauração mensal |

## 6. Controles exigidos para produção (por domínio)

**Identidade e acesso** — 2FA para todos; SSO; perfis com mínimo privilégio (já modelados); carteira restrita por padrão (já decidido); revisão trimestral de acessos; desligamento remove acesso no mesmo dia; conta de emergência guardada pelo administrador.

**Proteção de dados** — TLS 1.2+ em tudo; criptografia em repouso; criptografia de campo para CPF e saúde; mascaramento por padrão; ambientes de teste **sem dados reais** (só fictícios ou anonimizados); política de retenção já definida (Configurações → Retenção).

**Segurança da aplicação (OWASP Top 10)** — controle de acesso no servidor; validação de toda entrada; consultas parametrizadas; CSP com nonce; limitação de taxa em login, busca, exportação e página pública; uploads com antivírus; dependências monitoradas (Dependabot/`npm audit` no CI); análise estática (CodeQL/Semgrep) e varredura de segredos a cada mudança; revisão de código obrigatória; **pentest externo antes do go-live** e anual.

**APIs e integrações (OWASP API Top 10)** — autenticação forte por integração; autorização por objeto; limites de taxa; inventário de integrações; lista de destinos permitidos; contratos com cláusulas LGPD com cada seguradora e fornecedor.

**IA** — sem acesso de escrita sem confirmação humana; dados mínimos; DPA com o provedor; avaliação periódica de respostas; registro de cada consulta.

**Infraestrutura e rede** — hospedagem no Brasil ou transferência internacional adequada (LGPD art. 33); WAF e proteção contra DDoS; banco e storage sem acesso público; acesso administrativo só por SSO/VPN; segmentação entre aplicação, banco e jobs; egress controlado; ambientes separados.

**Monitoramento e resposta** — logs centralizados com alertas para: login suspeito, muitas falhas de senha, exportação grande, acesso a muitos clientes em pouco tempo, erro em integração; trilha de auditoria imutável por 5 anos; plano de resposta a incidentes com comunicação à ANPD e aos titulares (prazo regulamentar de 3 dias úteis — **a confirmar com jurídico**).

**Continuidade** — backups diários cifrados e imutáveis, retenção de 35 dias; proposta de RPO 24 h e RTO 4 h; teste de restauração mensal.

**Pessoas e processos** — política de segurança e termo de confidencialidade; treinamento LGPD e anti-phishing (com simulações); computadores com disco cifrado, bloqueio de tela, antivírus e atualizações; gerenciador de senhas; **proibido usar WhatsApp pessoal para documentos de clientes** (usar o canal oficial); classificação da informação na rotina.

**Fornecedores** — due diligence e DPA com hospedagem, banco, storage, provedor de IA, WhatsApp e e-mail; lista de suboperadores publicada na política de privacidade.

**Conformidade** — encarregado (DPO) nomeado; registro das operações de tratamento; RIPD para dados de saúde; política de privacidade e de cookies; canal para direitos do titular; verificar com o jurídico se as normas de segurança cibernética da SUSEP para entidades supervisionadas alcançam a corretora e o que as seguradoras parceiras exigem em contrato.

## 7. Plano por portões

**Portão 0 — Publicar a DEMO (pronto)**
- [x] Achados SEC-01 a SEC-05 corrigidos e testados
- [x] Dependências sem vulnerabilidades conhecidas
- [x] Cabeçalhos de segurança e `noindex`
- [x] Aviso permanente de DEMO e proibição de dados reais
- [ ] Publicar com link restrito (proteção por senha do provedor de hospedagem recomendada)

**Portão 1 — Piloto com dados reais (bloqueadores)**
- [ ] Servidor + Postgres (schema já desenhado) com permissões e carteira checadas no servidor e RLS
- [ ] Login SSO + 2FA obrigatório, sessões seguras
- [ ] Criptografia em repouso e de campo (CPF/saúde)
- [ ] Storage privado com URLs assinadas e antivírus
- [ ] Auditoria append-only e alertas básicos
- [ ] Backups cifrados com restauração testada
- [ ] Página pública da proposta com token assinado e expiração
- [ ] DPO nomeado, RIPD, política de privacidade, DPAs com fornecedores
- [ ] Pentest externo sem achados críticos ou altos abertos

**Portão 2 — Produção plena**
- [ ] CSP com nonce, WAF, limitação de taxa em todos os pontos sensíveis
- [ ] Monitoramento com alertas de exportação e acesso anômalo
- [ ] Treinamento da equipe e política de dispositivos
- [ ] Revisão trimestral de acessos e teste anual de incidentes

## 8. Principais riscos residuais

| Risco | Probabilidade | Impacto | Tratamento |
|---|---|---|---|
| Conta de funcionário invadida (phishing) | Média | Alto | 2FA, alertas de login, carteira restrita, limite de exportação |
| Funcionário exporta carteira ao sair | Média | Alto | Permissão de exportação, auditoria, marca d'água, desligamento imediato |
| Dados de clientes trafegando no WhatsApp pessoal | Alta | Alto | Canal oficial integrado, política e treinamento |
| Vazamento por fornecedor (IA, hospedagem, BSP) | Baixa | Alto | DPA, dados mínimos, criptografia, avaliação periódica |
| Integração com seguradora mal configurada | Média | Médio | Cofre de segredos, validação de respostas, lista de destinos |
| Ransomware no escritório | Média | Alto | Sistema na nuvem, backups imutáveis, nenhum arquivo de cliente salvo no computador |
| Uso da DEMO com dados reais por engano | Média | Médio | Aviso permanente, treinamento, publicação com link restrito |
