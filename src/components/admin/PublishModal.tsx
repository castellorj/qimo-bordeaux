"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { contentCounts, getBuildHookUrl, setBuildHookUrl, triggerPublish } from "@/lib/supabase/content-admin";
import type { BxActivityFull } from "@/lib/supabase/bordeaux";
import clsx from "clsx";

interface Check { label: string; ok: boolean; detail?: string }

export function PublishModal({ acts, onClose }: { acts: BxActivityFull[]; onClose: () => void }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [hook, setHook] = useState("");
  const [editingHook, setEditingHook] = useState(false);
  const [hookMsg, setHookMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    (async () => {
      const counts = await contentCounts();
      const noPhoto = counts.reduce((s, c) => s + c.noPhoto, 0);
      const totalItems = counts.reduce((s, c) => s + c.total, 0);
      const soldOut = acts.filter((a) => a.capacity_total != null && (a.available ?? 0) <= 0).length;
      setChecks([
        { label: "Conteúdo importado no painel", ok: totalItems > 0, detail: `${totalItems} itens` },
        { label: "Todas as fichas com foto", ok: noPhoto === 0, detail: noPhoto ? `${noPhoto} sem foto` : "ok" },
        { label: "Programação com passeios cadastrados", ok: acts.length > 0, detail: `${acts.length} passeios` },
        { label: "Sem passeios esgotados sem aviso", ok: true, detail: soldOut ? `${soldOut} esgotado(s) — ok, avisados` : "ok" },
      ]);
      setHook(await getBuildHookUrl());
    })();
  }, [acts]);

  const publish = async () => {
    if (!hook.trim()) {
      setHookMsg("Configure o Build Hook antes de publicar.");
      setEditingHook(true);
      return;
    }
    setState("sending");
    const r = await triggerPublish();
    if (r.ok) setState("done");
    else if (r.error === "no-hook") { setHookMsg("Configure o Build Hook antes de publicar."); setEditingHook(true); setState("idle"); }
    else setState("error");
  };

  const saveHook = async () => {
    const clean = hook.trim();
    if (!/^https:\/\/api\.netlify\.com\/build_hooks\/.+/.test(clean)) {
      setHookMsg("Cole um Build Hook valido do Netlify.");
      return;
    }
    await setBuildHookUrl(clean);
    setHook(clean);
    setHookMsg("Build Hook salvo.");
    setEditingHook(false);
  };

  const warnings = (checks || []).filter((c) => !c.ok).length;
  const canPublish = state !== "sending" && Boolean(hook.trim());

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-xl font-light"><Icon name="Rocket" size={18} className="text-petrol-600" /> Publicar alterações</h3>
          <button onClick={onClose} className="text-muted hover:text-gold-deep"><Icon name="X" size={18} /></button>
        </div>

        <div className="mt-3 rounded-[10px] bg-olive/10 p-3">
          <p className="font-sans text-[12px] leading-relaxed text-olive-deep">
            As edições de <strong>conteúdo, fotos e textos</strong> já aparecem no guia em segundos — não precisam de publicação.
            Use este botão para forçar uma <strong>reconstrução completa</strong> do site (necessária após mudanças estruturais).
          </p>
        </div>

        <p className="kicker mt-5">Checklist automático</p>
        <div className="mt-2 space-y-1.5">
          {(checks || []).map((c, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon name={c.ok ? "CircleCheck" : "AlertTriangle"} size={16} className={c.ok ? "text-olive-deep" : "text-gold-deep"} />
              <span className="flex-1 font-sans text-[13px]" style={{ color: "var(--text)" }}>{c.label}</span>
              {c.detail && <span className="font-sans text-[11px] text-muted">{c.detail}</span>}
            </div>
          ))}
          {!checks && <p className="font-sans text-[13px] text-muted">Verificando…</p>}
        </div>
        {warnings > 0 && <p className="mt-2 font-sans text-[11px] text-gold-deep">{warnings} aviso(s) — você ainda pode publicar.</p>}

        {editingHook ? (
          <div className="mt-5 rounded-[10px] border p-3" style={{ borderColor: "var(--line)" }}>
            <p className="font-sans text-[12px] text-muted">Cole o <strong>Build Hook</strong> do Netlify (Site settings → Build & deploy → Build hooks):</p>
            <input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="https://api.netlify.com/build_hooks/…"
              className="mt-2 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-[12px] outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
            {hookMsg && <p className="mt-2 font-sans text-[11px] text-muted">{hookMsg}</p>}
            <button onClick={saveHook} className="btn-primary mt-3 !px-4 !py-2">Salvar hook</button>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={() => setEditingHook(true)} className="font-sans text-[12px] text-muted hover:text-gold-deep">
              {hook ? "Alterar build hook" : "Configurar publicação"}
            </button>
            {state === "done" ? (
              <span className="flex items-center gap-2 font-sans text-[13px] text-olive-deep"><Icon name="CircleCheck" size={16} /> Reconstrução iniciada!</span>
            ) : state === "error" ? (
              <span className="font-sans text-[13px] text-[#8f2f2f]">Erro ao publicar. Tente de novo.</span>
            ) : (
              <button onClick={publish} disabled={!canPublish} className={clsx("btn-primary", !canPublish && "opacity-60")}>
                <Icon name="Rocket" size={15} /> {state === "sending" ? "Publicando…" : "Publicar agora"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
