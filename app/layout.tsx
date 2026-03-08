import type { Metadata } from "next";
import { Manrope, Syne, Geist } from "next/font/google";
import { Nav } from "@/components/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shinobi",
  description: "Personal streaming app for anime, TV shows, and movies.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${manrope.variable} ${syne.variable} h-screen overflow-hidden antialiased`}>
        <Nav />
        <ScrollArea className="h-screen">
          {children}
        </ScrollArea>
      </body>
    </html>
  );
}
