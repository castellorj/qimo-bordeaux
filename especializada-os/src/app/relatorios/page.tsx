"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { Button, Card, Empty, Icons, PageHeader, Table, Td, Th } from "@/components/ui";
import type { DB, PartyRef, Permission, Policy, User } from "@/domain/types";
import { insurerName, partyName, userName } from "@/domain/engines/queries";
import { crossSellFor } from "@/domain/engines/crosssell";
import { lineLabel } from "@/domain/products";
import { STAGE_LABEL } from "@/components/status";
import { downloadCSV, monthLabel, type CsvCell } from "@/components/commercial/helpers";
import { date, money0, n, pct } from "@/lib/format";
import { addMonths, daysBetween } from "@/lib/dates";
import { cn } from "@/lib/cn";

type ColType = "text" | "money" | "int" | "pct" | "date";
interface Col { label: string; type?: ColType }
interface ReportData { cols: Col[]; rows: CsvCell[][]; note?: string }
interface Ctx { db: DB; today: string; user: User | null; visible: (r?: PartyRef) => boolean; policies: Policy[] }
interface ReportDef { key: string; label: string; icon: keyof typeof Icons; description: string; perm?: Permission; build: (c: Ctx) => ReportData }

const isActive = (p: Policy) => p.status === "vigente" || p.status === "em_emissao";
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
function group<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>();
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return [...m.entries()];
}
const clientKey = (r: PartyRef) => `${r.type}:${r.id}`;

