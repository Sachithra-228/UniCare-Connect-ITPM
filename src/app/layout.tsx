import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { TopNav } from "@/components/shared/TopNav";
import { Footer } from "@/components/shared/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "UniCare Connect",
  description: "Holistic support system for Sri Lankan university students"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <TopNav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
