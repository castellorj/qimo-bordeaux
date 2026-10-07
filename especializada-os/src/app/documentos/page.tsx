"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { tooLarge, UPLOAD_LIMITS } from "@/lib/security";
import { addDocument } from "@/data/actions";
import { SAMPLE_DOCS, fillSample } from "@/data/seed";
import type { DB, DocumentRecord } from "@/domain/types";
import { regexParser } from "@/integrations/document-parsing";
import { Badge, Button, Card, Empty, Icons, Input, PageHeader, Select, Stat, Table, Tabs, Td, Th } from "@/components/ui";
import { DocumentReview } from "@/components/ops/DocumentReview";
import { CHANNEL_LABEL, KIND_LABEL, STATUS_LABEL, identifyParty, isTextFile, kindFromFileName, sizeLabel } from "@/components/ops/doc-ai";
import { partyHref, partyName } from "@/domain/engines/queries";
import { dateTime, n } from "@/lib/format";
import { norm } from "@/lib/text";
import { cn } from "@/lib/cn";

const CHANNEL_ICON: Record<DocumentRecord["channel"], keyof typeof Icons> = { upload: "Upload", email: "Mail", whatsapp: "MessageCircle", importacao: "FileSpreadsheet", sistema: "Cpu" };
const STATUS_TONE: Record<DocumentRecord["status"], "neutral" | "warn" | "ok"> = { arquivado: "neutral", aguardando_revisao: "warn", processado: "ok" };

export default function DocumentosPage() {
  return (
    <Suspense fallback={null}>
      <Documentos />
    </Suspense>
  );
}

