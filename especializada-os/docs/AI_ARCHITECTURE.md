# Arquitetura de IA — Especializada AI e Document AI

## 1. Princípios

1. **A IA não inventa dados.** Número, nome, data, preço, rede e comissão vêm sempre do banco ou de uma integração, via código determinístico.
2. **LLM só para linguagem**: entender a pergunta, escolher ferramentas, resumir, redigir rascunhos, extrair campos de documentos (com confiança e revisão).
3. **Toda resposta cita a fonte** (consulta/tabela/documento e data).
4. **Ferramentas aplicam RBAC** — a IA nunca vê mais do que o usuário poderia ver.
5. **Humano confirma** dados críticos e qualquer envio ao cliente.
6. **Provedor trocável** (`LLMProvider`), Claude por padrão.

## 2. Especializada AI (`/ai`) — arquitetura de tool-calling

```
Pergunta (pt-BR)
  → [Orquestrador] LLM com lista de ferramentas tipadas (produção) | motor de intenções determinístico (DEMO)
  → chamada(s) de ferramenta  ──►  Application services / repositórios (RBAC, escopo de carteira)
  ◄── { rows, columns, source: { label, query, at }, total }
  → Resposta: texto curto (LLM só formata o que veio nas linhas) + tabela + fonte + ações sugeridas
  → AiInteraction (log: pergunta, ferramentas, contagem de linhas, fontes; sem PII desnecessária)
```

### Ferramentas

| Ferramenta | Assinatura | Retorna |
|---|---|---|
| `searchClients` | `(query: string, filters?)` | Pessoas/empresas (nome, status, corretor, ramos) |
| `policiesExpiring` | `(days: number, filters?: { line?, ownerId? })` | Apólices com fim em ≤ N dias, prêmio, status da renovação |
| `proposalsAwaiting` | `(minDays?: number)` | Propostas enviadas/visualizadas sem decisão |
| `crossSellGaps` | `(has: ProductLine, lacks: ProductLine)` | Clientes com `has` e sem `lacks` |
| `commissionForecast` | `(fromMonth: string, months: number)` | Previsto × recebido por competência (exige `commissions.view`) |
| `plansForProvider` | `(providerQuery: string, service?: NetworkService)` | Planos que atendem o prestador (com fonte/validade da rede) |
| `comparePlans` | `(planIds: ID[])` | Diff estruturado entre planos |
| `draftWhatsApp` | `(partyId: ID, purpose: 'follow_up'|'renovacao'|'documento'|'proposta')` | Rascunho de mensagem (nunca envia) |
| `tasksToday` | `(ownerId?)` | Fila da Central de Operações |
| `renewalStatus` | `(policyId)` | Checklist e estágio |

Formato de retorno comum:
```ts
interface ToolResult<Row> {
  rows: Row[];
  total: number;
  source: { label: string; detail?: string; at: ISODateTime };   // "Apólices vigentes · consulta de 07/10/2026 08:41"
  truncated?: boolean;
}
```

### Regras de resposta
- O texto só pode conter números presentes em `rows`/`total` (validação pós-geração: todo número da resposta deve existir no resultado da ferramenta; senão, a resposta é rejeitada e reformulada a partir de template).
- Sem resultado → "Não encontrei…" + sugestões. Pergunta fora do escopo → recusa educada.
- Ações (criar tarefas em lote, abrir cotação, rascunhar WhatsApp) exigem clique.

### DEMO: motor de intenções determinístico
Na DEMO **não há chamada a LLM**. Um motor em português (normalização sem acento, sinônimos, regex de números/períodos: "próximos 30 dias", "este mês", "sem residencial") mapeia a pergunta para uma das ferramentas acima, executa sobre o store da DEMO e formata a resposta por template, com a mesma estrutura de fonte. Perguntas não reconhecidas mostram exemplos suportados. Isso valida a experiência e as ferramentas, que serão reaproveitadas em produção.

## 3. Document AI

### Pipeline

```
1. Ingestão        upload | e-mail | WhatsApp | importação  → Document (storage S3, sha256 dedupe)
2. Texto           PDF com texto → extração direta; imagem/PDF escaneado → OCR (DocumentParser)
3. Classificação   apolice | proposta | boleto | carteirinha | crlv | documento_pessoal | … (+ confiança)
4. Extração        campos por tipo (schema zod do tipo de documento): ExtractedField { key, label, value, confidence }
5. Matching        CPF/CNPJ (exato, via blind index) → nº de apólice → placa → nome fuzzy (+ nascimento)
6. Sugestão        diff: [{ entity, id|novo, field, before, after, confidence }]
7. Revisão         humano obrigatório se: confiança < limiar (0,85) | campo crítico | cliente não identificado | conflito com dado confirmado
8. Aplicação       atualiza entidades com source='document-ai', FieldProvenance, AuditLog(source='document-ai')
9. Efeitos         apólice → Renovação programada + comissões previstas (automações)
```

- **Campos críticos:** CPF/CNPJ, nº de apólice, seguradora, vigência (início/fim), prêmio, coberturas/limites, placa/chassi, dados de saúde.
- **Validação determinística pós-extração:** dígitos de CPF/CNPJ, datas válidas e `fim > início`, prêmio > 0, placa no padrão, soma de parcelas = prêmio. Falha de validação reduz a confiança para abaixo do limiar.
- **Conflito:** se o documento diverge de um dado já confirmado por humano, nunca sobrescreve — mostra "Documento diz X; cadastro diz Y (confirmado por Z em …)".
- **Confiança por campo:** em produção, combinação de (a) confiança do OCR, (b) autoavaliação/estrutura do extrator, (c) validações determinísticas, (d) presença literal do valor no texto (o valor extraído deve ser localizável no documento — evita alucinação).

