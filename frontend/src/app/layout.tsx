import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "TechPrice — Bilgisayar Parcasi Fiyat Karsilastirma",
  description: "Turk teknoloji sitelerinden bilgisayar parcalarinin fiyatlarini karsilastir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <QueryProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <footer className="border-t border-[#27272a] py-6 text-center">
            <p className="text-sm font-semibold tracking-widest text-[#f4f4f5]">
              TECH<span className="text-[#3b82f6]">PRICE</span>
            </p>
            <p className="text-xs text-[#52525b] mt-1">
              Itopya, InceHesap ve Sinerji fiyatlari
            </p>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
