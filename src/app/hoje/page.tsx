"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HojeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/programacao"); }, [router]);
  return <div className="container-editorial py-24 text-center text-muted">Abrindo sua viagem...</div>;
}
