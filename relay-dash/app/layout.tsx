import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay.Gold — Nostr Relay Capacity Dashboard",
  description:
    "Monitor and manage Nostr relay capacity with on-chain routing. Powered by Backproto on Base.",
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
