# Segurança e LGPD

> Este documento é técnico-operacional e **não substitui parecer jurídico**. Pontos marcados **(a confirmar com jurídico)** dependem de validação do encarregado/advogado da corretora.

## 0. DEMO

A DEMO (Fase 0) armazena **apenas dados fictícios** no `localStorage` do navegador, sem autenticação real, sem cifragem e sem auditoria confiável. **Nunca inserir dados reais de clientes na DEMO.** O banner "DEMO" permanente e o fato de todo registro carregar `demo: true` existem para evitar confusão. Nomes de seguradoras, operadoras e hospitais são fictícios.

## 1. Papéis LGPD

| Papel | Quem |
|---|---|
| Controlador | Especializada Seguros (decide finalidades: venda, renovação, atendimento) — em alguns fluxos atua em conjunto ou ao lado da seguradora, que também é controladora dos dados do contrato **(a confirmar com jurídico)** |
| Operadores | Fornecedores de infraestrutura e serviços: hospedagem, banco, storage, BSP de WhatsApp, provedor de LLM/OCR, agregador de multicálculo, geocodificação |
| Encarregado (DPO) | A nomear pela corretora; contato publicado no site e na página pública de proposta |

Cada operador precisa de **contrato/DPA** com cláusulas LGPD e, quando houver **transferência internacional** (ex.: LLM ou OCR fora do Brasil), mecanismo adequado conforme a regulamentação da ANPD (Res. CD/ANPD 19/2024 — cláusulas-padrão) **(a confirmar com jurídico)**.

## 2. Categorias de dados e bases legais (art. 7º e art. 11)

| Categoria | Exemplos | Finalidade | Base legal proposta |
|---|---|---|---|
| Identificação e contato | Nome, CPF, nascimento, telefone, e-mail, endereço | Cotar, contratar, renovar, atender | Procedimentos preliminares e execução de contrato (art. 7º, V) |
| Dados de bens | Veículo, placa, imóvel | Cotação/apólice | Execução de contrato (art. 7º, V) |
| Dados de terceiros na apólice | Dependentes, condutores, beneficiários | Contratação em favor do titular | Execução de contrato; informar o titular sobre o dever de ciência dos terceiros **(a confirmar)** |
| **Dados de saúde** (DPS, doenças preexistentes, CIDs, carteirinhas) — **dado pessoal sensível** | Proposta de saúde/vida | Contratação de plano/seguro | Art. 11: **consentimento específico e destacado** (II-a) ou, quando aplicável, execução de contrato/exercício regular de direitos (art. 11, II-d) — **base exata a confirmar com jurídico**; tratamento mínimo |
| Dados financeiros | Prêmio, forma de pagamento, comissões | Contrato, conciliação | Execução de contrato; obrigação legal/regulatória (art. 7º, II) |
| Marketing | Ofertas, cross-sell por WhatsApp/e-mail | Prospecção | **Consentimento** (art. 7º, I) — opt-in por canal, revogável; legítimo interesse só para comunicação a clientes ativos sobre produtos relacionados, com LIA documentada e opt-out **(a confirmar)** |
| Logs e auditoria | IP, ações, acessos | Segurança, prestação de contas | Legítimo interesse (art. 7º, IX) e obrigação legal |
| Uso da IA | Perguntas, ferramentas chamadas | Operação, melhoria, auditoria | Legítimo interesse; minimização |

### Consentimento para marketing via WhatsApp
- Opt-in separado por canal e finalidade (`ConsentRecord`: `marketing_whatsapp`, `marketing_email`), com texto exibido, canal, data e evidência; revogação a qualquer momento ("SAIR" no WhatsApp gera revogação automática).
- Também é exigência da política da Meta: opt-in claro, identificando a empresa (ver [INTEGRATIONS §4.1](INTEGRATIONS.md)).
- Automação de cross-sell **nunca envia** mensagem de marketing sem consentimento ativo; por padrão gera **tarefa** para o corretor.

## 3. Minimização

