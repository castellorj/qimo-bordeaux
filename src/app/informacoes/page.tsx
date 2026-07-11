import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { InformacoesContent } from "./InformacoesContent";

export const metadata: Metadata = { title: "Informações úteis" };

export default function InformacoesPage() {
  return (
    <>
      <PageHero section="informacoes" small />
      <InformacoesContent />
    </>
  );
}
