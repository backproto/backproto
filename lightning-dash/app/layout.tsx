import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lightning.Gold — Lightning Routing Dashboard",
  description:
    "Capacity-weighted Lightning routing with on-chain signals. Powered by Backproto on Base.",
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
