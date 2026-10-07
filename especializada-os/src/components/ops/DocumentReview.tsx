"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExtractedField, PartyRef, ProductLine } from "@/domain/types";
import { useStore } from "@/data/store";
import { confirmExtraction } from "@/data/actions";
import { CONFIDENCE_REVIEW_THRESHOLD, CRITICAL_FIELDS, regexParser } from "@/integrations/document-parsing";
import { Badge, Button, Card, Confidence, Empty, Icons, Input, Select } from "@/components/ui";
import { PartySelect } from "@/components/ops/PartySelect";
import { CHANNEL_LABEL, KIND_LABEL, STATUS_LABEL, identifyParty, sizeLabel, type PartyMatch } from "@/components/ops/doc-ai";
import { PRODUCTS, lineLabel } from "@/domain/products";
import { partyHref, partyName, sameParty, userName } from "@/domain/engines/queries";
import { addDays } from "@/lib/dates";
import { date, dateTime, money, maskCNPJ, maskCPF } from "@/lib/format";
import { cn } from "@/lib/cn";

type Mode = "nova_apolice" | "somente_arquivar";
interface Row extends ExtractedField { checked: boolean; edited?: boolean; manual?: boolean }

const ADDABLE: { key: string; label: string }[] = [
  { key: "insurer", label: "Seguradora" }, { key: "line", label: "Ramo" }, { key: "policyNumber", label: "Nº da apólice" },
  { key: "start", label: "Início de vigência" }, { key: "end", label: "Fim de vigência" }, { key: "premium", label: "Prêmio anual" },
  { key: "commissionPct", label: "Comissão (%)" }, { key: "deductible", label: "Franquia" }, { key: "plate", label: "Placa" }, { key: "capital", label: "Capital segurado" },
];
const DATE_KEYS = ["start", "end", "dueDate"];
const MONEY_KEYS = ["premium", "deductible", "capital", "amount"];

const needsReview = (f: ExtractedField) => f.confidence < CONFIDENCE_REVIEW_THRESHOLD || CRITICAL_FIELDS.includes(f.key);

