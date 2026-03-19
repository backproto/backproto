import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backproto Gateway",
  description:
    "Capacity-routed LLM gateway powered by Backproto on Base.",
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
