"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { tooLarge, UPLOAD_LIMITS } from "@/lib/security";
import { Badge, Button, Card, Empty, Field, Icons, Input, PageHeader, Select, Table, Td, Th } from "@/components/ui";
import { applyReconciliation, guessLayout, parseCommissionStatement, reconcile, sampleStatement, type CommissionLayout, type ReconLine } from "@/integrations/insurers/commission-statements";
import { parseCSV } from "@/domain/engines/importer";
import { insurerName, partyName } from "@/domain/engines/queries";
import { money } from "@/lib/format";

const STATUS: Record<ReconLine["status"], { label: string; tone: "ok" | "warn" | "danger" | "neutral" }> = {
  conferida: { label: "conferida", tone: "ok" },
  divergente: { label: "divergente", tone: "warn" },
  apolice_nao_encontrada: { label: "apólice não encontrada", tone: "danger" },
  sem_previsao: { label: "sem previsão", tone: "neutral" },
};
const FIELDS: { key: keyof CommissionLayout["columns"]; label: string; required?: boolean }[] = [
  { key: "policyNumber", label: "Nº da apólice", required: true }, { key: "amount", label: "Valor da comissão", required: true }, { key: "competence", label: "Competência" },
  { key: "paidAt", label: "Data de pagamento" }, { key: "premiumBase", label: "Prêmio base" }, { key: "rate", label: "% comissão" }, { key: "installment", label: "Parcela" },
];

export default function Conciliacao() {
  const { db, can, update, toast, user } = useStore();
  const [insurerId, setInsurerId] = useState("ins-porto");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [layout, setLayout] = useState<CommissionLayout | null>(null);
  const [applied, setApplied] = useState(false);
  const headers = useMemo(() => (text ? parseCSV(text)[0] ?? [] : []), [text]);
  const parsed = useMemo(() => (text && layout ? parseCommissionStatement(text, layout, fileName) : null), [text, layout, fileName]);
  const recon = useMemo(() => (parsed ? reconcile(db, parsed.lines) : null), [db, parsed]);
  if (!can("commissions.view")) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Comissões são visíveis apenas para o Administrador.</Empty>;

  const load = (t: string, name: string) => { setText(t); setFileName(name); setLayout(guessLayout(insurerId, parseCSV(t)[0] ?? [])); setApplied(false); };
  const lastComp = [...new Set(db.commissions.filter((c) => db.policies.find((p) => p.id === c.policyId)?.insurerId === insurerId && c.status !== "prevista").map((c) => c.competence))].sort().pop() ?? db.commissions[0]?.competence;
  const totals = recon ? { file: recon.lines.reduce((s, l) => s + l.line.amount, 0), ok: recon.lines.filter((l) => l.status === "conferida").length, div: recon.lines.filter((l) => l.status === "divergente").length, nf: recon.lines.filter((l) => l.status === "apolice_nao_encontrada" || l.status === "sem_previsao").length } : null;

  return (
    <div>
      <PageHeader breadcrumb={[{ label: "Comissões", href: "/comissoes" }]} icon={<Icons.FileSpreadsheet className="h-5 w-5" />} title="Conciliação de extrato" subtitle="Integração por arquivo: importe o extrato baixado do portal da seguradora e o sistema confere previsto × recebido." />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Seguradora"><Select value={insurerId} onChange={(e) => { setInsurerId(e.target.value); setText(""); setLayout(null); }}>{db.insurers.filter((i) => db.policies.some((p) => p.insurerId === i.id)).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
          <Field label="Extrato (CSV)"><Input type="file" accept=".csv,.txt" onChange={async (e) => { const f = e.target.files?.[0]; if (f && tooLarge(f, UPLOAD_LIMITS.spreadsheetBytes)) { toast("Arquivo acima de 5 MB", "warn"); return; } if (f) load(await f.text(), f.name); }} /></Field>
          <div className="flex items-end"><Button variant="secondary" icon={<Icons.FlaskConical className="h-4 w-4" />} onClick={() => load(sampleStatement(db, insurerId, lastComp), `extrato-exemplo-${insurerId}.csv`)}>Gerar extrato de exemplo</Button></div>
          <p className="self-end text-2xs text-ink-muted">XLSX/TXT de largura fixa: converter para CSV (produção: conversão automática). Cada seguradora guarda o seu layout após a primeira importação.</p>
        </div>
      </Card>
      {layout && (
        <Card className="mb-4" title="Layout do arquivo" subtitle={`Colunas identificadas automaticamente em ${fileName} — ajuste se necessário`}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? " *" : ""}`}>
                <Select value={layout.columns[f.key] ?? ""} onChange={(e) => setLayout({ ...layout, columns: { ...layout.columns, [f.key]: e.target.value || undefined } })}>
                  {!f.required && <option value="">—</option>}
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </Field>
            ))}
          </div>
        </Card>
      )}
      {recon && totals && (
        <Card padded={false} title={`${recon.lines.length} linhas · ${money(totals.file)} no extrato`} subtitle={`${totals.ok} conferidas · ${totals.div} divergentes · ${totals.nf} sem correspondência · ${recon.missing.length} comissões previstas que não vieram no extrato`}
          action={<Button disabled={applied || !(totals.ok + totals.div)} onClick={() => { update((d) => applyReconciliation(d, recon.lines, user!.id)); setApplied(true); toast("Conciliação aplicada — registrada na auditoria"); }}>{applied ? "Aplicada" : "Confirmar conciliação"}</Button>}>
          <Table>
            <thead><tr><Th>Apólice</Th><Th>Cliente</Th><Th>Competência</Th><Th className="text-right">Previsto</Th><Th className="text-right">Extrato</Th><Th className="text-right">Diferença</Th><Th>Status</Th><Th>Origem</Th></tr></thead>
            <tbody>
              {recon.lines.map((r, i) => { const pol = db.policies.find((p) => p.id === r.policyId); return (
                <tr key={i}>
                  <Td>{pol ? <Link href={`/apolices/${pol.id}`} className="font-mono text-xs hover:text-brand-700">{r.line.policyNumber}</Link> : <span className="font-mono text-xs">{r.line.policyNumber}</span>}</Td>
                  <Td className="text-sm">{pol ? partyName(db, pol.holder) : "—"}</Td>
                  <Td className="text-xs">{r.line.competence}</Td>
                  <Td className="text-right tabular-nums text-sm">{r.commission ? money(r.commission.expected) : "—"}</Td>
                  <Td className="text-right tabular-nums text-sm">{money(r.line.amount)}</Td>
                  <Td className={`text-right tabular-nums text-sm ${r.difference && Math.abs(r.difference) > 0.5 ? "text-danger" : ""}`}>{r.difference != null ? money(r.difference) : "—"}</Td>
                  <Td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></Td>
                  <Td className="text-2xs text-ink-muted">{r.line.sourceRef}</Td>
                </tr>); })}
            </tbody>
          </Table>
          {recon.missing.length > 0 && (
            <div className="border-t border-line px-4 py-3 text-xs text-ink-soft">
              <b className="font-medium text-ink">Previstas e não pagas neste extrato:</b> {recon.missing.slice(0, 8).map((c) => db.policies.find((p) => p.id === c.policyId)?.number).join(", ")}{recon.missing.length > 8 ? "…" : ""} — viram pendência para cobrança à {insurerName(db, insurerId)}.
            </div>
          )}
          {parsed && parsed.errors.length > 0 && <div className="border-t border-line px-4 py-3 text-xs text-danger">{parsed.errors.join(" · ")}</div>}
        </Card>
      )}
    </div>
  );
}
