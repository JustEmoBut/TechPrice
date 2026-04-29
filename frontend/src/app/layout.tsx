import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "TechPrice | Donanım Fiyat Kontrol Merkezi",
  description:
    "İtopya, İnceHesap ve Sinerji fiyatlarını canlı bir donanım kontrol merkezinde karşılaştır.",
};

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-surface-0/88 backdrop-blur-xl">
      <div className="mx-auto h-[82px] w-full max-w-[1400px] px-4 md:px-8" />
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="absolute inset-0 bg-noise opacity-45" />
          </div>

          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>

          <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>

          <footer className="border-t border-edge/70 bg-surface-0/78 backdrop-blur-xl">
            <div className="mx-auto grid w-full max-w-[1400px] gap-5 px-4 py-7 md:grid-cols-[1.2fr_1fr] md:px-8">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.34em] text-ink-soft">
                  TechPrice Kontrol Merkezi
                </p>
                <p className="mt-2 max-w-xl text-sm text-ink-muted">
                  Haftalık tarama verisi, mağaza makası ve ürün geçmişi tek yüzeyde okunur.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs text-ink-muted">
                <div className="control-surface rounded-lg p-3">
                  <p className="font-medium text-ink-soft">Kaynak</p>
                  <p className="mt-1">3 mağaza</p>
                </div>
                <div className="control-surface rounded-lg p-3">
                  <p className="font-medium text-ink-soft">Odak</p>
                  <p className="mt-1">7 segment</p>
                </div>
                <div className="control-surface rounded-lg p-3">
                  <p className="font-medium text-ink-soft">API</p>
                  <p className="mt-1 font-mono">:8300</p>
                </div>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
