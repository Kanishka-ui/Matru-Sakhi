import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatruSakhi — AI Maternal Health Companion",
  description:
    "MatruSakhi is an AI-powered maternal health companion for expectant and new mothers. Track pregnancy, get personalized health insights, and connect with healthcare providers.",
  keywords: ["maternal health", "pregnancy tracking", "AI health", "MatruSakhi", "prenatal care"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
