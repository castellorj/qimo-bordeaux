"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { setLang, getCurrentLang, type Lang } from "./GoogleTranslate";

const KEY = "qimo:welcomed";
const LANGS: { code: Lang; name: string; flag: string }[] = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

// Abertura mostrada só na 1ª vez: escolher idioma (fácil de achar) + orientação.
export function WelcomeSheet() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch {}
  }, []);

  if (!show) return null;

  const choose = (code: Lang) => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    if (code === getCurrentLang()) setShow(false);
    else setLang(code); // aplica o idioma e recarrega
  };

  return (
    <div className="notranslate fixed inset-0 z-[100] flex items-center justify-center p-5" translate="no"
      style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(6px)" }}>
      <div className="card w-full max-w-md p-8 text-center shadow-float">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qimo-logo-dark.png" alt="QIMO" className="mx-auto h-12 w-auto object-contain" />
        <p className="kicker mt-5">Bem-vindo · Welcome · Bienvenido</p>
        <h1 className="display mt-2 text-3xl">Seu guia de Bordeaux</h1>
        <p className="mx-auto mt-3 max-w-xs font-serif text-[15px] font-light leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Seu concierge digital da viagem — programação, mesas, vinícolas e mapas, disponível até offline.
        </p>

        <p className="mt-7 font-sans text-[11px] uppercase tracking-luxe text-gold-deep">Escolha seu idioma</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => choose(l.code)}
              className="flex flex-col items-center gap-1.5 rounded-[14px] border py-4 transition-colors hover:border-gold hover:bg-cream"
              style={{ borderColor: "var(--line)" }}>
              <span className="text-2xl leading-none">{l.flag}</span>
              <span className="font-sans text-[12px] font-medium">{l.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 font-sans text-[11px] text-muted">
          <Icon name="Languages" size={13} className="text-gold-deep" /> Você pode trocar quando quiser no ícone de idioma, no topo.
        </p>
      </div>
    </div>
  );
}
