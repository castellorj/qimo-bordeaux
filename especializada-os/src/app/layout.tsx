import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/data/store";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Especializada Seguros OS · DEMO",
  description: "Insurance Operating System da Especializada Seguros — versão DEMO com dados fictícios.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body className="font-sans">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
