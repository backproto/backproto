import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bit.recipes — Composable pipelines for backpressure economics",
  description:
    "Visual, executable pipeline builder for Backproto. Browse recipes, simulate backpressure routing, deploy to Base.",
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
