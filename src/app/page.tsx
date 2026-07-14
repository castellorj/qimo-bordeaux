"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A página inicial do site abre direto na programação da viagem.
export default function RootRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/programacao"); }, [router]);
  return <div className="container-editorial py-24 text-center text-muted">Abrindo sua viagem…</div>;
}
