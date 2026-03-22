import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Nav } from "@/components/nav";
import { TitleBar } from "@/components/title-bar";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
      <body className="h-screen overflow-hidden antialiased">
        <TitleBar />
        <Nav />
        <div data-scroll-root className="h-screen overflow-auto" style={{ scrollbarWidth: "none" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
