import type { Metadata, Viewport } from "next";
import { BRAND } from "@/lib/brand";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: `${BRAND.name} – ${BRAND.tagline}`,
  description: "Entdecke Wissen in Sekunden: kurze Fakten, schnelle Quizfragen, Challenges mit Freunden.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#11100e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${geist.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