const REPORTS: ReportDef[] = [
  {
    key: "carteira", label: "Carteira", icon: "Briefcase", description: "Apólices ativas por ramo, prêmio e participação na carteira.",
    build: ({ policies }) => {
      const act = policies.filter(isActive);
      const total = sum(act, (p) => p.annualPremium);
      const rows = group(act, (p) => p.line).map(([line, ps]) => [lineLabel(line as Policy["line"]), ps.length, new Set(ps.map((p) => clientKey(p.holder))).size, sum(ps, (p) => p.annualPremium), sum(ps, (p) => p.annualPremium) / ps.length, total ? sum(ps, (p) => p.annualPremium) / total : 0] as CsvCell[]);
      rows.sort((a, b) => Number(b[3]) - Number(a[3]));
      return { cols: [{ label: "Ramo" }, { label: "Apólices", type: "int" }, { label: "Clientes", type: "int" }, { label: "Prêmio anual", type: "money" }, { label: "Ticket médio", type: "money" }, { label: "% carteira", type: "pct" }], rows, note: `${act.length} apólices ativas · ${money0(total)} em prêmio anual` };
    },
  },
  {
    key: "vendas", label: "Vendas", icon: "TrendingUp", description: "Apólices emitidas por mês de início de vigência (novas × renovações), últimos 12 meses.",
    build: ({ policies, today }) => {
      const months = Array.from({ length: 12 }, (_, k) => addMonths(`${today.slice(0, 7)}-01`, k - 11).slice(0, 7));
      const rows = months.reverse().map((m) => {
        const ps = policies.filter((p) => p.start.slice(0, 7) === m && p.status !== "cancelada");
        const novas = ps.filter((p) => !p.renewedFromId);
        const ren = ps.filter((p) => p.renewedFromId);
        return [monthLabel(m), novas.length, sum(novas, (p) => p.annualPremium), ren.length, sum(ren, (p) => p.annualPremium), sum(ps, (p) => p.annualPremium)] as CsvCell[];
      });
      return { cols: [{ label: "Mês" }, { label: "Novas", type: "int" }, { label: "Prêmio novas", type: "money" }, { label: "Renovações", type: "int" }, { label: "Prêmio renovações", type: "money" }, { label: "Prêmio total", type: "money" }], rows, note: "Renovação = apólice com vínculo à vigência anterior (renewedFrom)." };
    },
  },
  {
    key: "comissao", label: "Comissão", icon: "Wallet", perm: "commissions.view", description: "Comissão prevista × recebida por competência (12 meses até o mês atual).",
    build: ({ db, policies, today }) => {
      const ids = new Set(policies.map((p) => p.id));
      const cs = db.commissions.filter((c) => ids.has(c.policyId));
      const months = Array.from({ length: 12 }, (_, k) => addMonths(`${today.slice(0, 7)}-01`, -k).slice(0, 7));
      const rows = months.map((m) => {
        const x = cs.filter((c) => c.competence === m);
        const exp = sum(x, (c) => c.expected);
        const rec = sum(x, (c) => c.received ?? 0);
        return [monthLabel(m), x.length, exp, rec, rec - exp, exp ? rec / exp : 0, x.filter((c) => c.status === "divergente").length, x.filter((c) => c.status === "atrasada").length] as CsvCell[];
      });
      return { cols: [{ label: "Competência" }, { label: "Parcelas", type: "int" }, { label: "Prevista", type: "money" }, { label: "Recebida", type: "money" }, { label: "Diferença", type: "money" }, { label: "% recebido", type: "pct" }, { label: "Divergentes", type: "int" }, { label: "Atrasadas", type: "int" }], rows };
    },
  },
  {
    key: "renovacoes", label: "Renovações", icon: "RefreshCw", description: "Processos de renovação com vencimento, status e progresso do checklist.",
    build: ({ db, today, visible }) => {
      const rows = db.renewals
        .map((r) => ({ r, p: db.policies.find((x) => x.id === r.policyId) }))
        .filter((x): x is { r: (typeof db.renewals)[number]; p: Policy } => !!x.p && visible(x.p.holder))
        .sort((a, b) => a.r.dueDate.localeCompare(b.r.dueDate))
        .map(({ r, p }) => [partyName(db, p.holder), lineLabel(p.line), insurerName(db, p.insurerId), p.number, r.dueDate, daysBetween(today, r.dueDate), r.status.replace("_", " "), r.checklist.length ? r.checklist.filter((c) => c.done).length / r.checklist.length : 0, p.annualPremium] as CsvCell[]);
      return { cols: [{ label: "Cliente" }, { label: "Ramo" }, { label: "Seguradora" }, { label: "Apólice" }, { label: "Vencimento", type: "date" }, { label: "Dias", type: "int" }, { label: "Status" }, { label: "Checklist", type: "pct" }, { label: "Prêmio", type: "money" }], rows };
    },
  },
  {
    key: "conversao", label: "Conversão", icon: "Target", description: "Funil por corretor: oportunidades ganhas, perdidas, em aberto e propostas aceitas.",
    build: ({ db, visible }) => {
      const opps = db.opportunities.filter((o) => visible(o.party));
      const props = db.proposals.filter((p) => visible(p.party));
      const rows = group(opps, (o) => o.ownerId).map(([owner, os]) => {
        const won = os.filter((o) => ["aprovado", "emissao", "emitido"].includes(o.stage)).length;
        const lost = os.filter((o) => o.stage === "perdido").length;
        const ps = props.filter((p) => p.ownerId === owner);
        return [userName(db, owner), os.length, os.length - won - lost, won, lost, won + lost ? won / (won + lost) : 0, ps.filter((p) => p.sentAt).length, ps.filter((p) => p.status === "aceita").length, sum(os.filter((o) => ["aprovado", "emissao", "emitido"].includes(o.stage)), (o) => o.estimatedPremium)] as CsvCell[];
      });
      return { cols: [{ label: "Corretor" }, { label: "Oportunidades", type: "int" }, { label: "Em aberto", type: "int" }, { label: "Ganhas", type: "int" }, { label: "Perdidas", type: "int" }, { label: "Conversão", type: "pct" }, { label: "Propostas enviadas", type: "int" }, { label: "Propostas aceitas", type: "int" }, { label: "Prêmio ganho", type: "money" }], rows, note: "Conversão = ganhas ÷ (ganhas + perdidas)." };
    },
  },
  {
    key: "seguradoras", label: "Seguradoras", icon: "Landmark", description: "Produção por seguradora/operadora: apólices ativas, prêmio e comissão média.",
    build: ({ db, policies }) => {
      const act = policies.filter(isActive);
      const rows = group(act, (p) => p.insurerId).map(([ins, ps]) => {
        const prem = sum(ps, (p) => p.annualPremium);
        return [db.insurers.find((i) => i.id === ins)?.name ?? ins, ps.length, prem, prem ? sum(ps, (p) => p.annualPremium * p.commissionPct) / prem : 0, sum(ps, (p) => p.annualPremium * p.commissionPct), new Set(ps.map((p) => p.line)).size] as CsvCell[];
      }).sort((a, b) => Number(b[2]) - Number(a[2]));
      return { cols: [{ label: "Seguradora" }, { label: "Apólices", type: "int" }, { label: "Prêmio anual", type: "money" }, { label: "Comissão média", type: "pct" }, { label: "Comissão anual", type: "money" }, { label: "Ramos", type: "int" }], rows };
    },
  },
  {
    key: "produtos", label: "Produtos", icon: "Package", description: "Produtos mais vendidos (apólices ativas) com ticket médio.",
    build: ({ db, policies }) => {
      const act = policies.filter(isActive);
      const rows = group(act, (p) => `${p.insurerId}|${p.productName}`).map(([, ps]) => [ps[0].productName, lineLabel(ps[0].line), insurerName(db, ps[0].insurerId), ps.length, sum(ps, (p) => p.annualPremium), sum(ps, (p) => p.annualPremium) / ps.length] as CsvCell[]).sort((a, b) => Number(b[4]) - Number(a[4]));
      return { cols: [{ label: "Produto" }, { label: "Ramo" }, { label: "Seguradora" }, { label: "Apólices", type: "int" }, { label: "Prêmio anual", type: "money" }, { label: "Ticket médio", type: "money" }], rows };
    },
  },
  {
    key: "corretores", label: "Corretores", icon: "UserRound", description: "Carteira e operação por corretor: clientes, prêmio, comissão e tarefas.",
    build: ({ db, policies, today, visible }) => {
      const act = policies.filter(isActive);
      const owners = Array.from(new Set(act.map((p) => p.ownerId)));
      const rows = owners.map((o) => {
        const ps = act.filter((p) => p.ownerId === o);
        const tasks = db.tasks.filter((t) => t.ownerId === o && t.status === "aberta" && (!t.party || visible(t.party)));
        return [userName(db, o), new Set(ps.map((p) => clientKey(p.holder))).size, ps.length, sum(ps, (p) => p.annualPremium), sum(ps, (p) => p.annualPremium * p.commissionPct), tasks.length, tasks.filter((t) => t.due < today).length] as CsvCell[];
      }).sort((a, b) => Number(b[3]) - Number(a[3]));
      return { cols: [{ label: "Corretor" }, { label: "Clientes", type: "int" }, { label: "Apólices", type: "int" }, { label: "Prêmio anual", type: "money" }, { label: "Comissão anual", type: "money" }, { label: "Tarefas abertas", type: "int" }, { label: "Atrasadas", type: "int" }], rows };
    },
  },
  {
    key: "clientes", label: "Clientes", icon: "Users", description: "Ranking de clientes por prêmio anual ativo, com ramos contratados.",
    build: ({ db, policies }) => {
      const act = policies.filter(isActive);
      const rows = group(act, (p) => clientKey(p.holder)).map(([, ps]) => [partyName(db, ps[0].holder), ps[0].holder.type === "person" ? "Pessoa física" : "Empresa", ps.length, Array.from(new Set(ps.map((p) => lineLabel(p.line)))).join(", "), sum(ps, (p) => p.annualPremium), userName(db, ps[0].ownerId)] as CsvCell[]).sort((a, b) => Number(b[4]) - Number(a[4]));
      return { cols: [{ label: "Cliente" }, { label: "Tipo" }, { label: "Apólices", type: "int" }, { label: "Ramos" }, { label: "Prêmio anual", type: "money" }, { label: "Corretor" }], rows };
    },
  },
  {
    key: "crosssell", label: "Cross-sell", icon: "Sparkles", description: "Oportunidades sugeridas pelo motor determinístico para clientes ativos (sem oportunidade aberta no ramo).",
    build: ({ db, today, visible }) => {
      const refs: PartyRef[] = [
        ...db.persons.filter((p) => p.clientStatus === "ativo").map((p) => ({ type: "person" as const, id: p.id })),
        ...db.companies.filter((c) => c.clientStatus === "ativo").map((c) => ({ type: "company" as const, id: c.id })),
      ].filter((r) => visible(r));
      const rows = refs.flatMap((r) => crossSellFor(db, r, today).map((s) => [partyName(db, r), lineLabel(s.line), s.strength === "alta" ? "Alta" : "Média", s.reason] as CsvCell[]));
      rows.sort((a, b) => String(a[2]).localeCompare(String(b[2])) || String(a[0]).localeCompare(String(b[0])));
      return { cols: [{ label: "Cliente" }, { label: "Ramo sugerido" }, { label: "Força" }, { label: "Motivo" }], rows, note: `${refs.length} clientes ativos analisados · nenhuma mensagem é disparada automaticamente.` };
    },
  },
  {
    key: "churn", label: "Churn", icon: "UserMinus", description: "Apólices vencidas, canceladas ou não renovadas — prêmio que saiu da carteira.",
    build: ({ db, policies }) => {
      const renewedIds = new Set(db.policies.map((p) => p.renewedFromId).filter(Boolean));
      const lostRen = new Set(db.renewals.filter((r) => r.status === "nao_renovada").map((r) => r.policyId));
      const rows = policies
        .filter((p) => (p.status === "vencida" && !renewedIds.has(p.id)) || p.status === "cancelada" || lostRen.has(p.id))
        .sort((a, b) => b.end.localeCompare(a.end))
        .map((p) => [partyName(db, p.holder), lineLabel(p.line), insurerName(db, p.insurerId), p.number, p.end, p.annualPremium, p.status === "cancelada" ? "Cancelada" : lostRen.has(p.id) ? "Não renovada" : "Vencida sem renovação", userName(db, p.ownerId)] as CsvCell[]);
      return { cols: [{ label: "Cliente" }, { label: "Ramo" }, { label: "Seguradora" }, { label: "Apólice" }, { label: "Fim de vigência", type: "date" }, { label: "Prêmio perdido", type: "money" }, { label: "Motivo" }, { label: "Corretor" }], rows };
    },
  },
  {
    key: "perdidas", label: "Propostas perdidas", icon: "FileX2", description: "Propostas recusadas/expiradas e oportunidades perdidas, com motivo.",
    build: ({ db, visible }) => {
      const props = db.proposals.filter((p) => visible(p.party) && (p.status === "recusada" || p.status === "expirada"));
      const propOpp = new Set(props.map((p) => db.quotes.find((q) => q.id === p.quoteId)?.opportunityId).filter(Boolean));
      const rows: CsvCell[][] = [
        ...props.map((p) => {
          const q = db.quotes.find((x) => x.id === p.quoteId);
          const rec = q?.results.find((r) => r.id === p.recommendedResultId);
          return [p.code, partyName(db, p.party), lineLabel(p.line), rec?.annualPremium ?? null, (p.decidedAt ?? p.validUntil).slice(0, 10), p.status === "recusada" ? "Proposta recusada" : "Proposta expirada", userName(db, p.ownerId)] as CsvCell[];
        }),
        ...db.opportunities.filter((o) => o.stage === "perdido" && visible(o.party) && !propOpp.has(o.id)).map((o) => [o.title, partyName(db, o.party), lineLabel(o.line), o.estimatedPremium, o.updatedAt.slice(0, 10), o.lostReason ?? STAGE_LABEL.perdido, userName(db, o.ownerId)] as CsvCell[]),
      ];
      rows.sort((a, b) => String(b[4]).localeCompare(String(a[4])));
      return { cols: [{ label: "Proposta / oportunidade" }, { label: "Cliente" }, { label: "Ramo" }, { label: "Prêmio", type: "money" }, { label: "Data", type: "date" }, { label: "Motivo" }, { label: "Corretor" }], rows };
    },
  },
];