- Cotação de saúde: idade (não data de nascimento) dos beneficiários quando suficiente.
- Listagens mostram CPF mascarado; revelação exige permissão e gera `view_sensitive` na auditoria.
- Página pública de proposta (`/p/[token]`) não exibe CPF, endereço completo nem dados de saúde.
- Dados de saúde não entram em busca global, relatórios agregados, logs nem prompts de LLM.
- Payloads enviados a provedores de IA: apenas os campos necessários; identificadores substituídos por pseudônimos quando possível.

## 4. Retenção — decisão do cliente: "de acordo com a LGPD"

A LGPD **não fixa prazos**: cada dado é mantido enquanto houver finalidade, obrigação legal/regulatória ou necessidade de exercício regular de direitos, e depois é **eliminado ou anonimizado** (arts. 15 e 16). A política padrão abaixo está implementada em `src/domain/engines/retention.ts` e visível em **Configurações → Retenção de dados** (na DEMO a tela só simula; nada é apagado). **Validar os prazos com jurídico/DPO antes da produção.**

| Dado | Prazo | Conta a partir de | Ao final | Base legal / racional |
|---|---|---|---|---|
| Cadastro de clientes ativos | Enquanto durar a relação | — | manter | Execução de contrato (art. 7º, V) |
| Apólices, propostas aceitas, documentos contratuais, comissões | **mín. 5 anos** | Fim da última vigência | anonimizar | Obrigação legal/regulatória e defesa de direitos (art. 7º, II e VI; art. 16, I). A guarda de documentos regulada pela SUSEP (Circular 605/2020) pode exigir prazos maiores para certos documentos; a Lei 15.040/2024 afeta prazos prescricionais — **confirmar** |
| Dados de saúde de cotações não convertidas (beneficiários, idades, hospitais/médicos preferidos) | 6 meses | Última atualização da cotação | excluir | Dado sensível (art. 11): minimização (art. 6º, III) |
| Leads não convertidos | 24 meses | Último contato/cotação | anonimizar | Legítimo interesse/consentimento (art. 7º, IX e I) |
| Consentimento de marketing (WhatsApp/e-mail) | Até a revogação; prova do opt-in/out por 5 anos | — | manter | Consentimento (art. 8º) e prestação de contas (art. 6º, X) |
| Documentos pessoais de ex-clientes (RG, CNH, comprovantes) | 5 anos | Fim da última vigência | excluir | Necessidade e defesa de direitos |
| Logs de auditoria e de acesso | 5 anos (mín. legal de 6 meses para registros de acesso — Marco Civil, art. 15) | Registro | excluir | Segurança e prestação de contas (arts. 6º, 37, 46) |
| Mensagens WhatsApp/e-mail (conteúdo) | Acompanham o registro relacionado (apólice: 5 anos após a vigência; lead: 24 meses) | — | conforme registro | Finalidade |
| Backups | Rotação de 35 dias | — | excluir | Itens expurgados não são restaurados para uso |

Implementação: job mensal (pg-boss) gera a lista, o encarregado aprova, o sistema anonimiza/exclui (banco + storage) e registra na auditoria; *legal hold* (sinistro, processo, pedido de autoridade) suspende o prazo do titular afetado.

## 5. Direitos do titular (art. 18) — suporte no sistema

| Direito | Como o sistema atende |
|---|---|
| Confirmação e **acesso** | `DataSubjectRequest(acesso)` → relatório gerado do Cliente 360 (dados, origem/proveniência, compartilhamentos) |
| **Correção** | Edição com auditoria; proveniência atualizada para `manual` |
| Anonimização, bloqueio, **eliminação** | Job de anonimização respeitando retenções legais; resposta indica o que foi mantido e por quê |
| **Portabilidade** | Exportação JSON/CSV estruturada, disponibilizada por URL assinada com expiração |
| Informação sobre compartilhamento | Lista de seguradoras/operadores com quem os dados foram compartilhados (cotações enviadas, apólices) |
| Revogação de consentimento | Um clique/"SAIR"; efeito imediato nas automações |

Prazo: a LGPD prevê resposta em até 15 dias para declaração completa (art. 19, II); o sistema controla `dueAt` e alerta o encarregado.

## 6. Resposta a incidentes

