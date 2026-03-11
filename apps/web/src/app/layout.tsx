import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/context/auth-context";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { RouteTransitionOverlay } from "@/components/route-transition-overlay";
import { CookieConsentBanner } from "@/components/cookie-consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Realty Tunax | Antalya & Kepez Gayrimenkul",
    template: "%s | Realty Tunax",
  },
  description:
    "Antalya ve Kepez'in güvenilir gayrimenkul danışmanlık platformu. Satılık daire, kiralık konut ve ticari gayrimenkul ilanları. Kepez, Konyaaltı, Muratpaşa, Alanya.",
  keywords: [
    "Antalya emlak",
    "Kepez emlak",
    "Antalya satılık daire",
    "Antalya kiralık daire",
    "Kepez satılık daire",
    "Antalya gayrimenkul danışmanı",
  ],
  openGraph: {
    siteName: "Realty Tunax",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        {/* Route transition bar — must be inside Suspense because it calls useSearchParams() */}
        <Suspense fallback={null}>
          <RouteTransitionOverlay />
        </Suspense>
        <AuthProvider>
          <Nav />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
          <SiteFooter />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
