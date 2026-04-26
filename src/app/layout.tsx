import type { Metadata } from "next";
import { Figtree, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({
  subsets:['latin'],
  variable:'--font-figtree',
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Labelog",
  description: "A web application for sharing food recommendations, exclusively for lab members.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={cn("h-full", "antialiased", "font-sans", figtree.variable, notoSansJP.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
