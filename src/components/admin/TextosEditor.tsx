"use client";

import { useEffect, useState } from "react";
import { EDITABLE_LABELS, ui } from "@/lib/i18n";
import { listSettings, upsertSetting } from "@/lib/supabase/content-admin";

export function TextosEditor() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await listSettings();
      const v: Record<string, string> = {};
      EDITABLE_LABELS.forEach(({ key }) => { v[key] = s[key]?.pt ?? (ui as any)[key]?.pt ?? key; });
      setVals(v);
      setLoading(false);
    })();
  }, []);

  const save = async (key: string, grp: string) => {
    await upsertSetting(key, { pt: vals[key] }, grp);
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  const groups = [...new Set(EDITABLE_LABELS.map((l) => l.grp))];
  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <div className="space-y-8">
      <p className="max-w-2xl font-sans text-[13px] leading-relaxed text-muted">
        Edite os nomes dos botões e itens de menu. As mudanças aparecem no site em instantes, <strong>sem republicar</strong>.
        Os idiomas EN/ES são traduzidos automaticamente a partir do texto em português.
      </p>
      {groups.map((g) => (
        <div key={g}>
          <p className="kicker mb-3">{g}</p>
          <div className="space-y-2">
            {EDITABLE_LABELS.filter((l) => l.grp === g).map(({ key, grp }) => (
              <div key={key} className="card flex items-center gap-3 p-3">
                <span className="hidden w-44 shrink-0 truncate font-mono text-[11px] text-muted sm:block">{key}</span>
                <input value={vals[key] || ""} onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
                  className="flex-1 rounded-[8px] border bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
                <button onClick={() => save(key, grp)} className="btn-ghost !px-3 !py-1.5">
                  {saved === key ? "✓ Salvo" : "Salvar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
