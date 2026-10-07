/**
 * E-mail. Produção: caixa de entrada via Gmail API / Microsoft Graph (OAuth,
 * escopo mínimo) e envio via provedor transacional. E-mails recebidos são
 * associados ao cliente por endereço/CPF/nº de apólice e podem virar tarefa,
 * documento, oportunidade ou pendência.
 */
export interface InboundEmail { id: string; from: string; subject: string; receivedAt: string; snippet: string; attachments: { name: string; mime: string }[] }
export interface EmailProvider {
  listInbox(since: string): Promise<InboundEmail[]>;
  send(to: string, subject: string, html: string): Promise<{ id: string }>;
}
export function mailtoLink(to: string | undefined, subject: string, body: string) {
  return `mailto:${to ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
