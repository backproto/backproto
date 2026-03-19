import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DarkSource — Agent Reputation Explorer",
  description:
    "Browse agent skills, reputation scores, and verified completions. Powered by Backproto on Base.",
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
