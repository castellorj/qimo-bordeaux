import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/data/store";
import { AppShell } from "@/components/shell/AppShell";

// Fonte baixada no build e servida pelo próprio domínio (sem chamada ao Google em tempo de uso)
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Especializada Seguros OS · DEMO",
  description: "Insurance Operating System da Especializada Seguros — versão DEMO com dados fictícios.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