function fmt(v: CsvCell, t: ColType = "text") {
  if (v == null || v === "") return "—";
  if (typeof v === "number") {
    if (t === "money") return money0(v);
    if (t === "pct") return pct(v, 1);
    return n(v);
  }
  if (t === "date") return date(v);
  return v;
}

export default function RelatoriosPage() {
  const { db, today, user, visible, can } = useStore();
  const available = REPORTS.filter((r) => !r.perm || can(r.perm));
  const [key, setKey] = useState(available[0]?.key ?? "carteira");
  const report = available.find((r) => r.key === key) ?? available[0];
  const policies = useMemo(() => db.policies.filter((p) => visible(p.holder)), [db.policies, visible]);
  const data = useMemo(() => (report ? report.build({ db, today, user, visible, policies }) : null), [report, db, today, user, visible, policies]);

  if (!can("reports.view")) return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não tem acesso aos relatórios.</Empty>;

  const exportCsv = () => {
    if (!report || !data) return;
    downloadCSV(`relatorio-${report.key}-${today}`, data.cols.map((c) => c.label), data.rows.map((r) => r.map((v, i) => (data.cols[i]?.type === "pct" && typeof v === "number" ? Math.round(v * 1000) / 10 : data.cols[i]?.type === "date" && typeof v === "string" ? date(v) : v))));
  };
  const numericTotals = data && data.rows.length > 1 ? data.cols.map((c, i) => (c.type === "money" || c.type === "int") && !/dias|ticket|clientes|ramos/i.test(c.label) ? sum(data.rows, (r) => (typeof r[i] === "number" ? (r[i] as number) : 0)) : null) : null;

  return (
    <div>
      <PageHeader icon={<Icons.BarChart3 className="h-5 w-5" />} title="Relatórios" subtitle="Todos calculados em tempo real a partir da carteira visível para o seu perfil. Exporte em CSV para Excel/Planilhas." />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          {available.map((r) => {
            const I = Icons[r.icon] as Icons.LucideIcon;
            return (
              <button key={r.key} onClick={() => setKey(r.key)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition", r.key === report?.key ? "bg-white font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-soft hover:bg-line-soft hover:text-ink")}>
                <I className={cn("h-4 w-4", r.key === report?.key ? "text-brand-600" : "text-ink-muted")} />
                {r.label}
              </button>
            );
          })}
        </nav>
        {report && data && (
          <Card padded={false} title={report.label} subtitle={report.description} action={<Button variant="secondary" size="sm" onClick={exportCsv} disabled={!data.rows.length} icon={<Icons.Download className="h-3.5 w-3.5" />}>Exportar CSV</Button>}>
            {data.note && <div className="border-b border-line-soft bg-canvas/60 px-4 py-2 text-xs text-ink-muted">{data.note}</div>}
            <Table className="max-h-[70vh]">
              <thead><tr>{data.cols.map((c) => <Th key={c.label} className={cn(c.type && c.type !== "text" && c.type !== "date" && "text-right")}>{c.label}</Th>)}</tr></thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-canvas">
                    {r.map((v, j) => {
                      const t = data.cols[j]?.type;
                      return <Td key={j} className={cn(t && t !== "text" && t !== "date" ? "text-right tabular-nums" : "", j === 0 && "font-medium text-ink", t === "text" && j > 0 && "text-ink-soft", typeof v === "string" && v.length > 60 && "min-w-[280px] text-xs")}>{fmt(v, t)}</Td>;
                    })}
                  </tr>
                ))}
              </tbody>
              {numericTotals && numericTotals.some((x) => x != null) && (
                <tfoot>
                  <tr className="bg-canvas font-medium">
                    {numericTotals.map((t, i) => <Td key={i} className={cn(t != null && "text-right tabular-nums", i === 0 && "text-xs text-ink-muted")}>{i === 0 ? `Total · ${data.rows.length} linhas` : t != null ? fmt(t, data.cols[i].type) : ""}</Td>)}
                  </tr>
                </tfoot>
              )}
            </Table>
            {!data.rows.length && <Empty title="Sem dados para este relatório">Nada a exibir com a carteira visível para o seu perfil.</Empty>}
          </Card>
        )}
      </div>
    </div>
  );
}
