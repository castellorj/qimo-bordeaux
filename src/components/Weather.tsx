"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

interface Wx {
  temp: number;
  code: number;
  max: number;
  min: number;
  rain: number;
  wind: number;
}

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Céu limpo", icon: "Sun" },
  1: { label: "Predom. limpo", icon: "Sun" },
  2: { label: "Parcial. nublado", icon: "CloudRain" },
  3: { label: "Nublado", icon: "CloudRain" },
  45: { label: "Névoa", icon: "Wind" },
  48: { label: "Névoa gelada", icon: "Wind" },
  51: { label: "Garoa", icon: "CloudRain" },
  53: { label: "Garoa", icon: "CloudRain" },
  61: { label: "Chuva fraca", icon: "CloudRain" },
  63: { label: "Chuva", icon: "CloudRain" },
  65: { label: "Chuva forte", icon: "CloudRain" },
  80: { label: "Aguaceiros", icon: "CloudRain" },
  95: { label: "Trovoada", icon: "CloudRain" },
};

function dress(temp: number) {
  if (temp >= 22) return "Roupas leves; um casaco leve para a noite.";
  if (temp >= 15) return "Camadas: casaco leve e echarpe para o fim da tarde.";
  if (temp >= 8) return "Casaco de meia-estação, echarpe e sapato fechado.";
  return "Casaco quente, echarpe e luvas para os passeios ao ar livre.";
}

export function Weather({
  lat = 44.84,
  lng = -0.58,
  place = "Bordeaux",
  compact = false,
}: {
  lat?: number;
  lng?: number;
  place?: string;
  compact?: boolean;
}) {
  const [wx, setWx] = useState<Wx | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FParis`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        setWx({
          temp: Math.round(j.current.temperature_2m),
          code: j.current.weather_code,
          wind: Math.round(j.current.wind_speed_10m),
          max: Math.round(j.daily.temperature_2m_max[0]),
          min: Math.round(j.daily.temperature_2m_min[0]),
          rain: j.daily.precipitation_probability_max?.[0] ?? 0,
        });
      })
      .catch(() => setErr(true));
  }, [lat, lng]);

  const cond = wx ? WMO[wx.code] ?? { label: "—", icon: "Sun" } : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-cream/90 notranslate" translate="no">
        <Icon name={cond?.icon || "Sun"} size={16} className="text-gold-soft" />
        <span className="font-sans text-sm tabular-nums">{wx ? `${wx.temp}°` : err ? "—" : "··"}</span>
        <span className="font-sans text-[11px] text-cream/50">{place}</span>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker-muted">Clima em {place}</p>
          <p className="mt-1 font-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
            {cond?.label || (err ? "Indisponível offline" : "Carregando…")}
          </p>
        </div>
        <Icon name={cond?.icon || "Sun"} size={30} className="text-gold" strokeWidth={1.2} />
      </div>
      <div className="mt-4 flex items-end gap-4">
        <span className="font-serif text-5xl font-light leading-none tabular-nums">
          {wx ? `${wx.temp}°` : "—"}
        </span>
        {wx && (
          <div className="pb-1 font-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
            <div>Máx {wx.max}° · Mín {wx.min}°</div>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Icon name="CloudRain" size={12} /> {wx.rain}%
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="Wind" size={12} /> {wx.wind} km/h
              </span>
            </div>
          </div>
        )}
      </div>
      {wx && (
        <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <p className="kicker-muted">O que vestir</p>
          <p className="mt-1.5 font-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {dress(wx.temp)}
          </p>
        </div>
      )}
    </div>
  );
}
