import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import { resolveMetadataBase, siteMetadata } from "@/lib/metadata/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const metadataBase = resolveMetadataBase();
const brandMarkPath = "/brand/poker-ai-arena-mark.png";

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title: {
    default: siteMetadata.defaultTitle,
    template: `%s · ${siteMetadata.name}`,
  },
  description: siteMetadata.defaultDescription,
  applicationName: siteMetadata.name,
  keywords: [...siteMetadata.keywords],
  authors: [{ name: siteMetadata.name }],
  creator: siteMetadata.name,
  icons: {
    icon: brandMarkPath,
    apple: brandMarkPath,
  },
  openGraph: {
    title: siteMetadata.defaultTitle,
    description: siteMetadata.defaultDescription,
    type: "website",
    siteName: siteMetadata.name,
    locale: "en_US",
    images: [
      {
        url: brandMarkPath,
        alt: siteMetadata.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteMetadata.defaultTitle,
    description: siteMetadata.defaultDescription,
    images: [brandMarkPath],
  },
  robots: {
    index: true,
    follow: true,
  },
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