export function DocumentReview({ docId, onClose }: { docId: string; onClose: () => void }) {
  const { db, today, user, can, visible, update, toast } = useStore();
  const doc = db.documents.find((d) => d.id === docId);
  const [rows, setRows] = useState<Row[]>([]);
  const [party, setParty] = useState<PartyRef | undefined>();
  const [match, setMatch] = useState<PartyMatch | undefined>();
  const [mode, setMode] = useState<Mode>("nova_apolice");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [result, setResult] = useState<{ policyNumber?: string; mode: Mode } | null>(null);
  const editable = !!doc && doc.status === "aguardando_revisao" && can("documents.edit") && !result;

  // carrega campos (ou extrai na hora, se o documento ainda não tiver extração)
  useEffect(() => {
    if (!doc || loaded === doc.id) return;
    let cancel = false;
    const init = (fields: ExtractedField[]) => {
      if (cancel) return;
      const rs = fields.map((f) => ({ ...f, checked: false }));
      setRows(rs);
      const m = identifyParty(db, fields, visible);
      setMatch(m);
      setParty(doc.party ?? m?.party);
      setMode(doc.kind === "apolice" && fields.some((f) => f.key === "policyNumber") ? "nova_apolice" : "somente_arquivar");
      setResult(null);
      setLoaded(doc.id);
    };
    if (doc.extraction) init(doc.extraction.fields);
    else if (doc.textContent) regexParser.parse({ fileName: doc.name, text: doc.textContent, knownInsurers: db.insurers }).then((r) => init(r.fields));
    else init([]);
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, loaded]);

  const f = useMemo(() => Object.fromEntries(rows.map((r) => [r.key, r.value.trim()])) as Record<string, string | undefined>, [rows]);
  const insurer = db.insurers.find((i) => i.name === f.insurer);
  const prev = party && insurer && f.line ? db.policies.find((p) => p.status === "vigente" && sameParty(p.holder, party) && p.line === f.line && p.insurerId === insurer.id) : undefined;

  if (!doc) {
    return (
      <Card>
        <Empty icon={<Icons.FileQuestion className="h-5 w-5" />} title="Documento não encontrado" action={<Button variant="secondary" onClick={onClose}>Voltar para documentos</Button>}>
          O documento pode ter sido removido ou os dados DEMO foram restaurados.
        </Empty>
      </Card>
    );
  }
  if (doc.party && !visible(doc.party)) {
    return <Card><Empty icon={<Icons.Lock className="h-5 w-5" />} title="Fora da sua carteira" action={<Button variant="secondary" onClick={onClose}>Voltar</Button>}>Este documento pertence a um cliente que não está na sua carteira.</Empty></Card>;
  }

  const pending = rows.filter((r) => needsReview(r) && !r.checked);
  const missingForPolicy = mode === "nova_apolice" ? [!f.policyNumber && "Nº da apólice", !insurer && "Seguradora reconhecida", !f.start && "Início de vigência", !f.end && "Fim de vigência", !f.line && "Ramo"].filter(Boolean) as string[] : [];
  const emptyRows = rows.filter((r) => !r.value.trim());
  const blockers = [
    !party && "Selecione o cliente",
    pending.length > 0 && `${pending.length} campo(s) a conferir`,
    emptyRows.length > 0 && `${emptyRows.length} campo(s) sem valor`,
    ...missingForPolicy.map((m) => `Falta: ${m}`),
  ].filter(Boolean) as string[];

  const setRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addField = (key: string) => {
    const a = ADDABLE.find((x) => x.key === key);
    if (!a || rows.some((r) => r.key === key)) return;
    setRows((rs) => [...rs, { key, label: a.label, value: "", confidence: 1, checked: false, manual: true }]);
  };
  const removeField = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const confirm = () => {
    if (!party || blockers.length) return;
    const fields: ExtractedField[] = rows.map(({ key, label, value, confidence, edited, manual }) => ({ key, label, value: value.trim(), confidence: edited || manual ? 1 : confidence }));
    update((d, u) => confirmExtraction(d, u, doc.id, fields, { party, mode }));
    setResult({ policyNumber: mode === "nova_apolice" ? f.policyNumber : undefined, mode });
    toast(mode === "nova_apolice" ? `Apólice ${f.policyNumber} cadastrada a partir do documento` : "Documento revisado e arquivado no cliente");
  };

  const createdPolicy = result?.policyNumber ? db.policies.find((p) => p.number === result.policyNumber && p.dataSource.kind === "document-ai") : doc.policyId ? db.policies.find((p) => p.id === doc.policyId) : undefined;
  const monthlyComm = f.premium && f.commissionPct ? (Number(f.premium) * Number(f.commissionPct)) / 100 / 12 : undefined;
  const missingAddable = ADDABLE.filter((a) => !rows.some((r) => r.key === a.key));

  return (
    <div className="space-y-4">
      {/* Cabeçalho do documento */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" icon={<Icons.ArrowLeft className="h-4 w-4" />} onClick={onClose}>Documentos</Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icons.FileText className="h-4 w-4 shrink-0 text-ink-muted" />
          <h2 className="truncate text-base font-semibold text-ink">{doc.name}</h2>
          <Badge tone={doc.status === "aguardando_revisao" ? "warn" : doc.status === "processado" ? "ok" : "neutral"} dot>{STATUS_LABEL[doc.status]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-muted">
          <span>{KIND_LABEL[doc.kind]}</span>
          <span>{CHANNEL_LABEL[doc.channel]}</span>
          <span>{sizeLabel(doc.sizeKb)}</span>
          <span>{dateTime(doc.uploadedAt)} · {userName(db, doc.uploadedBy)}</span>
        </div>
      </div>

      {result && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-ok-soft px-4 py-3">
          <Icons.CheckCircle2 className="h-5 w-5 text-ok" />
          <div className="min-w-0 flex-1 text-sm">
            <b className="font-semibold text-ink">{result.mode === "nova_apolice" ? (createdPolicy ? `Apólice ${createdPolicy.number} cadastrada` : "Documento revisado") : "Documento arquivado"}</b>
            <span className="text-ink-soft"> · campos confirmados por {user?.name ?? "você"}, registrado na auditoria{result.mode === "nova_apolice" && createdPolicy ? `, renovação programada e 12 comissões previstas` : ""}.</span>
            {result.mode === "nova_apolice" && !createdPolicy && <div className="mt-0.5 text-xs text-warn-strong">A apólice não foi criada: verifique seguradora, número e vigência.</div>}
          </div>
          <div className="flex gap-2">
            {createdPolicy && <Link href={`/apolices/${createdPolicy.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-xs font-medium text-white hover:bg-brand-700">Abrir apólice<Icons.ArrowRight className="h-3.5 w-3.5" /></Link>}
            {party && <Link href={partyHref(party)} className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-ink hover:bg-canvas">Ver cliente</Link>}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Pré-visualização */}
        <Card padded={false} title="Documento" subtitle={doc.textContent ? "Texto lido pelo extrator" : "Pré-visualização indisponível"} className="lg:sticky lg:top-4 lg:self-start">
          {doc.textContent ? (
            <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words bg-canvas px-4 py-3 font-mono text-xs leading-relaxed text-ink-soft">{doc.textContent}</pre>
          ) : (
            <div className="px-4 py-8 text-center text-xs text-ink-muted">
              <Icons.FileImage className="mx-auto mb-2 h-6 w-6 text-ink-faint" />
              {doc.mime} · {sizeLabel(doc.sizeKb)}<br />
              Na DEMO apenas documentos de texto são lidos pelo extrator. Em produção, PDFs e imagens passam por OCR + LLM (docs/AI_ARCHITECTURE.md).
            </div>
          )}
          {doc.extraction && <div className="border-t border-line-soft px-4 py-2 text-2xs text-ink-muted">Extrator: <span className="font-mono">{doc.extraction.parser}</span> · {dateTime(doc.extraction.at)}{doc.extraction.reviewedBy && <> · revisado por {userName(db, doc.extraction.reviewedBy)}</>}</div>}
        </Card>

        <div className="space-y-4">
          {/* Campos extraídos */}
          <Card padded={false} title="Campos extraídos" subtitle={editable ? "Edite o que for preciso e marque como conferido" : "Valores registrados"}
            action={editable && pending.length > 0 ? <button onClick={() => setRows((rs) => rs.map((r) => ({ ...r, checked: true })))} className="text-xs font-medium text-brand-700 hover:underline">Marcar todos como conferidos</button> : undefined}>
            {rows.length ? (
              <div className="divide-y divide-line-soft">
                {rows.map((r) => {
                  const review = needsReview(r);
                  const critical = CRITICAL_FIELDS.includes(r.key);
                  return (
                    <div key={r.key} className={cn("grid items-center gap-2 px-4 py-2.5 sm:grid-cols-[140px_minmax(0,1fr)_auto]", editable && review && !r.checked && "bg-warn-soft/40")}>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-ink">{r.label}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {r.manual ? <Badge tone="brand">manual</Badge> : <Confidence value={r.confidence} />}
                          {r.edited && <Badge tone="brand">editado</Badge>}
                        </div>
                      </div>
                      <div className="min-w-0">
                        {editable ? <FieldInput row={r} onChange={(value) => setRow(r.key, { value, edited: !r.manual, checked: true })} /> : <span className="text-sm text-ink">{display(r)}</span>}
                        {review && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {critical ? <Badge tone="danger">crítico — confirmação obrigatória</Badge> : <Badge tone="warn">revisar · confiança abaixo de {Math.round(CONFIDENCE_REVIEW_THRESHOLD * 100)}%</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-self-end">
                        {editable && (review || r.manual) ? (
                          <label className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", r.checked ? "bg-ok-soft text-ok-strong ring-emerald-200" : "bg-white text-ink-soft ring-line")}>
                            <input type="checkbox" className="h-3.5 w-3.5 accent-emerald-600" checked={r.checked} onChange={(e) => setRow(r.key, { checked: e.target.checked })} />
                            conferido
                          </label>
                        ) : !editable && doc.extraction?.reviewedBy ? <Icons.CheckCircle2 className="h-4 w-4 text-ok" /> : null}
                        {editable && r.manual && <button onClick={() => removeField(r.key)} className="rounded p-1 text-ink-faint hover:text-danger" title="Remover campo"><Icons.X className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon={<Icons.ScanText className="h-5 w-5" />} title="Nenhum campo extraído">{doc.textContent ? "O extrator não encontrou campos reconhecíveis. Adicione manualmente os campos necessários." : "Arquivo sem texto legível na DEMO."}</Empty>
            )}
            {editable && missingAddable.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-line-soft px-4 py-2.5">
                <span className="text-2xs text-ink-muted">Não encontrado no documento — adicionar manualmente:</span>
                {missingAddable.map((a) => (
                  <button key={a.key} onClick={() => addField(a.key)} className="rounded-md border border-dashed border-line px-1.5 py-0.5 text-2xs text-ink-soft hover:border-brand-300 hover:text-brand-700">+ {a.label}</button>
                ))}
              </div>
            )}
          </Card>

          {/* Cliente */}
          <Card title="Cliente" subtitle="Identificação automática pelo documento">
            {match ? (
              <div className={cn("mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs", match.certain ? "bg-ok-soft text-ok-strong" : "bg-warn-soft text-warn-strong")}>
                {match.certain ? <Icons.BadgeCheck className="h-4 w-4" /> : <Icons.HelpCircle className="h-4 w-4" />}
                <span><b className="font-semibold">{partyName(db, match.party)}</b> — {match.certain ? `identificado por ${match.by}` : `possível correspondência por nome (${Math.round((match.score ?? 0) * 100)}%) — confirme`}</span>
                {match.certain && (match.by === "CPF" ? <span className="ml-auto font-mono">{maskCPF(f.cpf ?? "")}</span> : match.by === "CNPJ" ? <span className="ml-auto font-mono">{maskCNPJ(f.cnpj ?? "")}</span> : null)}
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-line-soft px-3 py-2 text-xs text-ink-soft"><Icons.UserX className="h-4 w-4" />Nenhum cliente da sua carteira corresponde ao CPF/CNPJ ou nome do documento. Selecione abaixo ou cadastre o cliente antes.</div>
            )}
            {editable ? (
              <PartySelect value={party} onChange={setParty} includeRelated />
            ) : party ? <Link href={partyHref(party)} className="text-sm font-medium text-brand-700 hover:underline">{partyName(db, party)}</Link> : <span className="text-sm text-ink-muted">Sem cliente vinculado</span>}
            {editable && party && match && !sameParty(party, match.party) && <p className="mt-1.5 text-2xs text-warn-strong">Você escolheu um cliente diferente do identificado no documento.</p>}
          </Card>

          {/* O que vai acontecer */}
          {editable && (
            <Card title="O que vai acontecer" subtitle="Calculado a partir dos campos acima — nada é gravado antes da sua confirmação">
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {([["nova_apolice", "Cadastrar apólice", "Cria a apólice, renovação e comissões"], ["somente_arquivar", "Somente arquivar", "Vincula o documento ao cliente"]] as const).map(([v, label, hint]) => (
                  <button key={v} type="button" onClick={() => setMode(v)} className={cn("rounded-lg border p-3 text-left transition", mode === v ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-100" : "border-line hover:border-brand-300")}>
                    <div className="text-sm font-medium text-ink">{label}</div>
                    <div className="text-2xs text-ink-muted">{hint}</div>
                  </button>
                ))}
              </div>
              {mode === "nova_apolice" ? (
                <ul className="space-y-2 text-sm">
                  <Step icon="RefreshCw" ok>
                    {prev ? <>Renovação: a apólice <Link href={`/apolices/${prev.id}`} className="font-medium text-brand-700 hover:underline">{prev.number}</Link> será marcada como renovada e a nova vigência cadastrada.</> : <>Nova apólice {f.policyNumber ? <b className="font-medium">{f.policyNumber}</b> : ""} será cadastrada{party ? <> para <b className="font-medium">{partyName(db, party)}</b></> : ""}.</>}
                  </Step>
                  {f.start && f.end && <Step icon="CalendarRange" ok>Vigência {date(f.start)} a {date(f.end)} · {insurer?.short ?? "—"} · {f.line ? lineLabel(f.line as ProductLine) : "—"} · status {f.start > today ? "em emissão" : "vigente"}.</Step>}
                  {f.end && <Step icon="CalendarClock" ok>Renovação será programada automaticamente para {date(addDays(f.end, -60))}.</Step>}
                  <Step icon="Wallet" ok>12 comissões previstas{monthlyComm ? ` de ${money(monthlyComm)}/mês` : f.commissionPct ? "" : " (comissão não informada — serão previstas como R$ 0,00)"}.</Step>
                  {missingForPolicy.length > 0 && <Step icon="AlertTriangle">Para cadastrar a apólice faltam: {missingForPolicy.join(", ")}.</Step>}
                </ul>
              ) : (
                <ul className="space-y-2 text-sm"><Step icon="Archive" ok>O documento será arquivado {party ? <>em <b className="font-medium">{partyName(db, party)}</b></> : "no cliente selecionado"}, sem alterar apólices.</Step></ul>
              )}
            </Card>
          )}

          {editable && (
            <div className="rounded-xl border border-line bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2 text-xs text-ink-muted">
                  <Icons.ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span><b className="font-medium text-ink">Nunca gravamos silenciosamente:</b> campos críticos exigem confirmação humana. A confirmação fica registrada na auditoria.</span>
                </div>
                <Button onClick={confirm} disabled={blockers.length > 0} icon={<Icons.Check className="h-4 w-4" />}>{mode === "nova_apolice" ? "Confirmar e cadastrar" : "Confirmar e arquivar"}</Button>
              </div>
              {blockers.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{blockers.map((b) => <Badge key={b} tone="warn">{b}</Badge>)}</div>}
            </div>
          )}
          {!editable && !result && doc.status === "aguardando_revisao" && <p className="text-xs text-ink-muted">Seu perfil não pode confirmar extrações (permissão “Enviar/confirmar documentos”).</p>}
          {!result && doc.status !== "aguardando_revisao" && createdPolicy && (
            <Link href={`/apolices/${createdPolicy.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-card hover:border-brand-300">
              <Icons.ShieldCheck className="h-4 w-4 text-ok" />Vinculado à apólice <b className="font-medium">{createdPolicy.number}</b><Icons.ArrowRight className="ml-auto h-4 w-4 text-ink-faint" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function display(r: Row) {
  if (r.key === "line") return lineLabel(r.value as ProductLine);
  if (DATE_KEYS.includes(r.key)) return date(r.value);
  if (MONEY_KEYS.includes(r.key) && !isNaN(Number(r.value))) return money(Number(r.value));
  if (r.key === "commissionPct") return `${r.value}%`;
  return r.value || "—";
}

function FieldInput({ row, onChange }: { row: Row; onChange: (v: string) => void }) {
  const { db } = useStore();
  if (row.key === "insurer") {
    const known = db.insurers.some((i) => i.name === row.value);
    return (
      <Select value={known ? row.value : ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm">
        <option value="">{row.value && !known ? `"${row.value}" não reconhecida — selecione` : "Selecione…"}</option>
        {db.insurers.map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
      </Select>
    );
  }
  if (row.key === "line") {
    return (
      <Select value={row.value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm">
        <option value="">Selecione…</option>
        {PRODUCTS.map((p) => <option key={p.line} value={p.line}>{p.label}</option>)}
      </Select>
    );
  }
  if (DATE_KEYS.includes(row.key)) return <Input type="date" value={row.value} onChange={(e) => onChange(e.target.value)} className="h-8" />;
  const numeric = MONEY_KEYS.includes(row.key) || row.key === "commissionPct";
  return (
    <div className="relative">
      {MONEY_KEYS.includes(row.key) && <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-ink-faint">R$</span>}
      <Input value={row.value} inputMode={numeric ? "decimal" : undefined} onChange={(e) => onChange(numeric ? e.target.value.replace(",", ".") : e.target.value)} className={cn("h-8", MONEY_KEYS.includes(row.key) && "pl-8", ["cpf", "cnpj", "policyNumber", "plate"].includes(row.key) && "font-mono text-xs")} />
      {row.key === "commissionPct" && <span className="pointer-events-none absolute right-2.5 top-1.5 text-xs text-ink-faint">%</span>}
    </div>
  );
}

function Step({ icon, ok, children }: { icon: keyof typeof Icons; ok?: boolean; children: React.ReactNode }) {
  const I = Icons[icon] as Icons.LucideIcon;
  return (
    <li className="flex gap-2.5">
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", ok ? "bg-brand-50 text-brand-600" : "bg-warn-soft text-warn")}><I className="h-3 w-3" /></span>
      <span className="text-ink-soft">{children}</span>
    </li>
  );
}
