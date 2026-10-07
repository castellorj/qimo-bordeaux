# Automation Engine

Rota: `/automacoes`. Tipos: `Automation`, `AutomationExecution` em [`types.ts`](../src/domain/types.ts); tabelas `automations`, `automation_executions` no [schema](../prisma/schema.prisma).

## 1. Modelo: TRIGGER + CONDIÇÃO + AÇÃO

```
QUANDO  <trigger>               policy.created | policy.days_to_end | proposal.sent_no_reply |
                                document.received | client.created | policy.issued | task.overdue
SE      <condições> (AND)       [{ field, op: eq|lte|gte|in, value }]   ex.: line in [auto, saude]; days lte 30
ENTÃO   <ações> (em ordem)      create_renewal | create_task | create_follow_up | classify_document |
                                check_cross_sell | schedule_commission | notify_owner
```

- **Triggers de evento** (`policy.created`, `document.received`, `client.created`, `policy.issued`) são emitidos pelos application services após commit (padrão *outbox*: evento gravado na mesma transação, publicado no pg-boss).
- **Triggers temporais** (`policy.days_to_end`, `proposal.sent_no_reply`, `task.overdue`) são avaliados por um job agendado diário (07h, fuso America/Sao_Paulo) que varre o banco com consultas indexadas.
- Condições operam sobre um **contexto tipado** do evento (ex.: `policy.line`, `policy.annualPremium`, `days`, `proposal.daysSinceSent`).
- Ações são funções do domínio/aplicação, idempotentes, com parâmetros declarados.

## 2. Automações nativas (`system: true` — podem ser desativadas, não apagadas)

| # | Nome | Trigger | Condições | Ações | Min. economizados/exec.* |
|---|---|---|---|---|---|
| 1 | Apólice criada → criar renovação | `policy.created` | status = vigente | `create_renewal` (dueDate = fim da vigência, checklist padrão do ramo) | 5 |
| 2 | Janelas de renovação | `policy.days_to_end` | days ∈ `renewalWindows` (90/60/30/15/7) e renovação não concluída | 90: oportunidade (`origin=renovacao`) + tarefa "confirmar dados"; 60: tarefa "recotar" + cotação pré-preenchida (rascunho); 30: tarefa "enviar proposta"; 15: `notify_owner` + gestor; 7: alerta crítico | 10 (90/60), 3 (30/15/7) |
| 3 | Proposta sem resposta → follow-up | `proposal.sent_no_reply` | status ∈ {enviada, visualizada} e dias ≥ `followUpDays` | `create_follow_up` (tarefa + rascunho de WhatsApp para o corretor revisar) | 4 |
| 4 | Documento recebido → Document AI | `document.received` | mime suportado | `classify_document` → extração → sugestão; status `aguardando_revisao` se exigir humano | 12 (apólice), 3 (outros) — creditado na confirmação |
| 5 | Cliente novo → cross-sell | `client.created` (e mensal para a base) | regras do módulo do ramo; sem sugestão aberta do mesmo ramo; sem recusa nos últimos 6 meses | `check_cross_sell` → até 1 tarefa por cliente/ramo (nunca mensagem automática ao cliente) | 2 |
| 6 | Apólice emitida → pós-emissão | `policy.issued` | — | armazenar documento, extrair (se PDF), atualizar cliente (status `ativo`, `clientSince`), `create_renewal`, `schedule_commission` (parcelas previstas por competência), oportunidade → `emitido` | 15 |
| 7 | Tarefa vencida → alerta | `task.overdue` | atraso ≥ 1 dia | `notify_owner`; após 3 dias, gestor | 1 |

**Janelas por ramo:** `Settings.renewalWindows` define as janelas globais; `ProductModule.renewalLeadDays` (em `products.ts`) indica quando o processo deve começar por ramo (ex.: saúde 60, auto 45, residencial 30, viagem/previdência 0 = sem renovação automática). Proposta: a janela inicial é `min(90, renewalLeadDays)` e as demais seguem a lista global — **a validar com a equipe**.

\* Valores iniciais propostos; calibrar com a equipe (ver métrica em [PRODUCT_SPEC §2](PRODUCT_SPEC.md)).

### Regras de cross-sell (exemplos, sem spam)