1. **Detecção**: alertas (login anômalo, exportação em massa, acessos fora do horário, falhas de integridade).
2. **Contenção**: revogar sessões/credenciais, isolar integração, rotacionar segredos.
3. **Avaliação**: dados afetados, titulares, risco (dados de saúde = alto).
4. **Comunicação**: à **ANPD** e aos titulares quando houver risco ou dano relevante — Regulamento de Comunicação de Incidentes (Res. CD/ANPD 15/2024) prevê prazo de **3 dias úteis** **(a confirmar com jurídico)**; comunicar seguradoras parceiras conforme contrato.
5. **Pós-incidente**: relatório, correções, registro em base de incidentes.

Runbook detalhado a produzir na Fase 1-real.

## 7. Controles técnicos

| Controle | Implementação |
|---|---|
| Autenticação | Auth.js v5, sessões em banco (revogáveis), expiração por inatividade, **2FA TOTP obrigatório para admin e financeiro** |
| Autorização | RBAC server-side em todo caso de uso; escopo de carteira por `ownerId`; RLS por `org_id` como defesa em profundidade |
| Cifragem em trânsito | TLS 1.2+ em tudo; HSTS |
| Cifragem em repouso | Banco e storage cifrados pelo provedor |
| **Cifragem por campo** | CPF, chassi, dados de saúde, segredos TOTP: AES-256-GCM com envelope encryption (chave de dados por registro/tabela, chave mestra no KMS); blind index HMAC para busca exata |
| Trilha de auditoria | `audit_log` append-only (REVOKE UPDATE/DELETE); registra quem, quando, o quê, origem (ui/automação/IA/importação) |
| Arquivos | Bucket privado; URLs assinadas ≤ 5 min após checagem de permissão; antivírus no upload; limite de tamanho/tipo |
| Rate limiting | Login, página pública de proposta, APIs e webhooks (por IP e por usuário) |
| Segredos | Secrets manager (ou variáveis do provedor) — **nunca** `NEXT_PUBLIC_*`, nunca no repositório, nunca no banco em claro; rotação |
| Sessões seguras | Cookies `HttpOnly; Secure; SameSite=Lax`; rotação no login; CSRF nativo de Server Actions/Auth.js |
| Backups | Diários + PITR; teste de restauração trimestral; backups cifrados |
| Frontend sem segredos | Chamadas a integrações só no servidor/worker |
| Cabeçalhos | CSP restritiva (nonce em scripts; `img-src` apenas tiles autorizados), `X-Content-Type-Options`, `X-Frame-Options: DENY` (exceto se a proposta precisar ser embutida), `Referrer-Policy`, `Permissions-Policy` — parte já configurada em `next.config.mjs` |
| Webhooks | Verificação de assinatura (ex.: `X-Hub-Signature-256` da Meta) |
| Dependências | Auditoria automática no CI; atualizações regulares |
| Logs | Sem PII; `requestId` |
| IA | Ferramentas aplicam RBAC; prompts sem dados sensíveis; registro em `AiInteraction` |
| Ambientes | Produção isolada; dados reais nunca em dev/staging (usar seed fictício) |

## 8. Considerações SUSEP para corretoras

- A corretora e seus corretores devem estar **regularmente registrados na SUSEP**; o sistema guarda o código SUSEP da organização (`Organization.susepCode`) e pode exibir em propostas **(confirmar exigências de informação obrigatória em materiais de oferta com jurídico)**.
- **Guarda de documentos**: regulada pela SUSEP (Circular SUSEP 605/2020, que revogou a Circular 74/1999) — prazos a confirmar para o caso específico de corretoras.
- **Transparência de comissão**: há normas sobre informação de remuneração da intermediação ao cliente em determinados produtos **(a confirmar com jurídico quais se aplicam)**; o modelo permite exibir ou ocultar comissão na proposta por configuração.
- **Saúde suplementar** é regulada pela **ANS**, não pela SUSEP: corretagem de planos de saúde segue regras da ANS e das operadoras (ex.: venda de planos coletivos por adesão via administradoras) **(a confirmar)**.
- O novo marco legal do contrato de seguro (**Lei 15.040/2024**) trouxe regras sobre deveres de informação e prazos — revisar impactos nos fluxos de proposta/renovação **(a confirmar com jurídico)**.
