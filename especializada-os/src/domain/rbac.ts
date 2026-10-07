import type { DB, PartyRef, Permission, RoleKey, User } from "./types";

export const ROLE_LABEL: Record<RoleKey, string> = {
  admin: "Administrador", gestor: "Gestor", corretor: "Corretor", operacional: "Operacional", financeiro: "Financeiro",
};

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "dashboard.view", label: "Ver dashboard", group: "Geral" },
  { key: "wallet.all", label: "Ver carteira de todos os corretores", group: "Geral" },
  { key: "clients.view", label: "Ver clientes", group: "Clientes" },
  { key: "clients.edit", label: "Editar clientes", group: "Clientes" },
  { key: "crm.view", label: "Ver CRM", group: "Comercial" },
  { key: "crm.edit", label: "Mover oportunidades", group: "Comercial" },
  { key: "quotes.view", label: "Ver cotações", group: "Comercial" },
  { key: "quotes.edit", label: "Criar cotações", group: "Comercial" },
  { key: "proposals.view", label: "Ver propostas", group: "Comercial" },
  { key: "proposals.edit", label: "Criar/enviar propostas", group: "Comercial" },
  { key: "policies.view", label: "Ver apólices", group: "Operação" },
  { key: "policies.edit", label: "Editar apólices", group: "Operação" },
  { key: "documents.view", label: "Ver documentos", group: "Operação" },
  { key: "documents.edit", label: "Enviar/confirmar documentos", group: "Operação" },
  { key: "tasks.view", label: "Ver tarefas", group: "Operação" },
  { key: "network.view", label: "Ver rede credenciada", group: "Saúde" },
  { key: "network.import", label: "Importar rede", group: "Saúde" },
  { key: "commissions.view", label: "Ver comissões", group: "Financeiro" },
  { key: "reports.view", label: "Ver relatórios", group: "Financeiro" },
  { key: "ai.use", label: "Usar Especializada AI", group: "IA" },
  { key: "import.run", label: "Importar carteira", group: "Administração" },
  { key: "automations.manage", label: "Gerenciar automações", group: "Administração" },
  { key: "settings.manage", label: "Configurações e perfis", group: "Administração" },
  { key: "audit.view", label: "Ver auditoria", group: "Administração" },
];

const ALL = ALL_PERMISSIONS.map((p) => p.key);
const without = (...ex: Permission[]) => ALL.filter((p) => !ex.includes(p));

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  admin: ALL,
  gestor: without("settings.manage"),
  corretor: ["dashboard.view", "clients.view", "clients.edit", "crm.view", "crm.edit", "quotes.view", "quotes.edit", "proposals.view", "proposals.edit", "policies.view", "documents.view", "documents.edit", "tasks.view", "network.view", "commissions.view", "ai.use"],
  operacional: ["dashboard.view", "wallet.all", "clients.view", "clients.edit", "crm.view", "quotes.view", "quotes.edit", "proposals.view", "policies.view", "policies.edit", "documents.view", "documents.edit", "tasks.view", "network.view", "network.import", "ai.use", "import.run"],
  financeiro: ["dashboard.view", "wallet.all", "clients.view", "policies.view", "documents.view", "tasks.view", "commissions.view", "reports.view", "ai.use"],
};

export function can(db: DB, user: User | null | undefined, perm: Permission) {
  if (!user) return false;
  return db.settings.rolePermissions[user.role]?.includes(perm) ?? false;
}

/** Visibilidade de carteira: corretor vê só os próprios clientes quando a restrição está ativa. */
export function seesAllWallet(db: DB, user: User | null | undefined) {
  if (!user) return false;
  return !db.settings.restrictWalletToOwner || can(db, user, "wallet.all");
}

export function partyOwner(db: DB, ref: PartyRef): string | undefined {
  return ref.type === "person" ? db.persons.find((p) => p.id === ref.id)?.ownerId : db.companies.find((c) => c.id === ref.id)?.ownerId;
}

export function canSeeParty(db: DB, user: User | null | undefined, ref: PartyRef | undefined) {
  if (!ref) return true;
  if (seesAllWallet(db, user)) return true;
  const owner = partyOwner(db, ref);
  // dependentes/sócios sem dono próprio: visíveis se ligados a um cliente do corretor
  if (!owner && ref.type === "person") {
    const hh = db.households.find((h) => h.members.some((m) => m.personId === ref.id));
    const titular = hh?.members.find((m) => m.relation === "titular");
    if (titular) return db.persons.find((p) => p.id === titular.personId)?.ownerId === user?.id;
    const rel = db.companyRelationships.find((r) => r.personId === ref.id);
    if (rel) return db.companies.find((c) => c.id === rel.companyId)?.ownerId === user?.id;
  }
  return owner === user?.id;
}
