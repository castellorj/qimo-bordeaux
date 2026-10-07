/**
 * Camada de abstração de LLM. A IA NUNCA é fonte de dados: ela interpreta a
 * pergunta, escolhe ferramentas (consultas determinísticas ao banco) e redige
 * a resposta citando a origem. Provedor padrão previsto: Anthropic Claude
 * (chave somente no servidor). DEMO: motor de intenções determinístico
 * (src/domain/engines/assistant.ts) usando as MESMAS ferramentas, sem LLM.
 */
export interface LLMMessage { role: "user" | "assistant"; content: string }
export interface LLMTool { name: string; description: string; inputSchema: Record<string, unknown> }
export interface LLMProvider {
  name: string;
  complete(input: { system: string; messages: LLMMessage[]; tools?: LLMTool[] }): Promise<{ text: string; toolCalls: { name: string; input: unknown }[] }>;
}
