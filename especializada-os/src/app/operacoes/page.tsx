"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { Card, Icons, PageHeader, Segmented, Empty, LinkButton } from "@/components/ui";
import { TaskRow } from "@/components/ops/TaskRow";
import { BUCKETS, operationsQueue, type Bucket } from "@/domain/engines/priority";
import { cn } from "@/lib/cn";

const ICON: Record<Bucket, keyof typeof Icons> = {
  urgente: "Flame", hoje: "Sun", semana: "CalendarDays", aguardando_cliente: "UserRoundSearch", aguardando_seguradora: "Landmark", renovacoes: "RefreshCw", documentos: "FileWarning", followups: "MessagesSquare", pendencias: "ListTodo",
};

export default function Operacoes() {
  const { db, today, user } = useStore();
  const [scope, setScope] = useState<"meu" | "equipe">(user!.role === "corretor" ? "meu" : "equipe");
  const [bucket, setBucket] = useState<Bucket | "todos">("todos");
  const queue = useMemo(() => operationsQueue(db, today, user, scope === "meu"), [db, today, user, scope]);
  const filtered = bucket === "todos" ? queue : queue.filter((i) => i.buckets.includes(bucket));
  const count = (b: Bucket) => queue.filter((i) => i.buckets.includes(b)).length;
  const autoCount = queue.filter((i) => i.task.origin !== "manual").length;

  return (
    <div>
      <PageHeader
        icon={<Icons.Radar className="h-5 w-5" />}
        title="Central de Operações"
        subtitle={<>O sistema diz o que precisa ser feito — ordenado por prioridade. <b className="font-medium text-ink">{autoCount}</b> de {queue.length} itens foram criados automaticamente.</>}
        actions={<><Segmented value={scope} onChange={setScope} options={[{ value: "meu", label: "Minhas" }, { value: "equipe", label: "Equipe" }]} /><LinkButton href="/tarefas?nova=1" icon={<Icons.Plus className="h-4 w-4" />}>Tarefa</LinkButton></>}
      />
      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-5 xl:grid-cols-9">
        {BUCKETS.map((b) => {
          const I = Icons[ICON[b.key]] as Icons.LucideIcon;
          const c = count(b.key);
          const active = bucket === b.key;
          return (
            <button key={b.key} title={b.hint} onClick={() => setBucket(active ? "todos" : b.key)} className={cn("rounded-xl border bg-white p-3 text-left transition", active ? "border-brand-500 ring-2 ring-brand-100" : "border-line hover:border-brand-300", b.key === "urgente" && c > 0 && !active && "border-red-200 bg-danger-soft/40")}>
              <I className={cn("h-4 w-4", b.key === "urgente" ? "text-danger" : "text-ink-muted")} />
              <div className="mt-2 text-xl font-semibold tabular-nums">{c}</div>
              <div className="truncate text-2xs font-medium text-ink-muted">{b.label}</div>
            </button>
          );
        })}
      </div>
      <Card padded={false} title={bucket === "todos" ? "Fila priorizada" : BUCKETS.find((b) => b.key === bucket)!.label} subtitle={bucket === "todos" ? "Pontuação = atraso + proximidade do vencimento da apólice + prêmio em jogo + tempo de espera" : BUCKETS.find((b) => b.key === bucket)!.hint} action={bucket !== "todos" && <button onClick={() => setBucket("todos")} className="text-xs font-medium text-brand-700">Ver todos</button>}>
        <div className="divide-y divide-line-soft">
          {filtered.map((i) => <TaskRow key={i.task.id} task={i.task} score={i.score} reasons={i.reasons} />)}
          {!filtered.length && <Empty icon={<Icons.PartyPopper className="h-5 w-5" />} title="Nada por aqui">Tudo em dia nesta categoria.</Empty>}
        </div>
      </Card>
    </div>
  );
}
