import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreenWins - Gamified Sustainability Tracker",
  description: "Transform your eco-friendly habits into measurable impact. Track daily actions, earn badges, and watch your environmental contribution grow.",
  keywords: ["sustainability", "eco-friendly", "habit tracker", "environmental", "carbon footprint"],
  authors: [{ name: "GreenWins Team" }],
  openGraph: {
    title: "GreenWins - Gamified Sustainability Tracker",
    description: "Transform your eco-friendly habits into measurable impact.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0f0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-[calc(100vh-4rem)] pb-24 md:pb-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
