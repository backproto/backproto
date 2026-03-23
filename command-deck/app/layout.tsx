import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Deck — Pura Briefing Dashboard",
  description:
    "CEO-level briefing cards, concept explainers, and live metrics for the Pura protocol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
