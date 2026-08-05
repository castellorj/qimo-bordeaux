"use client";

// Persistência do login do hóspede resistente ao WebView do WhatsApp:
// grava em localStorage E num cookie de 1 ano. Se o localStorage for apagado
// entre sessões (comum no in-app browser), restaura pelo cookie — assim o guia
// NÃO pede o telefone de novo.

const GUEST_LS = "qimo:guest:v3";
const DEVICE_LS = "qimo_device_token:v3";
const GUEST_CK = "qimo_g3";
const DEVICE_CK = "qimo_d3";
const DAYS = 365;

function setCookie(name: string, value: string) {
  try {
    const exp = new Date(Date.now() + DAYS * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Lax`;
  } catch {}
}
function getCookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}

export function persistGuest(guest: { name?: string | null; phone?: string | null }) {
  const s = JSON.stringify(guest);
  try { localStorage.setItem(GUEST_LS, s); } catch {}
  setCookie(GUEST_CK, s);
}

// Retorna o JSON cru do hóspede (localStorage, senão cookie — reidratando o localStorage).
export function loadGuestRaw(): string | null {
  try { const ls = localStorage.getItem(GUEST_LS); if (ls) return ls; } catch {}
  const ck = getCookie(GUEST_CK);
  if (ck) { try { localStorage.setItem(GUEST_LS, ck); } catch {} return ck; }
  return null;
}

export function persistDevice(token: string) {
  try { localStorage.setItem(DEVICE_LS, token); } catch {}
  setCookie(DEVICE_CK, token);
}

export function loadDevice(): string | null {
  try { const ls = localStorage.getItem(DEVICE_LS); if (ls) return ls; } catch {}
  const ck = getCookie(DEVICE_CK);
  if (ck) { try { localStorage.setItem(DEVICE_LS, ck); } catch {} return ck; }
  return null;
}
