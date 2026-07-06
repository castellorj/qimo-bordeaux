"use client";

import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Icon } from "./Icon";
import { supabase } from "@/lib/supabase/client";

const DEVICE_LS = "qimo_device_token";
const GUEST_LS = "qimo:guest";

function deviceToken(): string {
  try {
    let d = localStorage.getItem(DEVICE_LS);
    if (!d) { d = crypto.randomUUID(); localStorage.setItem(DEVICE_LS, d); }
    return d;
  } catch { return crypto.randomUUID(); }
}

export function WelcomeSheet() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState<string | undefined>();
  const [country, setCountry] = useState<string>("BR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [leaving, setLeaving] = useState(false);
  const restoring = useRef(false);

  // Reconhecimento de dispositivo: se já entrou neste aparelho, abre direto.
  useEffect(() => {
    if (restoring.current) return;
    restoring.current = true;
    (async () => {
      try {
        if (localStorage.getItem(GUEST_LS)) return; // já reconhecido
        const dev = localStorage.getItem(DEVICE_LS);
        if (dev) {
          const { data } = await supabase().rpc("guest_by_device", { p_device: dev });
          const g = (data as any[])?.[0];
          if (g) { try { localStorage.setItem(GUEST_LS, JSON.stringify({ name: g.name })); } catch {} return; }
        }
        setShow(true);
      } catch { setShow(true); }
    })();
  }, []);

  if (!show) return null;

  const enter = (guestName?: string) => {
    try { localStorage.setItem(GUEST_LS, JSON.stringify({ name: guestName ?? null })); } catch {}
    setLeaving(true);
    setTimeout(() => setShow(false), 450);
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 8) { setErr("Informe um telefone válido, com DDD."); return; }
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase().rpc("guest_check", { p_phone: phone });
      if (error) throw error;
      const g = (data as any[])?.[0];
      if (g) {
        const dev = deviceToken();
        await supabase().rpc("guest_touch", { p_id: g.id, p_device: dev });
        enter(g.name);
      } else {
        setStep(2);
      }
    } catch {
      enter(); // nunca travar o hóspede
    } finally { setBusy(false); }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr("Preencha nome e e-mail válidos."); return; }
    setBusy(true); setErr("");
    try {
      const dev = deviceToken();
      const { error } = await supabase().rpc("guest_register", {
        p_name: name.trim(), p_email: email.trim(), p_phone: phone, p_country: country, p_device: dev,
      });
      if (error) throw error;
      enter(name.trim());
    } catch {
      enter(name.trim());
    } finally { setBusy(false); }
  };

  return (
    <div className={`qimo-gate notranslate fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`} translate="no">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/photos/hero-bordeaux.jpg" alt="Bordeaux" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(42,20,25,.5), rgba(42,20,25,.82) 58%, rgba(42,20,25,.96))" }} />

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qimo-logo.png" alt="QIMO" className="mx-auto h-14 w-auto object-contain" onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")} />
        <p className="mt-6 font-sans text-[11px] uppercase tracking-luxe text-gold-soft">Bordeaux Experience</p>

        {step === 1 ? (
          <form onSubmit={submitPhone} className="mt-3">
            <h1 className="display text-4xl text-cream sm:text-5xl">Bem-vindo a bordo</h1>
            <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed text-cream/80">
              Seu concierge digital pela grande Bordeaux. Informe seu telefone para entrar.
            </p>
            <div className="mt-8">
              <PhoneInput international defaultCountry="BR" value={phone} onChange={setPhone}
                onCountryChange={(c) => setCountry(c || "BR")} autoFocus placeholder="+55 21 99999-9999" />
            </div>
            {err && <p className="mt-3 font-sans text-[12px] text-gold-soft">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-6 w-full !py-3.5 text-[15px]">
              {busy ? "Verificando…" : "Entrar"} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
            <p className="mt-4 font-sans text-[11px] leading-relaxed text-cream/55">
              Seus dados são tratados com discrição. Sem senha, sem spam.
            </p>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="mt-3">
            <h1 className="display text-4xl text-cream sm:text-5xl">Complete seu cadastro</h1>
            <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed text-cream/80">
              Só mais um passo para abrir o seu guia.
            </p>
            <div className="mt-7 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo *" autoComplete="name" autoFocus className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail *" autoComplete="email" inputMode="email" className={inputCls} />
              <input value={phone ?? ""} readOnly className={`${inputCls} opacity-60`} />
            </div>
            {err && <p className="mt-3 font-sans text-[12px] text-gold-soft">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-6 w-full !py-3.5 text-[15px]">
              {busy ? "Cadastrando…" : "Entrar no guia"} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
            <button type="button" onClick={() => { setStep(1); setErr(""); }} className="mt-4 font-sans text-[12px] text-cream/60 hover:text-cream">← Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-full border border-cream/25 bg-white/10 px-5 py-3.5 font-sans text-[15px] text-cream placeholder:text-cream/50 outline-none backdrop-blur-sm focus:border-gold";
