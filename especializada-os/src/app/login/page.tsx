"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/data/store";
import { Avatar, DemoBadge, Icons } from "@/components/ui";
import { ROLE_LABEL, DEFAULT_ROLE_PERMISSIONS } from "@/domain/rbac";

const ROLE_DESC: Record<string, string> = {
  admin: "Acesso total, perfis e configurações",
  gestor: "Toda a operação, relatórios e auditoria",
  corretor: "Carteira própria, cotações e propostas",
  operacional: "Emissões, documentos, importações",
  financeiro: "Comissões, relatórios e conciliação",
};

function Login() {
  const { db, setUser } = useStore();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl font-bold ring-1 ring-white/20">E</div>
          <h1 className="text-2xl font-semibold tracking-tight">Especializada Seguros OS</h1>
          <p className="mt-1 text-sm text-brand-200">Insurance Operating System — eliminar trabalho operacional, não apenas digitalizá-lo.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-pop">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">Entrar na DEMO</h2>
              <p className="text-xs text-ink-muted">Escolha um perfil para explorar o sistema com as permissões dele. Na versão real: login seguro com 2FA.</p>
            </div>
            <DemoBadge />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {db.users.map((u) => (
              <button key={u.id} onClick={() => { setUser(u.id); router.replace(next); }} className="group flex items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/50">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{u.name} <span className="font-normal text-ink-muted">· {ROLE_LABEL[u.role]}</span></div>
                  <div className="truncate text-xs text-ink-muted">{ROLE_DESC[u.role]} · {DEFAULT_ROLE_PERMISSIONS[u.role].length} permissões</div>
                </div>
                <Icons.ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-1.5 text-2xs text-ink-muted"><Icons.ShieldAlert className="mt-px h-3 w-3 shrink-0" />Todos os dados desta DEMO são fictícios e ficam apenas no seu navegador. Não insira dados reais de clientes.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><Login /></Suspense>;
}
