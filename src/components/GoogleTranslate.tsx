"use client";

import { useEffect } from "react";

// Widget oficial do Google que traduz a página inteira (PT base → EN/ES).
// O banner nativo é ocultado via CSS; o controle fica no seletor de idioma.
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "pt",
            includedLanguages: "pt,en,es",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      } catch {}
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return <div id="google_translate_element" aria-hidden className="!hidden" />;
}

// Idioma atual (a partir do cookie googtrans) e troca de idioma.
export type Lang = "pt" | "en" | "es";

export function getCurrentLang(): Lang {
  if (typeof document === "undefined") return "pt";
  const m = document.cookie.match(/googtrans=\/[a-z]{2}\/([a-z]{2})/);
  return (m?.[1] as Lang) || "pt";
}

export function setLang(target: Lang) {
  const host = window.location.hostname;
  const clear = (domain?: string) => {
    document.cookie = `googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? ";domain=" + domain : ""}`;
  };
  const set = (domain?: string) => {
    document.cookie = `googtrans=/pt/${target};path=/${domain ? ";domain=" + domain : ""}`;
  };

  clear();
  clear(host);
  clear("." + host);

  if (target !== "pt") {
    set();
    set(host);
    set("." + host);
  }
  try {
    localStorage.setItem("qimo:lang", target);
  } catch {}
  window.location.reload();
}