function Documentos() {
  const { db, can, visible } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const revisar = params.get("revisar");

  const [tab, setTab] = useState<"todos" | "revisao">("todos");
  const [kind, setKind] = useState<DocumentRecord["kind"] | "">((params.get("tipo") as DocumentRecord["kind"] | null) ?? "");
  const [status, setStatus] = useState<DocumentRecord["status"] | "">("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = params.get("tipo") as DocumentRecord["kind"] | null;
    if (t && t in KIND_LABEL) setKind(t);
  }, [params]);

  const docs = useMemo(() => db.documents.filter((d) => visible(d.party)), [db, visible]);
  const pending = docs.filter((d) => d.status === "aguardando_revisao");
  const filtered = useMemo(() => {
    const nq = norm(q);
    return (tab === "revisao" ? pending : docs)
      .filter((d) => !kind || d.kind === kind)
      .filter((d) => !status || d.status === status)
      .filter((d) => !nq || norm(`${d.name} ${d.party ? partyName(db, d.party) : ""} ${db.policies.find((p) => p.id === d.policyId)?.number ?? ""}`).includes(nq))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [docs, pending, tab, kind, status, q, db]);

  if (!can("documents.view")) {
    return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não tem acesso à central de documentos.</Empty>;
  }

  if (revisar) {
    return (
      <div>
        <PageHeader icon={<Icons.ScanText className="h-5 w-5" />} title="Revisão do Document AI" subtitle="Confira os dados extraídos antes de gravar — você decide o que entra no sistema." breadcrumb={[{ label: "Documentos", href: "/documentos" }]} />
        <DocumentReview key={revisar} docId={revisar} onClose={() => router.push("/documentos")} />
      </div>
    );
  }

  const reviewedCount = docs.filter((d) => d.extraction?.reviewedBy).length;
  const hasFilters = kind || status || q;

  return (
    <div>
      <PageHeader
        icon={<Icons.FolderOpen className="h-5 w-5" />}
        title="Central de documentos"
        subtitle="Todos os documentos da corretora em um só lugar. O Document AI lê, classifica, identifica o cliente e propõe o cadastro — você confirma."
        actions={pending.length > 0 && <Button variant="subtle" icon={<Icons.ScanText className="h-4 w-4" />} onClick={() => setTab("revisao")}>{pending.length} aguardando revisão</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Documentos" value={n(docs.length)} sub="na sua carteira visível" icon={<Icons.Files className="h-4 w-4" />} />
        <Stat label="Aguardando revisão" value={n(pending.length)} sub="campos para conferir" icon={<Icons.ScanText className="h-4 w-4" />} tone={pending.length ? "warn" : undefined} />
        <Stat label="Revisados pelo Document AI" value={n(reviewedCount)} sub="com confirmação humana" icon={<Icons.BadgeCheck className="h-4 w-4" />} tone="ok" />
        <Stat label="Por e-mail/WhatsApp" value={n(docs.filter((d) => d.channel === "email" || d.channel === "whatsapp").length)} sub="recebidos por canais" icon={<Icons.Inbox className="h-4 w-4" />} />
      </div>

      {can("documents.edit") && <UploadZone autoFocus={params.get("upload") === "1"} />}

      <Card padded={false} className="mt-4">
        <div className="px-4 pt-2">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "todos", label: "Todos", count: docs.length }, { value: "revisao", label: "Aguardando revisão", count: pending.length }]} />
        </div>
        <div className="grid gap-2 border-b border-line-soft px-4 py-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto]">
          <div className="relative">
            <Icons.Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, cliente ou nº da apólice…" className="pl-8" />
          </div>
          <Select value={kind} onChange={(e) => setKind(e.target.value as DocumentRecord["kind"] | "")} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {(Object.keys(KIND_LABEL) as DocumentRecord["kind"][]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as DocumentRecord["status"] | "")} aria-label="Status" disabled={tab === "revisao"}>
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABEL) as DocumentRecord["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          {hasFilters ? <Button variant="ghost" onClick={() => { setKind(""); setStatus(""); setQ(""); }}>Limpar</Button> : <span className="hidden lg:block" />}
        </div>
        {filtered.length ? (
          <Table className="max-h-[640px]">
            <thead>
              <tr><Th>Nome</Th><Th>Tipo</Th><Th>Cliente</Th><Th>Apólice</Th><Th>Canal</Th><Th>Status</Th><Th>Data</Th><Th className="text-right">Tamanho</Th><Th /></tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const pol = d.policyId ? db.policies.find((p) => p.id === d.policyId) : undefined;
                const CI = Icons[CHANNEL_ICON[d.channel]] as Icons.LucideIcon;
                return (
                  <tr key={d.id} className={cn("group hover:bg-canvas", d.status === "aguardando_revisao" && "bg-warn-soft/30")}>
                    <Td className="max-w-[280px]">
                      <Link href={`/documentos?revisar=${d.id}`} className="flex items-center gap-2 font-medium text-ink hover:text-brand-700">
                        <FileIcon mime={d.mime} />
                        <span className="truncate">{d.name}</span>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-ink-soft">{KIND_LABEL[d.kind]}</Td>
                    <Td className="max-w-[180px] truncate text-xs">{d.party ? <Link href={partyHref(d.party)} className="text-ink-soft hover:text-brand-700">{partyName(db, d.party)}</Link> : <span className="text-ink-faint">não identificado</span>}</Td>
                    <Td className="whitespace-nowrap font-mono text-2xs">{pol ? <Link href={`/apolices/${pol.id}`} className="text-ink-soft hover:text-brand-700">{pol.number}</Link> : <span className="text-ink-faint">—</span>}</Td>
                    <Td className="whitespace-nowrap text-xs text-ink-muted"><span className="inline-flex items-center gap-1"><CI className="h-3.5 w-3.5" />{CHANNEL_LABEL[d.channel]}</span></Td>
                    <Td><Badge tone={STATUS_TONE[d.status]} dot>{STATUS_LABEL[d.status]}</Badge></Td>
                    <Td className="whitespace-nowrap text-xs text-ink-muted tabular-nums">{dateTime(d.uploadedAt)}</Td>
                    <Td className="whitespace-nowrap text-right text-xs text-ink-muted tabular-nums">{sizeLabel(d.sizeKb)}</Td>
                    <Td className="text-right">
                      {d.status === "aguardando_revisao" ? (
                        <Link href={`/documentos?revisar=${d.id}`} className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-600 px-2 text-2xs font-medium text-white hover:bg-brand-700">Revisar<Icons.ArrowRight className="h-3 w-3" /></Link>
                      ) : (
                        <Link href={`/documentos?revisar=${d.id}`} className="text-2xs font-medium text-ink-muted opacity-0 transition hover:text-brand-700 group-hover:opacity-100">Abrir</Link>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty icon={tab === "revisao" ? <Icons.PartyPopper className="h-5 w-5" /> : <Icons.FolderSearch className="h-5 w-5" />} title={tab === "revisao" && !hasFilters ? "Nada para revisar" : "Nenhum documento encontrado"}>
            {tab === "revisao" && !hasFilters ? "Todas as extrações do Document AI já foram conferidas." : "Ajuste os filtros ou envie um novo documento."}
          </Empty>
        )}
        {filtered.length > 0 && <div className="px-4 py-2.5 text-2xs text-ink-muted">{filtered.length} documento(s)</div>}
      </Card>
    </div>
  );
}

function FileIcon({ mime }: { mime: string }) {
  const I = mime.startsWith("image/") ? Icons.FileImage : mime === "application/pdf" ? Icons.FileText : mime.startsWith("text/") ? Icons.FileCode2 : Icons.File;
  return <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", mime === "application/pdf" ? "bg-red-50 text-red-600" : mime.startsWith("image/") ? "bg-violet-50 text-violet-600" : "bg-line-soft text-ink-muted")}><I className="h-3.5 w-3.5" /></span>;
}

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function UploadZone({ autoFocus }: { autoFocus: boolean }) {
  const { db, today, user, visible, update, toast } = useStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [archived, setArchived] = useState<string[]>([]);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    if (!autoFocus) return;
    zoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    zoneRef.current?.focus();
    setHighlight(true);
    const t = setTimeout(() => setHighlight(false), 2400);
    return () => clearTimeout(t);
  }, [autoFocus]);

  /** Extrai, identifica o cliente e registra como "aguardando revisão". */
  async function ingestText(cur: DB, input: { fileName: string; text: string; sizeKb: number; mime: string }) {
    const res = await regexParser.parse({ fileName: input.fileName, text: input.text, knownInsurers: cur.insurers });
    const match = identifyParty(cur, res.fields, visible);
    return addDocument(cur, user, {
      name: input.fileName, kind: res.kind, party: match?.certain ? match.party : undefined, sizeKb: input.sizeKb, mime: input.mime, channel: "upload", status: "aguardando_revisao",
      extraction: { fields: res.fields, parser: res.parser, at: new Date().toISOString() }, textContent: input.text,
    });
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setArchived([]);
    try {
      let cur = dbRef.current;
      let lastReview: string | undefined;
      const metaOnly: string[] = [];
      for (const file of files) {
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        if (tooLarge(file, UPLOAD_LIMITS.documentBytes) || (isTextFile(file) && tooLarge(file, UPLOAD_LIMITS.textReadBytes))) {
          toast(`${file.name}: arquivo acima do limite permitido`, "warn");
          continue;
        }
        if (isTextFile(file)) {
          const text = await readText(file);
          const r = await ingestText(cur, { fileName: file.name, text, sizeKb, mime: file.type || "text/plain" });
          cur = r.db;
          lastReview = r.id;
        } else {
          const r = addDocument(cur, user, { name: file.name, kind: kindFromFileName(file.name), sizeKb, mime: file.type || "application/octet-stream", channel: "upload", status: "arquivado" });
          cur = r.db;
          metaOnly.push(file.name);
        }
      }
      update(() => cur);
      if (metaOnly.length) {
        setArchived(metaOnly);
        toast(`${metaOnly.length} arquivo(s) arquivado(s) com metadados`, "info");
      }
      if (lastReview) {
        toast("Documento lido pelo Document AI — confira os campos");
        router.push(`/documentos?revisar=${lastReview}`);
      }
    } catch {
      toast("Não foi possível ler o arquivo", "warn");
    } finally {
      setBusy(false);
    }
  }

  async function loadSample(id: string) {
    const s = SAMPLE_DOCS.find((x) => x.id === id);
    if (!s) return;
    setMenu(false);
    setBusy(true);
    const text = fillSample(s.text(today), dbRef.current.persons);
    const r = await ingestText(dbRef.current, { fileName: s.fileName, text, sizeKb: Math.max(1, Math.ceil(text.length / 1024)), mime: "text/plain" });
    update(() => r.db);
    setBusy(false);
    toast("Documento de exemplo lido pelo Document AI");
    router.push(`/documentos?revisar=${r.id}`);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <div
        ref={zoneRef}
        tabIndex={-1}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn("relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white px-4 py-6 text-center transition focus:outline-none sm:flex-row sm:text-left",
          drag ? "border-brand-500 bg-brand-50/60" : "border-line hover:border-brand-300", highlight && "border-brand-500 ring-4 ring-brand-100")}
      >
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", drag ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600")}>
          {busy ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.UploadCloud className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{busy ? "Lendo e extraindo campos…" : "Arraste documentos aqui ou selecione do computador"}</p>
          <p className="mt-0.5 text-xs text-ink-muted">Qualquer arquivo é aceito. Na DEMO apenas documentos de texto (.txt, .csv, .md) são lidos pelo extrator; PDFs e imagens são arquivados com metadados. Em produção, PDFs e imagens passam por OCR + LLM (docs/AI_ARCHITECTURE.md).</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-center gap-2">
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
          <Button variant="secondary" disabled={busy} icon={<Icons.Paperclip className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>Selecionar arquivo</Button>
          <div className="relative">
            <Button disabled={busy} icon={<Icons.FlaskConical className="h-4 w-4" />} onClick={() => setMenu((m) => !m)}>Testar com documento de exemplo<Icons.ChevronDown className="h-3.5 w-3.5" /></Button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-80 rounded-xl border border-line bg-white p-1.5 text-left shadow-pop">
                  <div className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Documentos fictícios da DEMO</div>
                  {SAMPLE_DOCS.map((s) => (
                    <button key={s.id} onClick={() => loadSample(s.id)} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-canvas">
                      <Icons.FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink">{s.title}</span>
                        <span className="block truncate font-mono text-2xs text-ink-muted">{s.fileName}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {archived.length > 0 && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
          <Icons.Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
          <span><b className="font-medium text-ink">{archived.join(", ")}</b> — arquivado(s) apenas com metadados (nome, tamanho, tipo). Na DEMO só documentos de texto são lidos pelo extrator; em produção, PDFs e imagens passam por OCR + LLM com a mesma revisão humana.</span>
        </div>
      )}
    </div>
  );
}
