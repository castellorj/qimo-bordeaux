"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { supabase } from "@/lib/supabase/client";

const KEY = "qimo:guest";

export function WelcomeSheet() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"phone" | "register">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch {}
  }, []);

  if (!show) return null;

  const enter = (guest: { name?: string; phone: string }) => {
    try { localStorage.setItem(KEY, JSON.stringify(guest)); } catch {}
    setLeaving(true);
    setTimeout(() => setShow(false), 450);
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data, error } = await supabase().rpc("bordeaux_guest_enter", { p_phone: phone });
      if (error) throw error;
      const status = (data as any)?.status;
      if (status === "found") enter({ name: (data as any).name, phone });
      else if (status === "invalid") setErr("Digite um telefone válido, com DDD.");
      else { setStep("register"); } // need_info
    } catch {
      // Nunca travar o hóspede: em caso de erro de rede, permite entrar.
      enter({ phone });
    } finally { setBusy(false); }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Por favor, informe seu nome."); return; }
    setErr(""); setBusy(true);
    try {
      const { data, error } = await supabase().rpc("bordeaux_guest_enter", { p_phone: phone, p_name: name, p_email: email });
      if (error) throw error;
      enter({ name: (data as any)?.name || name, phone });
    } catch {
      enter({ name, phone });
    } finally { setBusy(false); }
  };

  const inputCls = "w-full rounded-full border border-cream/25 bg-white/10 px-5 py-3.5 font-sans text-[15px] text-cream placeholder:text-cream/50 outline-none backdrop-blur-sm focus:border-gold";

  return (
    <div className={`notranslate fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`} translate="no">
      {/* Foto de fundo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/photos/hero-bordeaux.jpg" alt="Bordeaux" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(42,20,25,.55), rgba(42,20,25,.82) 60%, rgba(42,20,25,.95))" }} />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qimo-logo.png" alt="QIMO" className="mx-auto h-14 w-auto object-contain" onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")} />
        <p className="mt-6 font-sans text-[11px] uppercase tracking-luxe text-gold-soft">Bordeaux Experience</p>
        <h1 className="display mt-3 text-4xl text-cream sm:text-5xl">Bem-vindo a bordo</h1>
        <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed text-cream/80">
          {step === "phone"
            ? "Seu concierge digital pela grande Bordeaux. Informe seu telefone para entrar."
            : "Não encontramos seu cadastro. Conte-nos quem é você para liberar o guia."}
        </p>

        {step === "phone" ? (
          <form onSubmit={submitPhone} className="mt-8 space-y-3">
            <input type="tel" inputMode="tel" required autoFocus placeholder="Telefone com DDD"
              value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            {err && <p className="font-sans text-[12px] text-gold-soft">{err}</p>}
            <button disabled={busy} className="btn-primary w-full !py-3.5 text-[15px]">
              {busy ? "Verificando…" : "Entrar"} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="mt-8 space-y-3">
            <input type="text" required autoFocus placeholder="Nome completo"
              value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            <input type="tel" inputMode="tel" required placeholder="Telefone com DDD"
              value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            <input type="email" placeholder="E-mail (opcional)"
              value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {err && <p className="font-sans text-[12px] text-gold-soft">{err}</p>}
            <button disabled={busy} className="btn-primary w-full !py-3.5 text-[15px]">
              {busy ? "Cadastrando…" : "Entrar"} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
            <button type="button" onClick={() => { setStep("phone"); setErr(""); }} className="font-sans text-[12px] text-cream/60 hover:text-cream">
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
