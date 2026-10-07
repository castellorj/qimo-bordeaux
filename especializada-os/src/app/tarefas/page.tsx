"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { createTask } from "@/data/actions";
import type { PartyRef, Task, TaskCategory } from "@/domain/types";
import { Button, Card, Dialog, Empty, Field, Icons, Input, PageHeader, Select, Tabs, Textarea } from "@/components/ui";
import { TaskRow } from "@/components/ops/TaskRow";
import { PartySelect } from "@/components/ops/PartySelect";
import { partyName } from "@/domain/engines/queries";
import { norm } from "@/lib/text";
import { addDays } from "@/lib/dates";

const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  follow_up: "Follow-up", documento: "Documento", renovacao: "Renovação", cotacao: "Cotação", emissao: "Emissão", pendencia: "Pendência", cross_sell: "Oportunidade", revisao: "Revisão IA",
};

type TabKey = "abertas" | "concluidas" | "todas";

export default function TarefasPage() {
  return (
    <Suspense fallback={null}>
      <Tarefas />
    </Suspense>
  );
}

function Tarefas() {
  const { db, today, user, visible, can } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("abertas");
  const [owner, setOwner] = useState<string>("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [origin, setOrigin] = useState<"" | "manual" | "auto">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("nova") === "1") setOpen(true);
  }, [params]);

  const closeDialog = () => {
    setOpen(false);
    if (params.get("nova")) router.replace("/tarefas");
  };

  const base = useMemo(() => db.tasks.filter((t) => !t.party || visible(t.party)), [db, visible]);
  const filtered = useMemo(() => {
    const nq = norm(q);
    return base
      .filter((t) => (tab === "abertas" ? t.status === "aberta" : tab === "concluidas" ? t.status === "concluida" : true))
      .filter((t) => !owner || t.ownerId === owner)
      .filter((t) => !category || t.category === category)
      .filter((t) => !origin || (origin === "manual" ? t.origin === "manual" : t.origin !== "manual"))
      .filter((t) => !nq || norm(`${t.title} ${t.description ?? ""} ${t.party ? partyName(db, t.party) : ""}`).includes(nq))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "aberta" ? -1 : 1;
        if (a.status === "concluida") return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
        return a.due.localeCompare(b.due);
      });
  }, [base, tab, owner, category, origin, q, db]);

  const openCount = base.filter((t) => t.status === "aberta").length;
  const doneCount = base.filter((t) => t.status === "concluida").length;
  const overdue = base.filter((t) => t.status === "aberta" && t.due < today).length;
  const autoOpen = base.filter((t) => t.status === "aberta" && t.origin !== "manual").length;
  const mine = base.filter((t) => t.status === "aberta" && t.ownerId === user?.id).length;
  const hasFilters = owner || category || origin || q;

  if (!can("tasks.view")) {
    return <Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não tem acesso às tarefas.</Empty>;
  }

  return (
    <div>
      <PageHeader
        icon={<Icons.CheckSquare className="h-5 w-5" />}
        title="Tarefas"
        subtitle={<><b className="font-medium text-ink">{openCount}</b> abertas · <span className={overdue ? "font-medium text-danger" : ""}>{overdue} atrasadas</span> · {autoOpen} criadas por automação · {mine} suas</>}
        actions={<Button icon={<Icons.Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nova tarefa</Button>}
      />

      <Card padded={false}>
        <div className="px-4 pt-2">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "abertas", label: "Abertas", count: openCount }, { value: "concluidas", label: "Concluídas", count: doneCount }, { value: "todas", label: "Todas", count: base.length }]} />
        </div>
        <div className="grid gap-2 border-b border-line-soft px-4 py-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_170px_170px_auto]">
          <div className="relative">
            <Icons.Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou cliente…" className="pl-8" />
          </div>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Responsável">
            <option value="">Todos os responsáveis</option>
            {db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory | "")} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {(Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]).map((c) => <option key={c} value={c}>{TASK_CATEGORY_LABEL[c]}</option>)}
          </Select>
          <Select value={origin} onChange={(e) => setOrigin(e.target.value as "" | "manual" | "auto")} aria-label="Origem">
            <option value="">Manual e automática</option>
            <option value="manual">Somente manuais</option>
            <option value="auto">Somente automáticas</option>
          </Select>
          {hasFilters ? <Button variant="ghost" onClick={() => { setOwner(""); setCategory(""); setOrigin(""); setQ(""); }}>Limpar</Button> : <span className="hidden lg:block" />}
        </div>
        <div className="divide-y divide-line-soft">
          {filtered.map((t) => <TaskRow key={t.id} task={t} />)}
          {!filtered.length && (
            <Empty icon={<Icons.ListChecks className="h-5 w-5" />} title={hasFilters ? "Nenhuma tarefa com esses filtros" : tab === "abertas" ? "Nenhuma tarefa aberta" : "Nenhuma tarefa"}>
              {hasFilters ? "Ajuste ou limpe os filtros para ver mais resultados." : "As automações criam tarefas sozinhas quando algo precisa de atenção."}
            </Empty>
          )}
        </div>
        {filtered.length > 0 && <div className="px-4 py-2.5 text-2xs text-ink-muted">{filtered.length} tarefa(s) · ordenadas por vencimento</div>}
      </Card>

      <NewTaskDialog open={open} onClose={closeDialog} />
    </div>
  );
}

function NewTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, today, user, update, toast } = useStore();
  const [title, setTitle] = useState("");
  const [party, setParty] = useState<PartyRef | undefined>();
  const [category, setCategory] = useState<TaskCategory>("follow_up");
  const [due, setDue] = useState(today);
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [waitingOn, setWaitingOn] = useState<"" | "cliente" | "seguradora">("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(""); setParty(undefined); setCategory("follow_up"); setDue(today); setOwnerId(user?.id ?? ""); setWaitingOn(""); setDescription("");
    }
  }, [open, today, user]);

  const valid = title.trim().length >= 3 && !!due && !!ownerId;
  const submit = () => {
    if (!valid) return;
    const t: Omit<Task, "id" | "status" | "createdAt" | "demo" | "origin"> = {
      title: title.trim(), description: description.trim() || undefined, party, category, due, ownerId,
      waitingOn: waitingOn || undefined, waitingSince: waitingOn ? today : undefined,
    };
    update((d, u) => createTask(d, u, t));
    toast(`Tarefa criada para ${db.users.find((x) => x.id === ownerId)?.name.split(" ")[0] ?? "o responsável"}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nova tarefa" footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={submit} disabled={!valid} icon={<Icons.Check className="h-4 w-4" />}>Criar tarefa</Button></>}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Título">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Solicitar CRLV atualizado" />
        </Field>
        <Field label="Cliente" hint="Opcional. Lista apenas clientes da sua carteira visível.">
          <PartySelect value={party} onChange={setParty} placeholder="Sem cliente vinculado" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Categoria">
            <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
              {(Object.keys(TASK_CATEGORY_LABEL) as TaskCategory[]).map((c) => <option key={c} value={c}>{TASK_CATEGORY_LABEL[c]}</option>)}
            </Select>
          </Field>
          <Field label="Vencimento">
            <Input type="date" value={due} min={addDays(today, -365)} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Responsável">
            <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Aguardando">
            <Select value={waitingOn} onChange={(e) => setWaitingOn(e.target.value as "" | "cliente" | "seguradora")}>
              <option value="">Ninguém (ação nossa)</option>
              <option value="cliente">Aguardando cliente</option>
              <option value="seguradora">Aguardando seguradora</option>
            </Select>
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes, contexto ou próximo passo (opcional)" />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
