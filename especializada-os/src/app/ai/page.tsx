"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { batchStartRenewals } from "@/data/actions";
import { ask, SUGGESTED_QUESTIONS, type AssistantAnswer } from "@/domain/engines/assistant";
import { Badge, Button, Card, DemoBadge, Empty, Icons, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { norm } from "@/lib/text";

interface Turn {
  id: number;
  question: string;
  answer: AssistantAnswer;
  at: string;
  done?: Record<number, string>; // ações já executadas → mensagem de resultado
}

function daysFromQuestion(q: string) {
  const m = norm(q).match(/(\d+)\s*dias?/);
  return m ? Number(m[1]) : 30;
}

export default function AIPage() {
  return (
    <Suspense fallback={null}>
      <Assistant />
    </Suspense>
  );
}

function Assistant() {
  const { db, today, user, can, update, toast } = useStore();
  const params = useSearchParams();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoAsked = useRef<string | null>(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const submit = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setInput("");
    setThinking(true);
    // pequena pausa só para a interface respirar; o motor é síncrono e determinístico
    setTimeout(() => {
      const answer = ask(dbRef.current, q, today, user);
      setTurns((t) => [...t, { id: Date.now(), question: q, answer, at: new Date().toISOString() }]);
      setThinking(false);
    }, 250);
  };

  useEffect(() => {
    const q = params.get("q");
    if (q && autoAsked.current !== q && can("ai.use")) {
      autoAsked.current = q;
      submit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, thinking]);

  const runCommand = (turn: Turn, idx: number) => {
    const days = daysFromQuestion(turn.question);
    const res = batchStartRenewals(dbRef.current, user, days);
    update(() => res.db);
    const msg = res.created ? `${res.created} processo(s) de renovação iniciado(s) — revise em Renovações` : "Nenhum processo novo: as renovações do período já estavam abertas";
    toast(msg, res.created ? "ok" : "info");
    setTurns((ts) => ts.map((t) => (t.id === turn.id ? { ...t, done: { ...t.done, [idx]: msg } } : t)));
  };

  if (!can("ai.use")) {
    return (
      <div>
        <PageHeader icon={<Icons.Sparkles className="h-5 w-5" />} title="Especializada AI" />
        <Card><Empty icon={<Icons.Lock className="h-5 w-5" />} title="Sem permissão">Seu perfil não tem acesso à Especializada AI. Fale com o administrador.</Empty></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <PageHeader
        icon={<Icons.Sparkles className="h-5 w-5" />}
        title={<span className="flex items-center gap-2">Especializada AI <DemoBadge /></span>}
        subtitle="Consulta dados reais do sistema e mostra a origem. Na DEMO, o motor é determinístico (sem LLM); em produção um LLM interpreta a pergunta e chama as mesmas ferramentas."
        actions={turns.length > 0 && <Button variant="ghost" size="sm" icon={<Icons.RotateCcw className="h-3.5 w-3.5" />} onClick={() => setTurns([])}>Nova conversa</Button>}
      />

      <div className="space-y-5 pb-4">
        {turns.length === 0 && !thinking && (
          <Card>
            <div className="flex flex-col items-center px-2 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-card"><Icons.Sparkles className="h-6 w-6" /></div>
              <h2 className="mt-3 text-base font-semibold text-ink">Pergunte sobre a sua carteira</h2>
              <p className="mt-1 max-w-lg text-sm text-ink-muted">Vencimentos, clientes que precisam de atenção, oportunidades, comissões, planos de saúde e rede credenciada. Toda resposta cita a fonte — se não houver dado, a AI diz que não sabe.</p>
              <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{s}</button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {turns.map((t) => (
          <div key={t.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white shadow-sm">{t.question}</div>
            </div>
            <AnswerBubble turn={t} onCommand={(i) => runCommand(t, i)} onAsk={submit} />
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icons.Sparkles className="h-3.5 w-3.5" /></span>
            <Icons.Loader2 className="h-4 w-4 animate-spin" />Consultando os dados…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-canvas via-canvas to-transparent px-1 pb-3 pt-4">
        {turns.length > 0 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {SUGGESTED_QUESTIONS.slice(0, 8).map((s) => (
              <button key={s} onClick={() => submit(s)} className="shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-1 text-2xs text-ink-soft hover:border-brand-300 hover:text-brand-700">{s}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex items-end gap-2 rounded-xl border border-line bg-white p-2 shadow-card focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
            rows={1}
            placeholder="Pergunte algo… ex.: Quem tem seguro vencendo este mês?"
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <Button type="submit" disabled={!input.trim() || thinking} icon={<Icons.ArrowUp className="h-4 w-4" />} aria-label="Enviar">Enviar</Button>
        </form>
        <p className="mt-1.5 text-center text-2xs text-ink-faint">Respeita suas permissões e a visibilidade da sua carteira. Ações em lote ficam sempre para revisão humana.</p>
      </div>
    </div>
  );
}

function AnswerBubble({ turn, onCommand, onAsk }: { turn: Turn; onCommand: (idx: number) => void; onAsk: (q: string) => void }) {
  const a = turn.answer;
  const unknown = a.intent === "unknown";
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icons.Sparkles className="h-3.5 w-3.5" /></span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 shadow-card">
        <p className={cn("text-sm leading-relaxed text-ink", unknown && "text-ink-soft")}>{a.text}</p>

        {a.bullets && a.bullets.length > 0 && (
          a.intent === "draft_whatsapp" ? (
            <div className="mt-2 whitespace-pre-wrap rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-ink ring-1 ring-inset ring-emerald-100">{a.bullets[0]}</div>
          ) : (
            <ul className="mt-2 space-y-1">
              {a.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-soft">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  {unknown ? <button type="button" onClick={() => onAsk(b)} className="text-left text-brand-700 hover:underline">{b}</button> : <span>{b}</span>}
                </li>
              ))}
            </ul>
          )
        )}

        {a.table && (
          a.table.rows.length ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr>{a.table.columns.map((c) => <th key={c} className="whitespace-nowrap border-b border-line bg-canvas px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-muted">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {a.table.rows.map((r, i) => (
                    <tr key={i} className={cn("group", r.href && "hover:bg-brand-50/50")}>
                      {r.cells.map((c, j) => (
                        <td key={j} className="border-b border-line-soft px-3 py-2 align-top text-ink-soft last:border-r-0 group-last:border-b-0">
                          {r.href && j === 0 ? <Link href={r.href} className="font-medium text-ink hover:text-brand-700">{c}</Link> : r.href ? <Link href={r.href} className="block">{c}</Link> : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null
        )}

        {a.actions && a.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {a.actions.map((act, i) => {
              if (act.command === "batch_renewals") {
                const done = turn.done?.[i];
                return done ? (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-2.5 py-1.5 text-xs font-medium text-ok-strong"><Icons.CheckCircle2 className="h-3.5 w-3.5" />{done}</span>
                ) : (
                  <Button key={i} size="sm" onClick={() => onCommand(i)} icon={<Icons.Zap className="h-3.5 w-3.5" />}>{act.label}</Button>
                );
              }
              if (!act.href) return null;
              return act.external ? (
                <a key={i} href={act.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-ink shadow-sm hover:bg-canvas">
                  <Icons.ExternalLink className="h-3.5 w-3.5" />{act.label}
                </a>
              ) : (
                <Link key={i} href={act.href} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-ink shadow-sm hover:bg-canvas">
                  {act.label}<Icons.ArrowRight className="h-3.5 w-3.5" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line-soft pt-2.5">
          {a.sources.length ? (
            <>
              <span className="text-2xs font-medium uppercase tracking-wide text-ink-faint">Fonte</span>
              {a.sources.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded bg-line-soft px-1.5 py-0.5 text-2xs text-ink-muted"><Icons.Database className="h-3 w-3" />{s}</span>
              ))}
            </>
          ) : (
            <span className="text-2xs text-ink-faint">{unknown ? "Sem ferramenta correspondente — nenhuma informação foi inventada." : "Sem consulta a dados nesta resposta."}</span>
          )}
          <Badge className="ml-auto" tone="neutral">motor: {a.intent}</Badge>
        </div>
      </div>
    </div>
  );
}
