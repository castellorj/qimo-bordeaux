"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A "Viagem" agora abre direto na Programação. Esta rota apenas redireciona
// (protege instalações do PWA com start_url antigo em cache).
export default function ViagemRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/programacao"); }, [router]);
  return <div className="container-editorial py-20 text-center text-muted">Abrindo a programação…</div>;
}
