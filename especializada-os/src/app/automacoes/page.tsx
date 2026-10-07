"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { toggleAutomation } from "@/data/actions";
import { createCustomAutomation, deleteCustomAutomation } from "@/data/actions-ops";
import type { Automation, AutomationAction, AutomationTrigger } from "@/domain/types";
import { Badge, Button, Card, Dialog, Empty, Field, Icons, Input, PageHeader, Select, Stat, Table, Td, Textarea, Th, Toggle } from "@/components/ui";
import { addDays } from "@/lib/dates";
import { dateTime, n } from "@/lib/format";
import { cn } from "@/lib/cn";

const TRIGGER_LABEL: Record<AutomationTrigger, string> = {
  "policy.created": "Apólice criada",
  "policy.days_to_end": "Dias para o vencimento",
  "proposal.sent_no_reply": "Proposta sem resposta",
  "document.received": "Documento recebido",
  "client.created": "Cliente cadastrado",
  "policy.issued": "Apólice emitida",
  "task.overdue": "Tarefa atrasada",
};
const ACTION_LABEL: Record<AutomationAction, string> = {
  create_renewal: "Criar renovação",
  create_task: "Criar tarefa",
  create_follow_up: "Criar follow-up",
  classify_document: "Classificar e extrair documento",
  check_cross_sell: "Verificar oportunidades",
  schedule_commission: "Programar comissões",
  notify_owner: "Avisar responsável",
};
const OP_LABEL: Record<Automation["conditions"][number]["op"], string> = { eq: "=", lte: "≤", gte: "≥", in: "em" };
const CONDITION_FIELDS: { key: string; label: string }[] = [
  { key: "dias_para_vencer", label: "Dias para vencer" },
  { key: "dias_sem_resposta", label: "Dias sem resposta" },
  { key: "dias_atraso", label: "Dias de atraso" },
  { key: "ramo", label: "Ramo" },
  { key: "seguradora", label: "Seguradora" },
  { key: "premio_anual", label: "Prêmio anual (R$)" },
  { key: "tipo_documento", label: "Tipo de documento" },
  { key: "status", label: "Status" },
];
const fieldLabel = (k: string) => CONDITION_FIELDS.find((f) => f.key === k)?.label ?? k.replace(/_/g, " ");
const ICON: Record<AutomationTrigger, keyof typeof Icons> = {
  "policy.created": "FilePlus2", "policy.days_to_end": "CalendarClock", "proposal.sent_no_reply": "MailQuestion", "document.received": "ScanText",
  "client.created": "UserPlus", "policy.issued": "BadgeCheck", "task.overdue": "AlarmClock",
};

const hours = (min: number) => `${(min / 60).toFixed(1).replace(".", ",")} h`;

function Chip({ children, tone }: { children: React.ReactNode; tone: "trigger" | "cond" | "action" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-2xs font-medium ring-1 ring-inset",
      tone === "trigger" && "bg-brand-50 text-brand-700 ring-brand-100",
      tone === "cond" && "bg-amber-50 text-warn-strong ring-amber-100",
      tone === "action" && "bg-emerald-50 text-ok-strong ring-emerald-100")}>
      {children}
    </span>
  );
}
const Arrow = () => <Icons.ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />;

