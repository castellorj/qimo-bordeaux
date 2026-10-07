"use client";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { setSettings } from "@/data/actions";
import type { AuditLog, Permission, RoleKey } from "@/domain/types";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_LABEL } from "@/domain/rbac";
import { INSURER_ADAPTERS } from "@/integrations/insurers/registry";
import { Badge, Button, Card, DemoBadge, Dialog, Empty, Icons, Input, PageHeader, Select, Stat, Table, Tabs, Td, Th, Toggle } from "@/components/ui";
import { insurerName, userName } from "@/domain/engines/queries";
import { date, dateTime, n } from "@/lib/format";
import { norm } from "@/lib/text";
import { cn } from "@/lib/cn";

type TabKey = "perfis" | "carteira" | "auditoria" | "integracoes" | "lgpd" | "demo";
const ROLES = Object.keys(ROLE_LABEL) as RoleKey[];

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={null}>
      <Configuracoes />
    </Suspense>
  );
}

function Configuracoes() {
  const { can } = useStore();
  const params = useSearchParams();
  const initial = (params.get("aba") as TabKey | null) ?? (can("settings.manage") || !can("audit.view") ? "perfis" : "auditoria");
  const [tab, setTab] = useState<TabKey>(initial);
  useEffect(() => {
    const a = params.get("aba") as TabKey | null;
    if (a) setTab(a);
  }, [params]);

  return (
    <div>
      <PageHeader icon={<Icons.Settings className="h-5 w-5" />} title="Configurações" subtitle="Perfis, regras de carteira, auditoria, integrações e segurança." />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: "perfis", label: "Perfis e permissões" },
          { value: "carteira", label: "Carteira e regras" },
          { value: "auditoria", label: "Auditoria" },
          { value: "integracoes", label: "Integrações" },
          { value: "lgpd", label: "LGPD e segurança" },
          { value: "demo", label: "Dados DEMO" },
        ]} />
      </div>
      {tab === "perfis" && <Perfis />}
      {tab === "carteira" && <Carteira />}
      {tab === "auditoria" && <Auditoria />}
      {tab === "integracoes" && <Integracoes />}
      {tab === "lgpd" && <Lgpd />}
      {tab === "demo" && <DadosDemo />}
    </div>
  );
}

function ReadOnlyNote() {
  return <div className="mb-3 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-muted"><Icons.Lock className="h-3.5 w-3.5" />Somente leitura — alterações exigem a permissão “Configurações e perfis”.</div>;
}

