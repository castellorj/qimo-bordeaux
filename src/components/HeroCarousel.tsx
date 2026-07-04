"use client";

// Fotografias reais de Bordeaux (vinhedos, châteaux, rio, cave) — Wikimedia Commons,
// otimizadas e servidas localmente (funcionam offline).
export const BORDEAUX_PHOTOS = {
  placeBourse: "/photos/hero-bordeaux.jpg",
  saintEmilion: "/photos/hero-saint-emilion.jpg",
  dordogneSunset: "/photos/hero-dordogne-sunset.jpg",
  medoc: "/photos/hero-medoc.jpg",
  vignoble: "/photos/hero-vignoble.jpg",
  margaux: "/photos/hero-margaux.jpg",
  lafite: "/photos/hero-lafite.jpg",
  cellar: "/photos/cellar-barrels.jpg",
  glass: "/photos/wine-glass.jpg",
};

// Herói de imagem única — pôr do sol sobre o rio, na região de Bordeaux.
export function HeroCarousel() {
  return (
    <div className="absolute inset-0">
      <div className="photo-placeholder absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BORDEAUX_PHOTOS.placeBourse}
        alt="Place de la Bourse e o Miroir d'Eau, Bordeaux"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Véu vinho — garante a legibilidade do texto sobre o cartão-postal noturno */}
      <div className="absolute inset-0 bg-gradient-to-b from-petrol-950/68 via-petrol-950/45 to-petrol-950/86" />
      <div className="absolute inset-0 bg-petrol-950/12" />
    </div>
  );
}
