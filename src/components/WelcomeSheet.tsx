"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Icon } from "./Icon";
import { supabase } from "@/lib/supabase/client";
import { getCurrentLang, type Lang } from "./GoogleTranslate";
import { LangDropdown } from "./LangSwitch";
import { useLocale } from "./providers";
import { cleanSiteImage, siteImageDef } from "@/lib/siteImages";
import { normalizePhone } from "@/lib/phone";

const DEVICE_LS = "qimo_device_token:v2";
const GUEST_LS = "qimo:guest:v2";

const STR: Record<Lang, Record<string, string>> = {
  pt: {
    kicker: "Bordeaux Experience",
    title1: "Bem-vindo a bordo",
    sub1: "Seu concierge digital pela grande Bordeaux. Informe seu telefone com DDD para entrar.",
    btn1: "Entrar", checking: "Verificando…",
    title2: "Complete seu cadastro", sub2: "Só mais um passo para abrir o seu guia.",
    name: "Nome completo *", email: "E-mail *", btn2: "Entrar no guia", registering: "Cadastrando…", back: "← Voltar",
    errPhone: "Informe um telefone válido com DDD. Exemplo: 21 99999-9999.", errForm: "Preencha nome e e-mail válidos.",
    priv: "Seus dados são tratados com discrição. Sem senha, sem spam.",
  },
  en: {
    kicker: "Bordeaux Experience",
    title1: "Welcome aboard",
    sub1: "Your digital concierge through greater Bordeaux. Enter your phone number to access the guide.",
    btn1: "Enter", checking: "Checking…",
    title2: "Complete your registration", sub2: "Just one more step to open your guide.",
    name: "Full name *", email: "Email *", btn2: "Enter the guide", registering: "Registering…", back: "← Back",
    errPhone: "Enter a valid phone number.", errForm: "Enter a valid name and email.",
    priv: "Your details are handled with discretion. No password, no spam.",
  },
  es: {
    kicker: "Bordeaux Experience",
    title1: "Bienvenido a bordo",
    sub1: "Tu concierge digital por la gran Bordeaux. Ingresa tu teléfono para acceder a la guía.",
    btn1: "Entrar", checking: "Verificando…",
    title2: "Completa tu registro", sub2: "Solo un paso más para abrir tu guía.",
    name: "Nombre completo *", email: "Correo *", btn2: "Entrar a la guía", registering: "Registrando…", back: "← Volver",
    errPhone: "Ingresa un teléfono válido.", errForm: "Ingresa un nombre y correo válidos.",
    priv: "Tus datos se tratan con discreción. Sin contraseña, sin spam.",
  },
};

function deviceToken(): string {
  try {
    let d = localStorage.getItem(DEVICE_LS);
    if (!d) { d = crypto.randomUUID(); localStorage.setItem(DEVICE_LS, d); }
    return d;
  } catch { return crypto.randomUUID(); }
}

