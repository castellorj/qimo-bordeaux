"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// "Mais" foi unificado ao Concierge (contatos, navio, etiqueta, utilidades, idioma).
// Mantido apenas como redirecionamento para links/bookmarks antigos.
export default function MaisRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/concierge");
  }, [router]);
  return (
    <div className="container-editorial py-20 text-center text-muted">
      <p className="font-sans text-[14px]">Redirecionando para o Concierge…</p>
    </div>
  );
}