// ───────── Perfis e permissões
function Perfis() {
  const { db, can, update, toast } = useStore();
  const manage = can("settings.manage");
  const [draft, setDraft] = useState<Record<RoleKey, Permission[]>>(db.settings.rolePermissions);
  useEffect(() => setDraft(db.settings.rolePermissions), [db.settings.rolePermissions]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(db.settings.rolePermissions);
  const groups = useMemo(() => Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group))), []);
  const locked = (role: RoleKey, perm: Permission) => role === "admin" && perm === "settings.manage"; // evita perder o acesso administrativo

  const toggle = (role: RoleKey, perm: Permission) => {
    if (!manage || locked(role, perm)) return;
    setDraft((d) => ({ ...d, [role]: d[role].includes(perm) ? d[role].filter((p) => p !== perm) : [...d[role], perm] }));
  };
  const save = () => {
    update((d, u) => setSettings(d, u, { rolePermissions: draft }));
    toast("Permissões salvas e registradas na auditoria");
  };

  return (
    <Card padded={false} title="Matriz de permissões" subtitle="Perfis × permissões (RBAC). Aplicado em toda a interface; em produção também validado no servidor."
      action={manage && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDraft(DEFAULT_ROLE_PERMISSIONS)}>Padrão</Button>
          <Button variant="secondary" size="sm" disabled={!dirty} onClick={() => setDraft(db.settings.rolePermissions)}>Descartar</Button>
          <Button size="sm" disabled={!dirty} onClick={save} icon={<Icons.Save className="h-3.5 w-3.5" />}>Salvar</Button>
        </div>
      )}>
      {!manage && <div className="px-4 pt-3"><ReadOnlyNote /></div>}
      <Table>
        <thead>
          <tr>
            <Th className="min-w-[240px]">Permissão</Th>
            {ROLES.map((r) => <Th key={r} className="text-center">{ROLE_LABEL[r]}<div className="font-normal normal-case tracking-normal text-ink-faint">{db.users.filter((u) => u.role === r).length} usuário(s)</div></Th>)}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g}>
              <tr><td colSpan={ROLES.length + 1} className="border-b border-line-soft bg-canvas/60 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted">{g}</td></tr>
              {ALL_PERMISSIONS.filter((p) => p.group === g).map((p) => (
                <tr key={p.key} className="hover:bg-canvas">
                  <Td><div className="text-sm text-ink">{p.label}</div><div className="font-mono text-2xs text-ink-faint">{p.key}</div></Td>
                  {ROLES.map((r) => {
                    const on = draft[r]?.includes(p.key);
                    return (
                      <Td key={r} className="text-center">
                        <input type="checkbox" aria-label={`${ROLE_LABEL[r]}: ${p.label}`} checked={!!on} disabled={!manage || locked(r, p.key)} onChange={() => toggle(r, p.key)} className="h-4 w-4 cursor-pointer accent-brand-600 disabled:cursor-not-allowed" />
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </Table>
      {dirty && <div className="border-t border-line-soft bg-warn-soft/50 px-4 py-2 text-xs text-warn-strong">Alterações não salvas.</div>}
    </Card>
  );
}

// ───────── Carteira e regras
function Carteira() {
  const { db, can, update, toast } = useStore();
  const manage = can("settings.manage");
  const [followUp, setFollowUp] = useState(db.settings.followUpDays);
  useEffect(() => setFollowUp(db.settings.followUpDays), [db.settings.followUpDays]);
  const brokers = db.users.filter((u) => u.role === "corretor");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {!manage && <div className="lg:col-span-2"><ReadOnlyNote /></div>}
      <Card title="Visibilidade de carteira" subtitle="Quem vê quais clientes">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-ink">Restringir carteira ao corretor responsável</div>
            <p className="mt-1 text-xs text-ink-muted">Quando ativo, cada corretor vê apenas os próprios clientes (e familiares/sócios ligados a eles). Perfis com “Ver carteira de todos os corretores” continuam vendo tudo. Vale para listas, busca, Central de Operações, relatórios e Especializada AI.</p>
          </div>
          {manage ? <Toggle checked={db.settings.restrictWalletToOwner} onChange={(v) => { update((d, u) => setSettings(d, u, { restrictWalletToOwner: v })); toast(v ? "Carteira restrita ao responsável" : "Carteira compartilhada com a equipe"); }} /> : <Badge tone={db.settings.restrictWalletToOwner ? "ok" : "neutral"}>{db.settings.restrictWalletToOwner ? "ativa" : "inativa"}</Badge>}
        </div>
        <div className="mt-4 space-y-1.5">
          {brokers.map((b) => {
            const nPersons = db.persons.filter((p) => p.ownerId === b.id && p.clientStatus).length;
            const nCompanies = db.companies.filter((c) => c.ownerId === b.id).length;
            return <div key={b.id} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-xs"><span className="font-medium text-ink">{b.name}</span><span className="text-ink-muted">{nPersons} clientes PF · {nCompanies} empresas</span></div>;
          })}
        </div>
      </Card>

      <Card title="Follow-up automático" subtitle="Propostas sem resposta">
        <div className="flex items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Criar follow-up após</span>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={30} value={followUp} disabled={!manage} onChange={(e) => setFollowUp(Math.max(1, Math.min(30, Number(e.target.value))))} className="w-24" />
              <span className="text-sm text-ink-soft">dias sem resposta</span>
            </div>
          </label>
          {manage && <Button variant="secondary" disabled={followUp === db.settings.followUpDays} onClick={() => { update((d, u) => setSettings(d, u, { followUpDays: followUp })); toast(`Follow-up após ${followUp} dia(s)`); }}>Salvar</Button>}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Usado pela automação “Proposta sem resposta → follow-up”: a tarefa vai para o corretor responsável, com rascunho de mensagem para revisar. Nenhuma mensagem é enviada automaticamente ao cliente.</p>
      </Card>

      <Card title="Janelas de renovação" subtitle="Quando o motor inicia e escala o processo" className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          {[...db.settings.renewalWindows].sort((a, b) => b - a).map((w, i, arr) => (
            <Fragment key={w}>
              <div className={cn("rounded-xl border px-4 py-3 text-center", w <= 15 ? "border-red-200 bg-danger-soft/50" : w <= 30 ? "border-amber-200 bg-warn-soft/60" : "border-line bg-canvas")}>
                <div className="text-lg font-semibold tabular-nums text-ink">{w}</div>
                <div className="text-2xs text-ink-muted">dias antes</div>
              </div>
              {i < arr.length - 1 && <Icons.ChevronRight className="h-4 w-4 text-ink-faint" />}
            </Fragment>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">90/60 dias: renovação criada com os dados da apólice anterior, oportunidade no CRM e tarefa de levantamento. 30/15/7 dias: tarefa escalonada (substitui a anterior) e prioridade maior na Central de Operações. Apólices vencidas há até 30 dias continuam no radar.</p>
      </Card>
    </div>
  );
}

// ───────── Auditoria
const ACTION_LABEL: Record<AuditLog["action"], string> = { create: "Criação", update: "Alteração", delete: "Exclusão", view_sensitive: "Dado sensível visualizado", export: "Exportação", login: "Login", automation: "Automação" };
const ACTION_TONE: Record<AuditLog["action"], "ok" | "brand" | "danger" | "warn" | "neutral" | "violet"> = { create: "ok", update: "brand", delete: "danger", view_sensitive: "warn", export: "violet", login: "neutral", automation: "violet" };
const SOURCE_LABEL: Record<AuditLog["source"], string> = { ui: "Interface", automacao: "Automação", "document-ai": "Document AI", importacao: "Importação", "ai-assistant": "Especializada AI" };

function fmtVal(v: unknown) {
  if (v == null || v === "") return "—";
  if (typeof v === "object") { const s = JSON.stringify(v); return s.length > 120 ? `${s.slice(0, 117)}…` : s; }
  return String(v);
}

function Auditoria() {
  const { db, can } = useStore();
  const [action, setAction] = useState<AuditLog["action"] | "">("");
  const [userId, setUserId] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);

  const list = useMemo(() => {
    const nq = norm(q);
    return db.audit
      .filter((a) => !action || a.action === action)
      .filter((a) => !userId || a.userId === userId)
      .filter((a) => !nq || norm(`${a.summary} ${a.entity} ${a.entityId}`).includes(nq))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [db.audit, action, userId, q]);

  if (!can("audit.view")) return <Card><Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não pode ver a trilha de auditoria.</Empty></Card>;

  const sensitive = db.audit.filter((a) => a.action === "view_sensitive").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Eventos registrados" value={n(db.audit.length)} icon={<Icons.ScrollText className="h-4 w-4" />} />
        <Stat label="Dados sensíveis visualizados" value={n(sensitive)} sub="CPF, documentos pessoais…" icon={<Icons.Eye className="h-4 w-4" />} tone="warn" />
        <Stat label="Por automação / IA" value={n(db.audit.filter((a) => a.source !== "ui").length)} icon={<Icons.Bot className="h-4 w-4" />} tone="brand" />
        <Stat label="Usuários ativos" value={n(new Set(db.audit.map((a) => a.userId).filter((u) => u !== "sistema")).size)} icon={<Icons.Users className="h-4 w-4" />} />
      </div>
      <Card padded={false} title="Trilha de auditoria" subtitle="Quem fez o quê, quando e de onde — imutável em produção (append-only)">
        <div className="grid gap-2 border-b border-line-soft px-4 py-3 sm:grid-cols-[1fr_220px_200px]">
          <div className="relative">
            <Icons.Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no resumo, entidade ou ID…" className="pl-8" />
          </div>
          <Select value={action} onChange={(e) => setAction(e.target.value as AuditLog["action"] | "")}>
            <option value="">Todas as ações</option>
            {(Object.keys(ACTION_LABEL) as AuditLog["action"][]).map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
          </Select>
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos os usuários</option>
            <option value="sistema">Sistema</option>
            {db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        {list.length ? (
          <Table className="max-h-[620px]">
            <thead><tr><Th>Data/hora</Th><Th>Usuário</Th><Th>Entidade</Th><Th>Ação</Th><Th>Resumo</Th><Th>Origem</Th><Th /></tr></thead>
            <tbody>
              {list.slice(0, limit).map((a) => (
                <Fragment key={a.id}>
                  <tr className={cn("hover:bg-canvas", a.changes?.length && "cursor-pointer")} onClick={() => a.changes?.length && setOpen(open === a.id ? null : a.id)}>
                    <Td className="whitespace-nowrap text-xs tabular-nums text-ink-muted">{dateTime(a.at)}</Td>
                    <Td className="whitespace-nowrap text-xs">{userName(db, a.userId)}</Td>
                    <Td className="whitespace-nowrap text-xs"><span className="text-ink">{a.entity}</span> <span className="font-mono text-2xs text-ink-faint">{a.entityId}</span></Td>
                    <Td><Badge tone={ACTION_TONE[a.action]}>{ACTION_LABEL[a.action]}</Badge></Td>
                    <Td className="text-xs text-ink-soft">{a.summary}</Td>
                    <Td className="whitespace-nowrap text-2xs text-ink-muted">{SOURCE_LABEL[a.source]}</Td>
                    <Td className="text-right">{a.changes?.length ? <Icons.ChevronDown className={cn("inline h-4 w-4 text-ink-faint transition", open === a.id && "rotate-180")} /> : null}</Td>
                  </tr>
                  {open === a.id && a.changes && (
                    <tr>
                      <td colSpan={7} className="border-b border-line-soft bg-canvas px-4 py-2">
                        <div className="grid gap-1">
                          {a.changes.map((c, i) => (
                            <div key={i} className="grid grid-cols-[160px_1fr_auto_1fr] items-start gap-2 text-2xs">
                              <span className="font-mono text-ink-muted">{c.field}</span>
                              <span className="break-all text-red-700 line-through decoration-red-300">{fmtVal(c.before)}</span>
                              <Icons.ArrowRight className="h-3 w-3 text-ink-faint" />
                              <span className="break-all text-ok-strong">{fmtVal(c.after)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        ) : <Empty icon={<Icons.ScrollText className="h-5 w-5" />} title="Nenhum evento com esses filtros" />}
        <div className="flex items-center justify-between px-4 py-2.5 text-2xs text-ink-muted">
          <span>Exibindo {Math.min(limit, list.length)} de {list.length} evento(s)</span>
          {list.length > limit && <button onClick={() => setLimit((l) => l + 100)} className="font-medium text-brand-700 hover:underline">Mostrar mais</button>}
        </div>
      </Card>
    </div>
  );
}

// ───────── Integrações
function IntegrationCard({ icon, title, demo, prod, status, depends, children }: { icon: keyof typeof Icons; title: string; demo: string; prod: string; status: "demo" | "off" | "on"; depends: string[]; children?: React.ReactNode }) {
  const I = Icons[icon] as Icons.LucideIcon;
  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><I className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <div className="mt-0.5">{status === "demo" ? <DemoBadge /> : status === "on" ? <Badge tone="ok" dot>ativa</Badge> : <Badge tone="neutral" dot>não conectado</Badge>}</div>
        </div>
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">DEMO</dt><dd className="text-ink-soft">{demo}</dd></div>
        <div className="flex gap-2"><dt className="w-20 shrink-0 text-ink-muted">Produção</dt><dd className="text-ink-soft">{prod}</dd></div>
      </dl>
      {children}
      <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-line-soft pt-2.5" style={{ marginTop: "0.75rem" }}>
        <span className="text-2xs text-ink-faint">Depende de:</span>
        {depends.map((d) => <Badge key={d} tone="neutral">{d}</Badge>)}
      </div>
    </section>
  );
}

const METHOD_LABEL: Record<string, string> = { demo: "simulado (DEMO)", manual: "manual", api_oficial: "API oficial", api_parceiro: "API de parceiro", integracao_autorizada: "integração autorizada", importacao: "importação" };

function Integracoes() {
  const { db } = useStore();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-soft shadow-card">
        <Icons.Plug className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Toda integração passa por uma abstração (adapter) — trocar o provedor DEMO pelo de produção não muda telas nem regras. Sem scraping: apenas APIs oficiais, parceiros contratados, importação de arquivos ou entrada manual (docs/INTEGRATIONS.md).
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <IntegrationCard icon="Landmark" title="Seguradoras (multicálculo)" status="demo" demo="Calculadora simulada por seguradora" prod="API oficial, agregador de multicálculo contratado ou cotação manual" depends={["API", "contrato"]}>
          <div className="mt-3 space-y-1">
            {INSURER_ADAPTERS.map((a) => (
              <div key={a.insurerId} className="flex items-center justify-between rounded-md bg-canvas px-2 py-1 text-2xs">
                <span className="font-medium text-ink">{insurerName(db, a.insurerId)}</span>
                <span className={cn(a.automatic ? "text-ok-strong" : "text-warn-strong")}>{METHOD_LABEL[a.method] ?? a.method}{a.automatic ? " · automático" : " · cotação manual"}</span>
              </div>
            ))}
          </div>
        </IntegrationCard>
        <IntegrationCard icon="HeartPulse" title="Operadoras / rede credenciada" status="demo" demo="Planilhas, PDF, CSV e API de parceiro simulados" prod="Importação periódica + APIs de parceiro quando disponíveis" depends={["dados", "API"]}>
          <div className="mt-3 space-y-1">
            {db.networkSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md bg-canvas px-2 py-1 text-2xs">
                <span className="truncate font-medium text-ink">{s.label}</span>
                <span className={cn("shrink-0", s.status === "expirada" ? "text-danger" : s.status === "expirando" ? "text-warn-strong" : "text-ok-strong")}>{s.kind.toUpperCase()} · {s.status} · até {date(s.validUntil)}</span>
              </div>
            ))}
          </div>
        </IntegrationCard>
        <IntegrationCard icon="Map" title="Mapas" status="demo" demo="OpenStreetMap / Leaflet" prod="Google Maps ou Mapbox (geocodificação e rotas)" depends={["API", "contrato"]} />
        <IntegrationCard icon="MessageCircle" title="WhatsApp" status="demo" demo="Links wa.me com mensagem pré-preenchida (envio manual)" prod="WhatsApp Business Cloud API com templates aprovados e opt-in" depends={["API", "contrato"]} />
        <IntegrationCard icon="Mail" title="E-mail" status="off" demo="Não conectado" prod="Caixa compartilhada (IMAP/Graph/Gmail API) → Document AI; envio transacional" depends={["API", "contrato"]} />
        <IntegrationCard icon="Sparkles" title="IA (Especializada AI)" status="demo" demo="Motor determinístico de intenções (sem LLM)" prod="LLM via camada de abstração, chamando as mesmas ferramentas com controle de acesso" depends={["API", "contrato"]} />
        <IntegrationCard icon="HardDrive" title="Storage de documentos" status="demo" demo="Local (navegador); só documentos de texto" prod="S3 com criptografia, URLs assinadas de curta duração e retenção" depends={["contrato"]} />
        <IntegrationCard icon="ScanText" title="Document parsing" status="demo" demo="Extrator por regex sobre texto" prod="OCR + LLM com saída estruturada e confiança por campo" depends={["API", "dados"]} />
      </div>
    </div>
  );
}

// ───────── LGPD e segurança
function Lgpd() {
  const items: { icon: keyof typeof Icons; title: string; text: string; state: "ativo" | "parcial" | "planejado" }[] = [
    { icon: "KeyRound", title: "RBAC — perfis e permissões", text: "Cada tela e ação verifica a permissão do perfil; carteira pode ser restrita ao corretor responsável.", state: "ativo" },
    { icon: "ScrollText", title: "Trilha de auditoria", text: "Criações, alterações, automações, importações, Document AI e visualizações de dados sensíveis são registradas.", state: "ativo" },
    { icon: "EyeOff", title: "Minimização de exposição", text: "CPF parcialmente oculto em listas; exibição completa registrada como visualização sensível.", state: "ativo" },
    { icon: "UserCheck", title: "Revisão humana", text: "Campos críticos extraídos por IA e importações nunca são gravados sem confirmação.", state: "ativo" },
    { icon: "Lock", title: "Criptografia", text: "TLS em trânsito; em repouso no banco e no storage (S3 SSE/KMS); campos sensíveis com criptografia em nível de coluna.", state: "planejado" },
    { icon: "Link2", title: "URLs assinadas", text: "Documentos servidos por URLs assinadas de curta duração, nunca públicas.", state: "planejado" },
    { icon: "Archive", title: "Retenção e descarte", text: "Política de retenção por tipo de documento, anonimização e atendimento a pedidos do titular (acesso, correção, exclusão).", state: "planejado" },
    { icon: "Smartphone", title: "Autenticação em dois fatores", text: "2FA obrigatório para administradores e opcional para os demais; sessões com expiração.", state: "planejado" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => {
          const I = Icons[it.icon] as Icons.LucideIcon;
          return (
            <div key={it.title} className="flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", it.state === "ativo" ? "bg-ok-soft text-ok" : "bg-line-soft text-ink-muted")}><I className="h-4 w-4" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{it.title}</h3>
                  {it.state === "ativo" ? <Badge tone="ok" dot>ativo na DEMO</Badge> : <Badge tone="neutral" dot>planejado para produção</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{it.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-soft shadow-card">
        <Icons.BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <span>Detalhamento completo (bases legais, mapeamento de dados, incidentes, DPO): <span className="font-mono text-ink">docs/SECURITY_LGPD.md</span>. Todos os dados desta DEMO são fictícios.</span>
      </div>
    </div>
  );
}

// ───────── Dados DEMO
function DadosDemo() {
  const { db, reset, can } = useStore();
  const [confirm, setConfirm] = useState(false);
  const counts: [string, number][] = [
    ["Pessoas", db.persons.length], ["Empresas", db.companies.length], ["Famílias", db.households.length], ["Ativos", db.assets.length],
    ["Seguradoras", db.insurers.length], ["Planos de saúde", db.healthPlans.length], ["Prestadores", db.providers.length], ["Oportunidades", db.opportunities.length],
    ["Cotações", db.quotes.length], ["Propostas", db.proposals.length], ["Apólices", db.policies.length], ["Renovações", db.renewals.length],
    ["Documentos", db.documents.length], ["Tarefas", db.tasks.length], ["Interações", db.interactions.length], ["Comissões", db.commissions.length],
    ["Automações", db.automations.length], ["Execuções", db.automationRuns.length], ["Eventos de auditoria", db.audit.length], ["Usuários", db.users.length],
  ];
  return (
    <div className="space-y-4">
      <Card title="Base de dados da DEMO" subtitle="Tudo fictício, gerado relativo à data de hoje e salvo apenas neste navegador" action={<DemoBadge />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {counts.map(([label, v]) => (
            <div key={label} className="rounded-lg bg-canvas px-3 py-2">
              <div className="text-lg font-semibold tabular-nums text-ink">{n(v)}</div>
              <div className="text-2xs text-ink-muted">{label}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Restaurar dados DEMO" subtitle="Volta ao estado inicial da demonstração">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-ink-soft">Descarta tudo o que foi criado ou alterado nesta sessão (clientes, apólices, documentos, importações, permissões) e recria a base fictícia original. Útil antes de uma nova apresentação.</p>
          <Button variant="danger" disabled={!can("settings.manage") && !can("audit.view")} icon={<Icons.RotateCcw className="h-4 w-4" />} onClick={() => setConfirm(true)}>Restaurar dados DEMO</Button>
        </div>
      </Card>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Restaurar dados DEMO?" footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancelar</Button><Button variant="danger" onClick={() => { reset(); setConfirm(false); }}>Restaurar</Button></>}>
        <p className="text-sm text-ink-soft">Todas as alterações feitas neste navegador serão perdidas e a base fictícia original será recriada. Esta ação não pode ser desfeita.</p>
      </Dialog>
    </div>
  );
}
