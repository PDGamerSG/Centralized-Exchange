import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Appbar } from "./components/Appbar";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Exchange",
  description: "Live crypto markets with order books, charts and trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} bg-background font-sans text-foreground antialiased`}>
        <Appbar />
        {children}
      </body>
    </html>
  );
}
