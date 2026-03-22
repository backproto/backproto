import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pura — Backproto Products",
  description:
    "Relay capacity, Lightning routing, agent reputation, LLM gateway, and 1-click relay hosting. Powered by Backproto on Base.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
