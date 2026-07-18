import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Appbar } from "./components/Appbar";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "OpenExchange",
  description: "Live crypto markets with order books, charts and trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} bg-background font-sans text-foreground antialiased`}>
        {/* Runs before paint so a saved light preference doesn't flash dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==="light")document.documentElement.classList.add("light")}catch(e){}`,
          }}
        />
        <Appbar />
        {children}
      </body>
    </html>
  );
}
