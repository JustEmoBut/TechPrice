import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "TechPrice | Donanım Fiyat Radarı",
  description:
    "İtopya, İnceHesap ve Sinerji fiyatlarını tek bir editoryal arayüzde karşılaştır.",
};

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-edge/60 bg-surface-0/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-full max-w-[1280px] items-center px-4 md:px-8" />
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-orbit" />
            <div className="absolute inset-0 bg-grain opacity-35" />
          </div>

          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>

          <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
            {children}
          </main>

          <footer className="border-t border-edge/70 bg-black/20 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-soft">
                  TechPrice Radarı
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Haftalık tarama, canlı fiyat karşılaştırma, trend odaklı keşif.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-ink-muted md:text-sm">
                <div>
                  <p className="font-medium text-ink-soft">Kaynak</p>
                  <p className="mt-1">İtopya</p>
                  <p>İnceHesap</p>
                  <p>Sinerji</p>
                </div>
                <div>
                  <p className="font-medium text-ink-soft">Odak</p>
                  <p className="mt-1">CPU</p>
                  <p>GPU</p>
                  <p>SSD</p>
                </div>
                <div>
                  <p className="font-medium text-ink-soft">Yayın</p>
                  <p className="mt-1 font-mono">API :8300</p>
                  <p className="font-mono">WEB :3000</p>
                </div>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
