"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  let d = Math.max(0, target - now);
  const days = Math.floor(d / 86400000);
  d -= days * 86400000;
  const hours = Math.floor(d / 3600000);
  d -= hours * 3600000;
  const mins = Math.floor(d / 60000);
  d -= mins * 60000;
  const secs = Math.floor(d / 1000);
  return { days, hours, mins, secs };
}

export function Countdown({ iso, label = "para o embarque" }: { iso: string; label?: string }) {
  const target = new Date(iso).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const started = t && t.days === 0 && t.hours === 0 && t.mins === 0 && t.secs === 0;

  const cell = (v: number, l: string) => (
    <div className="flex flex-col items-center">
      <span className="font-serif text-3xl font-light leading-none tabular-nums text-cream sm:text-4xl">
        {String(v).padStart(2, "0")}
      </span>
      <span className="mt-1.5 font-sans text-[9px] uppercase tracking-luxe text-cream/50">{l}</span>
    </div>
  );

  return (
    <div className="text-center notranslate" translate="no">
      <p className="kicker text-gold-soft">{started ? "A viagem começou" : label}</p>
      <div className="mt-4 flex items-start justify-center gap-4 sm:gap-6">
        {t ? (
          <>
            {cell(t.days, "dias")}
            <span className="font-serif text-2xl font-light text-cream/30">:</span>
            {cell(t.hours, "horas")}
            <span className="font-serif text-2xl font-light text-cream/30">:</span>
            {cell(t.mins, "min")}
            <span className="font-serif text-2xl font-light text-cream/30">:</span>
            {cell(t.secs, "seg")}
          </>
        ) : (
          <span className="font-serif text-3xl font-light text-cream/40">—</span>
        )}
      </div>
    </div>
  );
}
