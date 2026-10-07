/**
 * Casos de uso comerciais complementares (renovação inteligente).
 * Mesmo estilo de actions.ts: funções puras DB → DB, com AuditLog e histórico.
 */
import type { DB, Renewal, User } from "@/domain/types";
import { updateRenewal } from "./actions";
import { interaction } from "./history";
import { partyName } from "@/domain/engines/queries";
import { lineLabel } from "@/domain/products";


/**
 * Marca/desmarca um item do checklist de renovação. Ao confirmar dados ou
 * mudanças, uma renovação "identificada" avança para "coletando_dados".
 */
export function toggleRenewalItem(db: DB, user: User | null, renewalId: string, key: string): DB {
  const ren = db.renewals.find((r) => r.id === renewalId);
  if (!ren) return db;
  const checklist = ren.checklist.map((c) => (c.key === key ? { ...c, done: !c.done } : c));
  const item = checklist.find((c) => c.key === key);
  const patch: Partial<Renewal> = { checklist };
  if (item?.done && ren.status === "identificada" && (key === "dados" || key === "mudancas" || key === "condutores" || key === "beneficiarios")) patch.status = "coletando_dados";
  return updateRenewal(db, user, renewalId, patch);
}

/**
 * Registra que o corretor perguntou ao cliente "o que mudou?" (mensagem aberta
 * no WhatsApp do próprio usuário — nada é enviado automaticamente).
 */
export function logRenewalContact(db: DB, user: User | null, renewalId: string): DB {
  const ren = db.renewals.find((r) => r.id === renewalId);
  const pol = ren && db.policies.find((p) => p.id === ren.policyId);
  if (!ren || !pol) return db;
  let next = interaction(db, { party: pol.holder, channel: "whatsapp", direction: "saida", summary: `Renovação ${lineLabel(pol.line)}: perguntado ao cliente o que mudou desde a última vigência`, userId: user?.id });
  next = updateRenewal(next, user, renewalId, { status: ren.status === "identificada" ? "coletando_dados" : ren.status });
  return { ...next, audit: next.audit.map((a, i) => (i === 0 ? { ...a, summary: `Contato de renovação com ${partyName(db, pol.holder)} (WhatsApp)` } : a)) };
}

/** Registra as mudanças informadas pelo cliente na renovação. */
export function setRenewalChanges(db: DB, user: User | null, renewalId: string, text: string): DB {
  const ren = db.renewals.find((r) => r.id === renewalId);
  if (!ren) return db;
  const checklist = ren.checklist.map((c) => (c.key === "mudancas" ? { ...c, done: true } : c));
  return updateRenewal(db, user, renewalId, { changesReported: text, checklist, status: ren.status === "identificada" ? "coletando_dados" : ren.status });
}