export default function AutomacoesPage() {
  const { db, today, can, update, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const manage = can("automations.manage");

  const since = addDays(today, -30);
  const stats = useMemo(() => {
    const runs30 = db.automationRuns.filter((r) => r.at.slice(0, 10) >= since);
    const byAuto = new Map<string, { n: number; min: number; last?: string }>();
    for (const r of db.automationRuns) {
      const s = byAuto.get(r.automationId) ?? { n: 0, min: 0 };
      s.n++;
      s.min += r.minutesSaved;
      if (!s.last || r.at > s.last) s.last = r.at;
      byAuto.set(r.automationId, s);
    }
    const count = (id: string) => runs30.filter((r) => r.automationId === id).length;
    const docsWithExtraction = db.documents.filter((d) => d.extraction?.fields.length);
    const avgFields = docsWithExtraction.length ? docsWithExtraction.reduce((s, d) => s + d.extraction!.fields.length, 0) / docsWithExtraction.length : 0;
    const docRuns = count("auto-doc-received") + count("auto-policy-issued");
    return {
      runs30,
      min30: runs30.reduce((s, r) => s + r.minutesSaved, 0),
      byAuto,
      docs: count("auto-doc-received"),
      renewals: db.renewals.filter((r) => r.createdBy === "automacao" && r.createdAt.slice(0, 10) >= since).length,
      followups: count("auto-proposal-followup"),
      fieldsEstimate: Math.round(docRuns * avgFields),
      avgFields,
    };
  }, [db, since]);

  const log = useMemo(() => [...db.automationRuns].filter((r) => !logFilter || r.automationId === logFilter).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50), [db.automationRuns, logFilter]);
  const autoName = (id: string) => db.automations.find((a) => a.id === id)?.name ?? id;

  const toggle = (a: Automation) => {
    if (!manage) return toast("Seu perfil não pode alterar automações", "warn");
    update((d, u) => toggleAutomation(d, u, a.id));
    toast(`Automação ${a.enabled ? "desativada" : "ativada"}`, a.enabled ? "info" : "ok");
  };

  return (
    <div>
      <PageHeader
        icon={<Icons.Workflow className="h-5 w-5" />}
        title="Automações"
        subtitle="Motor de regras QUANDO → SE → ENTÃO. Cada execução registra o trabalho operacional que deixou de ser feito à mão."
        actions={manage ? <Button icon={<Icons.Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nova regra</Button> : <Badge tone="neutral"><Icons.Lock className="h-3 w-3" />Somente leitura</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Horas economizadas" value={hours(stats.min30)} sub="últimos 30 dias" icon={<Icons.Timer className="h-4 w-4" />} tone="warn" />
        <Stat label="Execuções" value={n(stats.runs30.length)} sub={`${n(db.automationRuns.length)} no total`} icon={<Icons.Zap className="h-4 w-4" />} tone="brand" />
        <Stat label="Documentos processados" value={n(stats.docs)} sub="classificados pelo Document AI" icon={<Icons.ScanText className="h-4 w-4" />} />
        <Stat label="Renovações automáticas" value={n(stats.renewals)} sub="iniciadas pelo motor (30 dias)" icon={<Icons.RefreshCw className="h-4 w-4" />} tone="ok" href="/renovacoes" />
        <Stat label="Follow-ups gerados" value={n(stats.followups)} sub="propostas sem resposta" icon={<Icons.MessagesSquare className="h-4 w-4" />} />
        <Stat label="Campos preenchidos" value={<>≈ {n(stats.fieldsEstimate)}</>} sub={<span title={`Execuções de documento × média de ${stats.avgFields.toFixed(1).replace(".", ",")} campos extraídos por documento`}>estimativa · digitação evitada</span>} icon={<Icons.TextCursorInput className="h-4 w-4" />} />
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-100 bg-warn-soft/60 px-4 py-3 text-xs text-ink-soft">
        <Icons.Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <p>
          <b className="font-semibold text-ink">Horas de trabalho operacional economizadas</b> = soma, em cada execução, do tempo que a mesma tarefa levaria se feita manualmente
          (baseline em minutos configurado por regra). É a métrica principal do produto: mede trabalho eliminado, não cliques. Na DEMO os baselines são ilustrativos; em produção serão cronometrados com a equipe e revisados trimestralmente.
        </p>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-ink">Regras</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {db.automations.map((a) => {
          const s = stats.byAuto.get(a.id);
          const I = (Icons[ICON[a.trigger]] ?? Icons.Zap) as Icons.LucideIcon;
          return (
            <section key={a.id} className={cn("flex flex-col rounded-xl border bg-surface p-4 shadow-card transition", a.enabled ? "border-line" : "border-dashed border-line opacity-75")}>
              <div className="flex items-start gap-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", a.enabled ? "bg-brand-50 text-brand-600" : "bg-line-soft text-ink-faint")}><I className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-ink">{a.name}</h3>
                    {a.system ? <Badge tone="neutral">nativa</Badge> : <Badge tone="violet">personalizada</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{a.description}</p>
                </div>
                {manage ? <Toggle checked={a.enabled} onChange={() => toggle(a)} /> : <Badge tone={a.enabled ? "ok" : "neutral"} dot>{a.enabled ? "ativa" : "inativa"}</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">Quando</span>
                <Chip tone="trigger"><Icons.Zap className="h-3 w-3" />{TRIGGER_LABEL[a.trigger]}</Chip>
                {a.conditions.length > 0 && (
                  <>
                    <Arrow />
                    <span className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">Se</span>
                    {a.conditions.map((c, i) => <Chip key={i} tone="cond">{fieldLabel(c.field)} {OP_LABEL[c.op]} {Array.isArray(c.value) ? c.value.join(", ") : String(c.value)}</Chip>)}
                  </>
                )}
                <Arrow />
                <span className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">Então</span>
                {a.actions.map((x) => <Chip key={x} tone="action">{ACTION_LABEL[x]}</Chip>)}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-soft pt-2.5 text-2xs text-ink-muted" style={{ marginTop: "0.875rem" }}>
                <span><b className="font-semibold text-ink tabular-nums">{a.minutesSavedPerRun} min</b> por execução</span>
                <span><b className="font-semibold text-ink tabular-nums">{n(s?.n ?? 0)}</b> execuções</span>
                <span><b className="font-semibold text-ink tabular-nums">{hours(s?.min ?? 0)}</b> economizadas</span>
                {s?.last && <span>última: {dateTime(s.last)}</span>}
                {!a.system && (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-ink-faint">salva · execução nativa apenas na produção</span>
                    {manage && <button onClick={() => { update((d, u) => deleteCustomAutomation(d, u, a.id)); toast("Regra removida", "info"); }} className="rounded p-1 text-ink-muted hover:bg-danger-soft hover:text-danger" title="Remover regra"><Icons.Trash2 className="h-3.5 w-3.5" /></button>}
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Card className="mt-6" padded={false} title="Log de execuções" subtitle="Últimas 50 execuções — cada uma é rastreável até o registro de origem"
        action={<Select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="h-8 w-56 text-xs"><option value="">Todas as automações</option>{db.automations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}>
        {log.length ? (
          <Table className="max-h-[480px]">
            <thead><tr><Th>Data</Th><Th>Automação</Th><Th>Resumo</Th><Th className="text-right">Minutos</Th></tr></thead>
            <tbody>
              {log.map((r) => (
                <tr key={r.id} className="hover:bg-canvas">
                  <Td className="whitespace-nowrap text-xs text-ink-muted tabular-nums">{dateTime(r.at)}</Td>
                  <Td className="max-w-[220px] truncate text-xs font-medium text-ink">{autoName(r.automationId)}</Td>
                  <Td className="text-xs text-ink-soft">{r.summary}</Td>
                  <Td className="text-right text-xs tabular-nums">{r.minutesSaved}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <Empty icon={<Icons.Workflow className="h-5 w-5" />} title="Nenhuma execução registrada">As execuções aparecem aqui assim que uma regra dispara.</Empty>}
      </Card>

      <RuleBuilder open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function RuleBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { update, toast } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("policy.days_to_end");
  const [useCond, setUseCond] = useState(true);
  const [field, setField] = useState("dias_para_vencer");
  const [op, setOp] = useState<Automation["conditions"][number]["op"]>("lte");
  const [value, setValue] = useState("30");
  const [actions, setActions] = useState<AutomationAction[]>(["create_task"]);
  const [minutes, setMinutes] = useState(5);

  const reset = () => { setName(""); setDescription(""); setTrigger("policy.days_to_end"); setUseCond(true); setField("dias_para_vencer"); setOp("lte"); setValue("30"); setActions(["create_task"]); setMinutes(5); };
  const close = () => { reset(); onClose(); };
  const valid = name.trim().length >= 3 && actions.length > 0 && minutes >= 0 && (!useCond || value.trim() !== "");

  const save = () => {
    if (!valid) return;
    const v = value.trim();
    const parsed: string | number | string[] = op === "in" ? v.split(",").map((x) => x.trim()).filter(Boolean) : v !== "" && !isNaN(Number(v)) ? Number(v) : v;
    update((d, u) => createCustomAutomation(d, u, {
      name: name.trim(), description: description.trim() || `Quando ${TRIGGER_LABEL[trigger].toLowerCase()}, ${actions.map((a) => ACTION_LABEL[a].toLowerCase()).join(" e ")}.`,
      trigger, conditions: useCond ? [{ field, op, value: parsed }] : [], actions, minutesSavedPerRun: minutes,
    }).db);
    toast("Regra salva — ativa como regra personalizada");
    close();
  };

  return (
    <Dialog open={open} onClose={close} wide title="Nova regra de automação" footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button onClick={save} disabled={!valid} icon={<Icons.Check className="h-4 w-4" />}>Salvar regra</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da regra"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Auto vencendo em 30 dias → avisar corretor" /></Field>
          <Field label="Minutos economizados por execução" hint="Tempo que a tarefa levaria se feita manualmente (baseline)."><Input type="number" min={0} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))} /></Field>
        </div>

        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-brand-700"><Icons.Zap className="h-3 w-3" />Quando (gatilho)</div>
          <Select value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}>
            {(Object.keys(TRIGGER_LABEL) as AutomationTrigger[]).map((t) => <option key={t} value={t}>{TRIGGER_LABEL[t]}</option>)}
          </Select>
        </div>

        <div className="rounded-xl border border-amber-100 bg-warn-soft/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wide text-warn-strong">Se (condição)</span>
            <Toggle checked={useCond} onChange={setUseCond} label={<span className="text-xs">{useCond ? "com condição" : "sempre"}</span>} />
          </div>
          {useCond && (
            <div className="grid gap-2 sm:grid-cols-[1fr_100px_1fr]">
              <Select value={field} onChange={(e) => setField(e.target.value)} aria-label="Campo">{CONDITION_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</Select>
              <Select value={op} onChange={(e) => setOp(e.target.value as typeof op)} aria-label="Operador">
                <option value="eq">igual a</option><option value="lte">≤ até</option><option value="gte">≥ a partir de</option><option value="in">está em</option>
              </Select>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={op === "in" ? "auto, saude" : "30"} aria-label="Valor" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-ok-soft/60 p-3">
          <div className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ok-strong">Então (ações, em ordem)</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ACTION_LABEL) as AutomationAction[]).map((a) => {
              const on = actions.includes(a);
              return (
                <button key={a} type="button" onClick={() => setActions((cur) => (on ? cur.filter((x) => x !== a) : [...cur, a]))}
                  className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition", on ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-ink-soft ring-line hover:ring-emerald-300")}>
                  {on && <Icons.Check className="h-3 w-3" />}{ACTION_LABEL[a]}
                </button>
              );
            })}
          </div>
          {!actions.length && <p className="mt-1.5 text-2xs text-danger">Selecione ao menos uma ação.</p>}
        </div>

        <Field label="Descrição (opcional)"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que serve esta regra" /></Field>

        <div className="flex gap-2 rounded-lg bg-canvas px-3 py-2 text-2xs text-ink-muted">
          <Icons.Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Regras personalizadas são salvas e auditadas, mas na DEMO apenas as regras nativas executam. Em produção, o mesmo modelo TRIGGER + CONDIÇÃO + AÇÃO é avaliado pelo job de automações (ver docs/AUTOMATIONS.md).
        </div>
      </div>
    </Dialog>
  );
}
