import type { Metadata } from "next";
import { TripHero } from "@/components/TripHero";
import { ProgramacaoDays } from "./ProgramacaoDays";

export const metadata: Metadata = { title: "Programação" };

export default function ProgramacaoPage() {
  return (
    <>
      <TripHero imageKey="img.hero.viagem" defaultImage="/photos/hero-bordeaux.jpg" title="Sua viagem" />
      <ProgramacaoDays />
    </>
  );
}
