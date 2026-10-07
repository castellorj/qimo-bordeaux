/**
 * WhatsApp. DEMO: link oficial click-to-chat (wa.me) — abre o WhatsApp do
 * próprio usuário com a mensagem pronta; nada é enviado automaticamente.
 * Produção: WhatsApp Business Platform (Cloud API da Meta, direto ou via BSP),
 * com templates aprovados, opt-in registrado e webhooks gravando o histórico.
 */
export interface WhatsAppSender {
  sendTemplate(to: string, template: string, params: string[]): Promise<{ messageId: string }>;
  sendText(to: string, text: string): Promise<{ messageId: string }>;
}

export function waLink(phone: string | undefined, text: string) {
  const d = (phone ?? "").replace(/\D/g, "");
  const base = d ? `https://wa.me/${d.startsWith("55") ? d : "55" + d}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
