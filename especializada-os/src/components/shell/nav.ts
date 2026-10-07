import type { Permission } from "@/domain/types";

export interface NavItem { href: string; label: string; icon: string; perm?: Permission; shortcut?: string }
export const NAV: { section?: string; items: NavItem[] }[] = [
  { items: [
    { href: "/", label: "Dashboard", icon: "LayoutDashboard", perm: "dashboard.view", shortcut: "G D" },
    { href: "/operacoes", label: "Central de Operações", icon: "Radar", perm: "tasks.view", shortcut: "G O" },
  ] },
  { section: "Carteira", items: [
    { href: "/clientes", label: "Clientes", icon: "Users", perm: "clients.view", shortcut: "G C" },
    { href: "/familias", label: "Famílias", icon: "HeartHandshake", perm: "clients.view" },
    { href: "/empresas", label: "Empresas", icon: "Building2", perm: "clients.view" },
    { href: "/crm", label: "CRM", icon: "KanbanSquare", perm: "crm.view" },
  ] },
  { section: "Comercial", items: [
    { href: "/cotacoes", label: "Cotações", icon: "Calculator", perm: "quotes.view" },
    { href: "/propostas", label: "Propostas", icon: "FileText", perm: "proposals.view" },
    { href: "/apolices", label: "Apólices", icon: "ShieldCheck", perm: "policies.view" },
    { href: "/renovacoes", label: "Renovações", icon: "RefreshCw", perm: "policies.view" },
  ] },
  { section: "Saúde & mercado", items: [
    { href: "/rede", label: "Rede Credenciada", icon: "MapPinned", perm: "network.view" },
    { href: "/seguradoras", label: "Seguradoras", icon: "Landmark", perm: "policies.view" },
  ] },
  { section: "Operação", items: [
    { href: "/documentos", label: "Documentos", icon: "FolderOpen", perm: "documents.view" },
    { href: "/tarefas", label: "Tarefas", icon: "CheckSquare", perm: "tasks.view" },
    { href: "/comissoes", label: "Comissões", icon: "Wallet", perm: "commissions.view" },
    { href: "/relatorios", label: "Relatórios", icon: "BarChart3", perm: "reports.view" },
  ] },
  { section: "Inteligência", items: [
    { href: "/ai", label: "Especializada AI", icon: "Sparkles", perm: "ai.use", shortcut: "G A" },
    { href: "/automacoes", label: "Automações", icon: "Workflow", perm: "automations.manage" },
    { href: "/importar", label: "Importação", icon: "Upload", perm: "import.run" },
    { href: "/configuracoes", label: "Configurações", icon: "Settings", perm: "audit.view" },
  ] },
];
