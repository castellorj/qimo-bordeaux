import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/SiteChrome";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { GoogleTranslate } from "@/components/GoogleTranslate";
import { GuideContentProvider } from "@/components/GuideContent";
import { SiteFooter } from "@/components/SiteFooter";
import { buildSearchIndex } from "@/content";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bordeaux.qimobr.com"),
  title: {
    default: "QIMO · Bordeaux Experience",
    template: "%s · QIMO Bordeaux",
  },
  description:
    "O concierge digital de luxo da QIMO para o cruzeiro Bordeaux Experience — programação, vinícolas, vinhos, gastronomia e experiências exclusivas.",
  applicationName: "QIMO Bordeaux",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QIMO Bordeaux",
  },
  openGraph: {
    title: "QIMO · Bordeaux Experience",
    description: "Concierge digital de luxo para o cruzeiro QIMO em Bordeaux.",
    url: "https://bordeaux.qimobr.com",
    siteName: "QIMO Bordeaux Experience",
    images: [
      {
        url: "/og-bordeaux.jpg",
        width: 1200,
        height: 630,
        alt: "Bordeaux Experience by QIMO",
      },
    ],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "QIMO · Bordeaux Experience",
    description: "Concierge digital de luxo para o cruzeiro QIMO em Bordeaux.",
    images: ["/og-bordeaux.jpg"],
  },
  icons: {
    icon: "/qimo-badge-192.png",
    apple: "/qimo-badge-512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = buildSearchIndex();
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <ServiceWorkerRegister />
          <GoogleTranslate />
          <SiteChrome searchIndex={searchIndex} />
          <GuideContentProvider>
            <main className="min-h-screen pb-24 md:pb-0">{children}</main>
          </GuideContentProvider>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
