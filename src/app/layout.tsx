import "./globals.css";
import type { ReactNode } from "react";
import { Inter, Roboto, Black_Ops_One } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const blackOps = Black_Ops_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-blackops",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto.variable} ${blackOps.variable}`}
    >
      <body className="min-h-screen bg-[#050816] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}