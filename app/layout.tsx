import type { Metadata } from "next";
import { Bungee, Nunito } from "next/font/google";
import "./globals.css";

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bungee"
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito"
});

export const metadata: Metadata = {
  title: "Fat Bear Week 2026 Championship",
  description: "Nine-player Fat Bear Week 2026 prediction championship.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" }
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bungee.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
