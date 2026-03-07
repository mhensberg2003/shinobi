import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${syne.variable} antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