### DEMO
Extrator determinístico por **regex/heurística** sobre documentos de texto (`DocumentRecord.textContent`): padrões para CPF, CNPJ, nº de apólice, datas de vigência, valores em R$, placa, nome da seguradora fictícia. Confiança atribuída por regra (padrão forte = 0,95; inferido por contexto = 0,7). Mesmo fluxo de sugestão/confirmação da produção.

## 4. "O que muda?" (comparador)

1. O módulo do ramo produz um **diff estruturado** entre duas opções (apólice atual × proposta, plano A × plano B): `[{ dimension, a, b, delta, better: 'a'|'b'|'neutral' }]`.
2. O resumo é gerado **deterministicamente** por templates a partir do diff ("Prêmio 8% menor (R$ 312/ano). Franquia sobe de R$ 3.200 para R$ 4.100. Perde carro reserva de 15 dias.").
3. Opcionalmente, um LLM pode **reescrever o tom** (mais simples para o cliente), sob a regra: não pode introduzir números, coberturas ou afirmações ausentes do diff (validação numérica e de entidades; se falhar, usa o texto do template).

## 5. LLMProvider

Hoje `src/integrations/ai/index.ts` define a versão mínima (`complete({ system, messages, tools }) → { text, toolCalls }`). Evolução proposta:

```ts
interface LLMProvider {
  id: string;                                  // "anthropic:<modelo>"
  complete(input: { system: string; messages: Msg[]; maxTokens: number }): Promise<{ text: string; usage: Usage }>;
  toolCall(input: { system: string; messages: Msg[]; tools: ToolSpec[] }): Promise<{ calls: ToolCall[]; text?: string; usage: Usage }>;
  extractStructured<T>(input: { schema: ZodSchema<T>; content: TextOrFile; instructions: string }): Promise<{ data: T; fieldConfidence: Record<string, number> }>;
}
```

- Padrão: Anthropic Claude API (tool use, entrada de PDF/imagem). Modelo configurável por tarefa (menor/mais barato para classificação; maior para extração complexa). Alternativas plugáveis.
- Timeouts, retries e *circuit breaker*; fallback para fluxo manual (nunca bloquear a operação por indisponibilidade de IA).

## 6. PII e provedores de LLM

- **Minimização:** enviar só o necessário. Especializada AI: o LLM recebe a pergunta e os *resultados* das ferramentas já filtrados; para formatar a resposta pode receber linhas com nomes, mas não CPF completo, dados de saúde ou contatos se a pergunta não exigir. Document AI: o documento precisa ser enviado — preferir provedor/região e termos compatíveis com LGPD.
- **Pseudonimização** onde possível (ids substituídos por tokens e re-hidratados no servidor).
- **Sem treinamento:** usar API comercial cujos termos não usam os dados para treinar por padrão; firmar **DPA**; avaliar retenção zero **(a confirmar nos termos vigentes)**; registrar como operador no inventário LGPD; avaliar transferência internacional.
- **Dados de saúde:** não enviados ao LLM pela Especializada AI; no Document AI, só quando o documento for de saúde e com base legal adequada (ver SECURITY_LGPD).
- **Logs:** `AiInteraction` sem conteúdo sensível; prompts completos não são persistidos por padrão.

## 7. Avaliação e guardrails

| Mecanismo | Descrição |
|---|---|
| Conjunto de avaliação de intenções | ~200 perguntas reais da equipe (anonimizadas) com ferramenta/argumentos esperados; meta ≥ 95% de roteamento correto antes de liberar |
| Conjunto de documentos | Apólices/propostas/boletos reais anonimizados por seguradora; medir precisão/recall por campo e calibração da confiança (campos com confiança ≥ 0,85 devem estar corretos ≥ 98%) |
| Validação numérica | Resposta com número ausente dos dados = rejeitada |
| Grounding de extração | Valor extraído precisa ocorrer no texto do documento |
| Prompt injection | Conteúdo de documentos/mensagens é dado, nunca instrução; ferramentas só leitura por padrão; ações sempre com confirmação |
| Feedback | 👍/👎 em respostas; correções no Document AI viram casos de teste |
| Monitoramento | Taxa de aceite sem correção, custo por documento, latência, taxa de fallback |

## 8. Futuro — fluxos agênticos

Sempre com o padrão "IA prepara, humano aprova":

- **Renovação em lote** ("Renove todos que vencem em 30 dias") — ver [AUTOMATIONS §8](AUTOMATIONS.md).
- **Caixa de entrada inteligente:** WhatsApp/e-mail recebidos → classificar intenção (pedido de cotação, envio de documento, sinistro, dúvida) → criar tarefa/cotação/documento com rascunho de resposta.
- **Montagem de cotação a partir de conversa:** extrair do histórico os dados do pedido e pré-preencher o formulário do ramo, destacando o que falta.
- **Preparação de reunião:** resumo do Cliente 360, lacunas e oportunidades, com fontes.
- **Conciliação assistida de comissões:** casar extratos de layouts diferentes, propondo matches para revisão.
- **Atualização de rede:** comparar nova tabela da operadora com a anterior e redigir o aviso aos clientes afetados (revisão obrigatória).