export function WelcomeSheet() {
  const [show, setShow] = useState(false);
  const [lang, setLangState] = useState<Lang>("pt");
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState<string | undefined>();
  const [country, setCountry] = useState<string>("BR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [leaving, setLeaving] = useState(false);
  const restoring = useRef(false);
  const router = useRouter();
  const { cfg, settingsReady } = useLocale();
  const gateImg = cleanSiteImage(cfg("img.hero.gate")) || (settingsReady ? siteImageDef("img.hero.gate") : "");

  useEffect(() => {
    if (restoring.current) return;
    restoring.current = true;
    setLangState(getCurrentLang());
    (async () => {
      try {
        if (localStorage.getItem(GUEST_LS)) return;
        const dev = localStorage.getItem(DEVICE_LS);
        if (dev) {
          const { data } = await supabase().rpc("guest_by_device", { p_device: dev });
          const g = (data as any[])?.[0];
          if (g) { try { localStorage.setItem(GUEST_LS, JSON.stringify({ name: g.name, phone: normalizePhone(g.phone) || null })); } catch {} return; }
        }
        setShow(true);
      } catch { setShow(true); }
    })();
  }, []);

  if (!show) return null;
  // PT é editável no painel (Menus e textos → Tela de entrada); EN/ES vêm do STR.
  const L: Record<string, string> = { ...(STR[lang] ?? STR.pt) };
  if (lang === "pt") {
    for (const k of Object.keys(L)) {
      const ov = cfg(`gate.${k}`)?.trim();
      if (ov) L[k] = ov;
    }
  }

  const enter = (guestName?: string) => {
    // Guarda nome E telefone (E.164) — o telefone identifica as reservas do convidado.
    try { localStorage.setItem(GUEST_LS, JSON.stringify({ name: guestName ?? null, phone: normalizePhone(phone) || null })); } catch {}
    setLeaving(true);
    const onHome = typeof window !== "undefined" && window.location.pathname === "/";
    setTimeout(() => {
      if (onHome) router.replace("/programacao"); // abre direto na Viagem (programacao)
      else setShow(false);
    }, 450);
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) { setErr(L.errPhone); return; }
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase().rpc("guest_check", { p_phone: cleanPhone });
      if (error) throw error;
      const g = (data as any[])?.[0];
      if (g) { await supabase().rpc("guest_touch", { p_id: g.id, p_device: deviceToken() }); enter(g.name); }
      else setStep(2);
    } catch { enter(); } finally { setBusy(false); }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr(L.errForm); return; }
    setBusy(true); setErr("");
    try {
      const { error } = await supabase().rpc("guest_register", {
        p_name: name.trim(), p_email: email.trim(), p_phone: normalizePhone(phone), p_country: country, p_device: deviceToken(),
      });
      if (error) throw error;
      enter(name.trim());
    } catch { enter(name.trim()); } finally { setBusy(false); }
  };

  return (
    <div className={`qimo-gate notranslate fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#3f1d25] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`} translate="no">
      {gateImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={gateImg} alt="Bordeaux" className="animate-ken-burns absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <div className="absolute inset-0 bg-[#3f1d25]" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #4a252e 0%, #3f1d25 48%, #30141b 100%)" }} />

      {/* Seletor de idioma no topo — mesma caixa das outras páginas */}
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30">
        <LangDropdown />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qimo-logo-full.png" alt="QIMO" className="mx-auto h-11 w-auto object-contain sm:h-12" />
        <p className="mt-6 font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{L.kicker}</p>

        {step === 1 ? (
          <form onSubmit={submitPhone} className="mt-3">
            <h1 className="display text-4xl text-cream sm:text-5xl">{L.title1}</h1>
            <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed text-cream/80">{L.sub1}</p>
            <div className="mt-8">
              <PhoneInput international defaultCountry="BR" value={phone} onChange={setPhone}
                onCountryChange={(c) => setCountry(c || "BR")} autoFocus placeholder="+55 DDD + número" />
            </div>
            {err && <p className="mt-3 font-sans text-[12px] text-gold-soft">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-6 w-full !py-3.5 text-[15px]">
              {busy ? L.checking : L.btn1} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
            <p className="mt-4 font-sans text-[11px] leading-relaxed text-cream/55">{L.priv}</p>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="mt-3">
            <h1 className="display text-4xl text-cream sm:text-5xl">{L.title2}</h1>
            <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed text-cream/80">{L.sub2}</p>
            <div className="mt-7 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L.name} autoComplete="name" autoFocus className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={L.email} autoComplete="email" inputMode="email" className={inputCls} />
              <input value={phone ?? ""} readOnly className={`${inputCls} opacity-60`} />
            </div>
            {err && <p className="mt-3 font-sans text-[12px] text-gold-soft">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-6 w-full !py-3.5 text-[15px]">
              {busy ? L.registering : L.btn2} {!busy && <Icon name="ArrowRight" size={16} />}
            </button>
            <button type="button" onClick={() => { setStep(1); setErr(""); }} className="mt-4 font-sans text-[12px] text-cream/60 hover:text-cream">{L.back}</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-full border border-gold/70 bg-[#4a252e] px-5 py-3.5 font-sans text-base text-cream placeholder:text-cream/55 outline-none focus:border-gold";