| Tem | Não tem | Sugestão |
|---|---|---|
| auto | residencial | Residencial (mesmo endereço) |
| saúde (titular com dependentes) | vida | Vida para o titular |
| empresa cliente (PME) | rc / empresarial | RC/Empresarial |
| sócio de empresa cliente | vida | Vida para o sócio |
| residencial em imóvel alugado (`use = aluguel`) | fiança | Fiança locatícia (se perfil proprietário: avaliar) |
| viagem recorrente | — | Viagem anual |

Limites: no máximo 1 sugestão aberta por cliente/ramo; não sugerir se recusada nos últimos 6 meses; respeitar consentimento de marketing para qualquer contato; tarefas de cross-sell têm prioridade baixa na Central de Operações.

## 3. Idempotência

- Toda execução tem `idempotencyKey` determinística, única por automação (`UNIQUE (automation_id, idempotency_key)`):
  - `policy.created:{policyId}`
  - `policy.days_to_end:{policyId}:{90|60|30|15|7}`
  - `proposal.sent_no_reply:{proposalId}:{n}` (n = número do follow-up)
  - `document.received:{documentId}:{sha256}`
- Efeitos colaterais também são idempotentes: `Renewal` único por apólice; `Task.dedupeKey` (ex.: `renewal:{policyId}:d30`); comissões únicas por `(policyId, competence, installment)`.
- Execução repetida (retry do job, varredura diária sobreposta, reprocessamento) resulta em status `ignorada` com `minutesSaved = 0`.
- Job temporal "pega" janelas perdidas (se o sistema ficou fora, a janela de 30 dias é disparada no dia 29) sem duplicar.

## 4. Log de execução (`AutomationExecution`)

Cada execução grava: automação, chave, data/hora, status (`sucesso | ignorada | falha | aguardando_revisao`), resumo legível ("Renovação criada para apólice AUT-0042 · vence 15/01/2027"), referências (`[{type:'policy',id}, {type:'task',id}]`), minutos economizados, erro, id do job. Também gera `AuditLog(source='automacao')` para cada entidade alterada.

UI `/automacoes`: lista de automações (ativa/inativa, execuções no mês, horas economizadas) e, por automação, o histórico com links para as entidades.

## 5. Human-in-the-loop

| Situação | Comportamento |
|---|---|
| Dados críticos (CPF, nº de apólice, vigência, prêmio, coberturas, dados de saúde) vindos de IA/importação | Nunca aplicados sem confirmação se confiança < limiar ou campo crítico → status `aguardando_revisao` + tarefa `revisao` |
| Mensagens ao cliente | Automação só **rascunha**; envio exige clique humano (exceto templates *utility* explicitamente aprovados pelo gestor, ex.: lembrete de vencimento com consentimento) |
| Mudança de estágio para `perdido` | Nunca automática |
| Cotação de renovação | Criada como rascunho; cálculo e envio são humanos |
| Falha de ação | Retry com backoff (3×); depois `falha` + tarefa para o responsável |

## 6. Métrica de horas economizadas

`minutesSaved` por execução bem-sucedida (ou confirmada, no caso do Document AI) alimenta o Dashboard: soma por período, por automação e por usuário beneficiado. Execuções `ignorada`/`falha` contam zero. A tela mostra o baseline usado (fonte) para cada tipo.

## 7. Automações personalizadas (Fase 4)

Construtor visual restrito aos triggers/ações do catálogo (sem código arbitrário), com simulação ("esta regra teria disparado 23 vezes no último mês") antes de ativar. Permissão `automations.manage`.

## 8. Visão futura: orquestrações em lote

Exemplo: **"Renove todos os seguros que vencem nos próximos 30 dias."**

1. Usuário pede na Especializada AI ou em `/renovacoes` → seleção em lote.
2. O orquestrador cria um **lote** (job pai) e, para cada apólice: confirma dados atuais, aplica mudanças registradas, monta o pedido de cotação a partir da apólice vigente, dispara o multicálculo (adapters disponíveis), gera o comparativo e o rascunho de proposta com recomendação e motivo, e rascunha a mensagem ao cliente.
3. **Nada é enviado nem emitido**: tudo cai numa fila de revisão ("18 renovações prontas para revisão · 3 com pendência de dados · 2 seguradoras sem integração → tarefas manuais").
4. O corretor revisa item a item (aprovar e enviar / editar / descartar), com atalhos de teclado.
5. Log completo do lote, com horas economizadas estimadas.

Pré-requisitos: multicálculo real (integrações próprias com as seguradoras), WhatsApp API, Document AI em produção.
