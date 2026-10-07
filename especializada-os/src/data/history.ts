/** Helpers compartilhados pelos casos de uso: IDs, trilha de auditoria e histórico do cliente. */
import type { AuditLog, DB, Interaction, User } from "@/domain/types";
import { nowISO } from "@/lib/dates";

/** ID curto com aleatoriedade criptográfica (evita colisões de Math.random). */
export const uid = (prefix: string) => `${prefix}-${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

export function audit(db: DB, user: User | null, e: Omit<AuditLog, "id" | "at" | "userId">): DB {
  return { ...db, audit: [{ id: uid("au"), at: nowISO(), userId: user?.id ?? "sistema", ...e }, ...db.audit] };
}

export function interaction(db: DB, i: Omit<Interaction, "id" | "at" | "demo">): DB {
  return { ...db, interactions: [{ id: uid("i"), at: nowISO(), demo: true, ...i }, ...db.interactions] };
}
