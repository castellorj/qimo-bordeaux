import Link from "next/link";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="container-editorial flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full border" style={{ borderColor: "var(--line)" }}>
        <Icon name="Compass" size={28} className="text-gold" />
      </span>
      <h1 className="display mt-6 text-3xl">Você está offline</h1>
      <p className="prose-luxe mx-auto mt-3 max-w-sm">
        Esta página ainda não foi salva no seu dispositivo. As páginas que você já visitou continuam
        disponíveis mesmo sem conexão.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Voltar ao início <Icon name="ArrowRight" size={15} />
      </Link>
    </div>
  );
}
