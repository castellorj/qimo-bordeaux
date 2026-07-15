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

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const SB_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

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

type ShareSetting = { key: string; pt?: string | null };

async function getShareSettings() {
  try {
    const params = "select=key,pt&key=in.(share.title,share.description)";
    const res = await fetch(`${SB_URL}/rest/v1/bordeaux_settings?${params}`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
      cache: "no-store",
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as ShareSetting[];
    return Object.fromEntries(rows.map((row) => [row.key, row.pt?.trim() || ""]));
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const share = await getShareSettings();
  const title = share["share.title"] || "QIMO \u00b7 Bordeaux Experience";
  const description = share["share.description"] || "Concierge digital de luxo para o cruzeiro QIMO em Bordeaux.";

  return {
    metadataBase: new URL("https://bordeaux.qimobr.com"),
    title: {
      default: title,
      template: "%s \u00b7 QIMO Bordeaux",
    },
    description,
    applicationName: "QIMO Bordeaux",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "QIMO Bordeaux",
    },
    openGraph: {
      title,
      description,
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
      title,
      description,
      images: ["/og-bordeaux.jpg"],
    },
    icons: {
      icon: "/qimo-badge-192.png",
      apple: "/qimo-badge-512.png",
    },
  };
}

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
