"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { addParticipant } from "@/lib/supabase/bordeaux";

// Mini-formulário para transformar um lead / quem reservou em cliente.
// Controlado: `initial` != null abre o modal com nome/telefone pré-preenchidos.
export function CadastroClienteModal({ initial, onClose, onSaved }: {
  initial: { name?: string; phone?: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ full_name: "", phone: "", family: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ full_name: initial.name || "", phone: initial.phone || "", family: "", email: "" });
  }, [initial]);

  if (!initial) return null;

  const save = async () => {
    setSaving(true);
    try {
      await addParticipant({
        full_name: form.full_name.trim() || "(sem nome)",
        phone: form.phone.trim() || null,
        family: form.family.trim() || null,
        email: form.email.trim() || null,
      });
      onSaved();
    } catch { alert("Não foi possível cadastrar. Tente de novo."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(20,7,11,.5)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-[16px] bg-paper p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg font-light">Cadastrar como cliente</h4>
          <button onClick={onClose} className="text-muted hover:text-gold-deep"><Icon name="X" size={18} /></button>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Nome completo" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="Família / grupo (vincula ao parceiro)" value={form.family} onChange={(v) => setForm((f) => ({ ...f, family: v }))} placeholder="ex.: Par 12" hint="Mesmo valor do parceiro → o par aparece na reserva." />
          <Field label="E-mail (opcional)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-primary !px-4 !py-2 text-[13px] disabled:opacity-50">
            <Icon name="UserPlus" size={14} /> {saving ? "Salvando…" : "Cadastrar"}
          </button>
          <button onClick={onClose} className="btn-ghost !px-4 !py-2 text-[13px]">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="font-sans text-[10px] uppercase tracking-wide2 text-muted">{label}</span>
      {hint && <span className="mb-1 block font-sans text-[11px] text-muted">{hint}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-[8px] border bg-transparent px-3 py-2 font-sans text-base outline-none focus:border-gold" style={{ borderColor: "var(--line)" }} />
    </label>
  );
}
