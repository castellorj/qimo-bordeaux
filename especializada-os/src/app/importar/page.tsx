"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/data/store";
import { tooLarge, UPLOAD_LIMITS } from "@/lib/security";
import { fillSample } from "@/data/seed";
import { applyImport, resolveInsurer, resolveLine, type ImportReport } from "@/data/actions-ops";
import { analyzeRows, guessMapping, parseCSV, SAMPLE_IMPORT_CSV, TARGET_LABEL, type ImportRowResult, type TargetField } from "@/domain/engines/importer";
import { Badge, Button, Card, Confidence, DemoBadge, Empty, Icons, PageHeader, Select, Stat, Table, Tabs, Td, Th } from "@/components/ui";
import { lineLabel } from "@/domain/products";
import { cn } from "@/lib/cn";

const STEPS = ["Upload", "Identificar colunas", "Matching & duplicados", "Preview & validação", "Importação", "Relatório"] as const;
type Action = ImportRowResult["action"];

export default function ImportarPage() {
  const { can } = useStore();
  const [tab, setTab] = useState<"carteira" | "rede">("carteira");
  if (!can("import.run")) {
    return (
      <div>
        <PageHeader icon={<Icons.Upload className="h-5 w-5" />} title="Data Import Center" />
        <Card><Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não pode importar carteira (permissão “Importar carteira”).</Empty></Card>
      </div>
    );
  }
  return (
    <div>
      <PageHeader
        icon={<Icons.Upload className="h-5 w-5" />}
        title="Data Import Center"
        subtitle="Traga a carteira de planilhas e sistemas antigos com segurança: nada crítico é importado às cegas e nada existente é sobrescrito em silêncio."
      />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "carteira", label: "Carteira (clientes e apólices)" }, { value: "rede", label: "Rede credenciada" }]} /></div>
      {tab === "carteira" ? <Wizard /> : (
        <Card>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Icons.MapPinned className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink">Importador de rede credenciada</h3>
              <p className="mt-0.5 text-sm text-ink-muted">Planilhas, CSV e guias em PDF das operadoras são importados no módulo Rede Credenciada, com deduplicação de prestadores por similaridade de nome, data de validade da fonte e nível de confiança.</p>
            </div>
            <Link href="/rede" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white hover:bg-brand-700">Abrir Rede Credenciada<Icons.ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step, onGo, maxReached }: { step: number; onGo: (s: number) => void; maxReached: number }) {
  return (
    <ol className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1.5 shadow-card">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const reachable = i <= maxReached && step < 5;
        return (
          <li key={s} className="min-w-0 flex-1">
            <button disabled={!reachable} onClick={() => onGo(i)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition", active ? "bg-brand-50" : reachable ? "hover:bg-canvas" : "cursor-default")}>
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold", done ? "bg-ok text-white" : active ? "bg-brand-600 text-white" : "bg-line-soft text-ink-muted")}>
                {done ? <Icons.Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-xs font-medium", active ? "text-brand-700" : done ? "text-ink" : "text-ink-muted")}>{s}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Wizard() {
  const { db, today, user, update, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [table, setTable] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<{ field: TargetField; confidence: number }[]>([]);
  const [overrides, setOverrides] = useState<Record<number, Action>>({});
  const [report, setReport] = useState<ImportReport | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const headers = table[0] ?? [];
  const body = table.slice(1);
  const fields = mapping.map((m) => m.field);
  const analyzed = useMemo(() => (body.length && mapping.length ? analyzeRows(db, body, fields) : []), [db, body, fields, mapping.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = analyzed.map((r) => ({ ...r, action: overrides[r.index] ?? r.action }));

  const go = (s: number) => { setStep(s); setMaxReached((m) => Math.max(m, s)); };
  const load = (name: string, text: string) => {
    const t = parseCSV(text);
    if (t.length < 2) { setFileError("Arquivo sem linhas de dados (é preciso um cabeçalho e ao menos uma linha)."); return; }
    setFileError("");
    setFileName(name);
    setTable(t);
    setMapping(guessMapping(t[0]));
    setOverrides({});
    setReport(null);
    setMaxReached(1);
    setStep(1);
  };
  const onFile = (f?: File) => {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name) && !f.type.includes("csv") && !f.type.startsWith("text/")) {
      setFileError(`"${f.name}" não é CSV. Na DEMO a importação aceita CSV (separado por ; ou ,). Em produção XLSX e PDF são convertidos automaticamente.`);
      return;
    }
    if (tooLarge(f, UPLOAD_LIMITS.spreadsheetBytes)) { setFileError(`"${f.name}" tem mais de 5 MB. Divida o arquivo ou importe em lotes.`); return; }
    const r = new FileReader();
    r.onload = () => load(f.name, String(r.result ?? ""));
    r.onerror = () => setFileError("Não foi possível ler o arquivo.");
    r.readAsText(f);
  };
  const restart = () => { setStep(0); setMaxReached(0); setTable([]); setMapping([]); setOverrides({}); setReport(null); setFileName(""); };

  const runImport = () => {
    const res = applyImport(db, user, rows, today);
    update(() => res.db);
    setReport(res.report);
    toast(`Importação concluída: ${res.report.created.length} criado(s), ${res.report.updated.length} atualizado(s)`);
    go(5);
  };

  const count = (a: Action) => rows.filter((r) => r.action === a).length;
  const mappedRequired = fields.includes("name");
  const dupInFile = rows.filter((r) => r.warnings.some((w) => w.startsWith("CPF repetido")));

  return (
    <div>
      <Stepper step={step} onGo={go} maxReached={maxReached} />

      {step === 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="1. Envie a planilha" subtitle="Clientes e, opcionalmente, apólices — uma linha por cliente/apólice">
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }} className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line px-4 py-10 text-center hover:border-brand-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icons.FileSpreadsheet className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-medium text-ink">Arraste um arquivo CSV ou selecione</p>
                <p className="mt-0.5 text-xs text-ink-muted">Separador ; ou , · cabeçalho na primeira linha · datas dd/mm/aaaa</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" icon={<Icons.Paperclip className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Selecionar CSV</Button>
                <Button icon={<Icons.FlaskConical className="h-4 w-4" />} onClick={() => load("planilha_exemplo_carteira.csv", fillSample(SAMPLE_IMPORT_CSV, db.persons))}>Usar planilha de exemplo</Button>
              </div>
              {fileError && <p className="max-w-md text-xs text-danger">{fileError}</p>}
            </div>
          </Card>
          <Card title="Como funciona" subtitle="Segurança antes de velocidade">
            <ul className="space-y-2.5 text-sm text-ink-soft">
              {[
                ["Columns3", "Colunas identificadas automaticamente por sinônimos — você ajusta."],
                ["Fingerprint", "Matching com a base por CPF, CNPJ, e-mail, telefone ou nome."],
                ["ShieldAlert", "Erros (CPF inválido, datas) bloqueiam a linha; avisos ficam em destaque."],
                ["GitMerge", "Atualizações só preenchem campos vazios; divergências viram conflitos para revisão."],
                ["RefreshCw", "Apólices importadas entram no motor de renovação automaticamente."],
              ].map(([icon, text]) => {
                const I = Icons[icon as keyof typeof Icons] as Icons.LucideIcon;
                return <li key={text} className="flex gap-2"><I className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{text}</li>;
              })}
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-2xs text-ink-muted"><DemoBadge className="shrink-0" />A DEMO aceita CSV. Em produção, XLSX e PDF (relatórios de sistemas legados e seguradoras) são suportados via conversão.</div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <Card title="2. Identificar colunas" subtitle={<>{fileName} · {body.length} linha(s) · {headers.length} coluna(s). Ajuste o destino de cada coluna.</>}
          action={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => go(0)}>Voltar</Button><Button size="sm" disabled={!mappedRequired} onClick={() => go(2)}>Continuar<Icons.ArrowRight className="h-3.5 w-3.5" /></Button></div>}>
          {!mappedRequired && <div className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-red-700">Mapeie ao menos a coluna de <b>Nome / Razão social</b> para continuar.</div>}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {headers.map((h, i) => {
              const m = mapping[i];
              const used = mapping.filter((x, j) => j !== i && x.field === m.field && m.field !== "ignore").length > 0;
              return (
                <div key={i} className={cn("rounded-lg border p-3", m.field === "ignore" ? "border-dashed border-line bg-canvas" : "border-line")}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{h || `(coluna ${i + 1})`}</span>
                    {m.confidence > 0 ? <Confidence value={m.confidence} /> : <span className="text-2xs text-ink-faint">não reconhecida</span>}
                  </div>
                  <Select value={m.field} onChange={(e) => setMapping((cur) => cur.map((x, j) => (j === i ? { field: e.target.value as TargetField, confidence: 1 } : x)))} className="h-8 text-sm">
                    {(Object.keys(TARGET_LABEL) as TargetField[]).map((t) => <option key={t} value={t}>{TARGET_LABEL[t]}</option>)}
                  </Select>
                  <div className="mt-1.5 truncate text-2xs text-ink-muted">ex.: {body.map((r) => r[i]).filter(Boolean).slice(0, 2).join(" · ") || "—"}</div>
                  {used && <div className="mt-1 text-2xs text-warn-strong">Destino usado por outra coluna</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Linhas" value={rows.length} icon={<Icons.Rows3 className="h-4 w-4" />} />
            <Stat label="Já existem na base" value={rows.filter((r) => r.match).length} sub="serão atualizadas" icon={<Icons.Fingerprint className="h-4 w-4" />} tone="brand" />
            <Stat label="Novos clientes" value={rows.filter((r) => !r.match && !r.errors.length).length} icon={<Icons.UserPlus className="h-4 w-4" />} tone="ok" />
            <Stat label="Duplicados na planilha" value={dupInFile.length} icon={<Icons.Copy className="h-4 w-4" />} tone={dupInFile.length ? "warn" : undefined} />
          </div>
          <Card padded={false} title="3. Matching com a base e duplicados" subtitle="Correspondências encontradas — nenhuma linha é mesclada sem a sua revisão"
            action={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => go(1)}>Voltar</Button><Button size="sm" onClick={() => go(3)}>Continuar<Icons.ArrowRight className="h-3.5 w-3.5" /></Button></div>}>
            <Table>
              <thead><tr><Th>Linha</Th><Th>Nome na planilha</Th><Th>Correspondência</Th><Th>Critério</Th><Th>Observações</Th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index}>
                    <Td className="text-xs text-ink-muted tabular-nums">{r.index + 2}</Td>
                    <Td className="text-sm font-medium text-ink">{r.values.name ?? <span className="text-ink-faint">—</span>}</Td>
                    <Td className="text-sm">{r.match ? <Link href={r.match.type === "person" ? `/clientes/${r.match.id}` : `/empresas/${r.match.id}`} className="text-brand-700 hover:underline">{r.match.name}</Link> : <span className="text-ink-muted">nenhuma — novo cadastro</span>}</Td>
                    <Td>{r.match ? <Badge tone={r.match.by.startsWith("nome") ? "warn" : "ok"}>encontrado por {r.match.by}</Badge> : <span className="text-2xs text-ink-faint">—</span>}</Td>
                    <Td className="text-xs">{[...r.warnings].map((w) => <div key={w} className="text-warn-strong">{w}</div>)}{r.errors.map((e) => <div key={e} className="text-danger">{e}</div>)}{!r.warnings.length && !r.errors.length && <span className="text-ink-faint">—</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card padded={false} title="4. Preview e validação" subtitle="Defina a ação de cada linha. Erros em vermelho bloqueiam a linha; avisos em âmbar pedem atenção."
          action={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => go(2)}>Voltar</Button><Button size="sm" onClick={() => go(4)}>Continuar<Icons.ArrowRight className="h-3.5 w-3.5" /></Button></div>}>
          <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-2.5 text-xs">
            <Badge tone="ok">{count("criar")} criar</Badge><Badge tone="brand">{count("atualizar")} atualizar</Badge><Badge tone="neutral">{count("ignorar")} ignorar</Badge>
          </div>
          <Table>
            <thead><tr><Th>Linha</Th><Th>Ação</Th><Th>Nome</Th><Th>CPF</Th><Th>Contato</Th><Th>Apólice</Th><Th>Validação</Th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const v = r.values;
                const ins = resolveInsurer(db, v.insurer);
                const line = resolveLine(v.line);
                return (
                  <tr key={r.index} className={cn(r.errors.length ? "bg-danger-soft/40" : r.warnings.length ? "bg-warn-soft/40" : "", r.action === "ignorar" && "opacity-70")}>
                    <Td className="text-xs text-ink-muted tabular-nums">{r.index + 2}</Td>
                    <Td className="w-36">
                      <Select value={r.action} onChange={(e) => setOverrides((o) => ({ ...o, [r.index]: e.target.value as Action }))} className="h-8 text-xs">
                        <option value="criar" disabled={r.errors.length > 0}>Criar novo</option>
                        <option value="atualizar" disabled={!r.match || r.errors.length > 0}>Atualizar existente</option>
                        <option value="ignorar">Ignorar</option>
                      </Select>
                      {r.action === "criar" && r.match && <div className="mt-1 text-2xs text-warn-strong">Já existe {r.match.name} — risco de duplicar</div>}
                    </Td>
                    <Td className="text-sm font-medium text-ink">{v.name ?? <span className="text-danger">ausente</span>}{r.match && <div className="text-2xs font-normal text-ink-muted">↔ {r.match.name} ({r.match.by})</div>}</Td>
                    <Td className="whitespace-nowrap font-mono text-2xs">{v.cpf ?? "—"}</Td>
                    <Td className="text-2xs text-ink-soft">{v.phone && <div>{v.phone}</div>}{v.email && <div>{v.email}</div>}{!v.phone && !v.email && "—"}</Td>
                    <Td className="text-2xs text-ink-soft">
                      {v.policyNumber ? (
                        <>
                          <div className="font-mono">{v.policyNumber}</div>
                          <div>{ins?.short ?? <span className="text-warn-strong">{v.insurer ?? "seguradora?"}</span>} · {line ? lineLabel(line) : v.line ?? "ramo?"}</div>
                          <div>{v.start && v.end ? `${v.start} → ${v.end}` : <span className="text-warn-strong">sem vigência — apólice não será criada</span>}</div>
                        </>
                      ) : "—"}
                    </Td>
                    <Td className="text-xs">
                      {r.errors.map((e) => <div key={e} className="flex items-center gap-1 text-danger"><Icons.XCircle className="h-3 w-3" />{e}</div>)}
                      {r.warnings.map((w) => <div key={w} className="flex items-center gap-1 text-warn-strong"><Icons.AlertTriangle className="h-3 w-3" />{w}</div>)}
                      {!r.errors.length && !r.warnings.length && <span className="flex items-center gap-1 text-ok"><Icons.CheckCircle2 className="h-3 w-3" />ok</span>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {step === 4 && (
        <Card title="5. Importação" subtitle="Revise o resumo e confirme">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryBox icon="UserPlus" tone="ok" value={count("criar")} label="clientes serão criados" hint="status ativo · origem “Importação”" />
            <SummaryBox icon="GitMerge" tone="brand" value={count("atualizar")} label="cadastros serão atualizados" hint="somente campos vazios — divergências viram conflitos" />
            <SummaryBox icon="Ban" tone="neutral" value={count("ignorar")} label="linhas ignoradas" hint="erros de validação ou escolha sua" />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
            <li className="flex gap-2"><Icons.ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />Apólices só são criadas com seguradora, nº e vigência completos e se o número ainda não existir.</li>
            <li className="flex gap-2"><Icons.RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />Após importar, o motor de automações programa as renovações e as comissões previstas.</li>
            <li className="flex gap-2"><Icons.ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />Tudo fica registrado na auditoria com origem “importação”.</li>
          </ul>
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line-soft pt-4">
            <Button variant="secondary" onClick={() => go(3)}>Voltar</Button>
            <Button onClick={runImport} disabled={count("criar") + count("atualizar") === 0} icon={<Icons.Upload className="h-4 w-4" />}>Importar {count("criar") + count("atualizar")} linha(s)</Button>
          </div>
        </Card>
      )}

      {step === 5 && report && <Report report={report} onRestart={restart} />}
    </div>
  );
}

function SummaryBox({ icon, tone, value, label, hint }: { icon: keyof typeof Icons; tone: "ok" | "brand" | "neutral"; value: number; label: string; hint: string }) {
  const I = Icons[icon] as Icons.LucideIcon;
  return (
    <div className="rounded-xl border border-line p-4">
      <I className={cn("h-5 w-5", tone === "ok" ? "text-ok" : tone === "brand" ? "text-brand-600" : "text-ink-muted")} />
      <div className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="text-sm text-ink">{label}</div>
      <div className="mt-0.5 text-2xs text-ink-muted">{hint}</div>
    </div>
  );
}

function Report({ report, onRestart }: { report: ImportReport; onRestart: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-ok-soft px-4 py-3">
        <Icons.CheckCircle2 className="h-5 w-5 text-ok" />
        <p className="min-w-0 flex-1 text-sm text-ink"><b className="font-semibold">Importação concluída.</b> <span className="text-ink-soft">Registrada na auditoria. {report.conflicts.length ? `${report.conflicts.length} conflito(s) aguardam revisão humana.` : "Nenhum conflito pendente."}</span></p>
        <Button variant="secondary" size="sm" icon={<Icons.RotateCcw className="h-3.5 w-3.5" />} onClick={onRestart}>Nova importação</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Criados" value={report.created.length} icon={<Icons.UserPlus className="h-4 w-4" />} tone="ok" />
        <Stat label="Atualizados" value={report.updated.length} icon={<Icons.GitMerge className="h-4 w-4" />} tone="brand" />
        <Stat label="Ignorados" value={report.ignored.length} icon={<Icons.Ban className="h-4 w-4" />} />
        <Stat label="Apólices" value={report.policies.length} icon={<Icons.ShieldCheck className="h-4 w-4" />} tone="ok" />
        <Stat label="Renovações abertas" value={report.renewalsCreated} sub="pelo motor de automações" icon={<Icons.RefreshCw className="h-4 w-4" />} />
        <Stat label="Conflitos" value={report.conflicts.length} sub="para revisão" icon={<Icons.AlertTriangle className="h-4 w-4" />} tone={report.conflicts.length ? "warn" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false} title="Conflitos para revisão" subtitle="Valores diferentes do cadastro — NÃO foram alterados">
          {report.conflicts.length ? (
            <Table>
              <thead><tr><Th>Linha</Th><Th>Cliente</Th><Th>Campo</Th><Th>No sistema</Th><Th>Na planilha</Th></tr></thead>
              <tbody>{report.conflicts.map((c, i) => <tr key={i}><Td className="text-xs text-ink-muted">{c.row}</Td><Td className="text-sm">{c.name}</Td><Td className="text-xs">{c.field}</Td><Td className="text-xs text-ink-soft">{c.current}</Td><Td className="text-xs font-medium text-warn-strong">{c.incoming}</Td></tr>)}</tbody>
            </Table>
          ) : <Empty icon={<Icons.CheckCheck className="h-5 w-5" />} title="Sem conflitos">Nenhum dado divergente do cadastro existente.</Empty>}
        </Card>
        <Card padded={false} title="Erros e linhas ignoradas">
          {report.errors.length || report.ignored.length || report.policyIssues.length ? (
            <div className="divide-y divide-line-soft">
              {report.errors.map((e) => <div key={`e${e.row}`} className="flex gap-2 px-4 py-2 text-sm"><Icons.XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /><span><b className="font-medium">Linha {e.row}</b> · {e.name}: <span className="text-danger">{e.messages.join(", ")}</span></span></div>)}
              {report.ignored.filter((x) => !report.errors.some((e) => e.row === x.row)).map((x) => <div key={`i${x.row}`} className="flex gap-2 px-4 py-2 text-sm"><Icons.Ban className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" /><span><b className="font-medium">Linha {x.row}</b> · {x.name}: {x.reason}</span></div>)}
              {report.policyIssues.map((p, i) => <div key={`p${i}`} className="flex gap-2 px-4 py-2 text-sm"><Icons.AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" /><span><b className="font-medium">Linha {p.row}</b> · {p.message}</span></div>)}
            </div>
          ) : <Empty icon={<Icons.CheckCheck className="h-5 w-5" />} title="Nenhum erro" />}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false} title="Clientes criados e atualizados">
          <div className="divide-y divide-line-soft">
            {report.created.map((c) => <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-canvas"><Badge tone="ok">criado</Badge><span className="flex-1 truncate">{c.name}</span><span className="text-2xs text-ink-muted">linha {c.row}</span></Link>)}
            {report.updated.map((c) => <Link key={`${c.id}-${c.row}`} href={`/clientes/${c.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-canvas"><Badge tone="brand">atualizado</Badge><span className="flex-1 truncate">{c.name}</span><span className="text-2xs text-ink-muted">{c.fields.length ? `preenchido: ${c.fields.join(", ")}` : "sem campos novos"}</span></Link>)}
            {!report.created.length && !report.updated.length && <Empty title="Nenhum cliente alterado" />}
          </div>
        </Card>
        <Card padded={false} title="Apólices importadas">
          <div className="divide-y divide-line-soft">
            {report.policies.map((p) => <Link key={p.id} href={`/apolices/${p.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-canvas"><Icons.ShieldCheck className="h-4 w-4 text-ok" /><span className="flex-1 font-mono text-xs">{p.number}</span><span className="text-2xs text-ink-muted">linha {p.row}</span></Link>)}
            {!report.policies.length && <Empty title="Nenhuma apólice importada" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
