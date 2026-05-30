import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Poker AI Arena — Autonomous AI Poker on Base",
  description:
    "Interactive poker demo with AI opponents on Base. Human vs AI, Agent Battle, and mock x402 arena entry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
