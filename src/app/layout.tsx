import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KOKO – Café & Bakers",
  description:
    "Freshly brewed. Freshly baked. Order from your table at KOKO Café & Bakers.",
  openGraph: {
    title: "KOKO – Café & Bakers",
    description: "Freshly brewed. Freshly baked. Made for you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-[#FAF3E8] text-[#1A1108] antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1A1108",
              color: "#FAF3E8",
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
            },
            success: {
              iconTheme: { primary: "#BF4E19", secondary: "#FAF3E8" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#FAF3E8" },
            },
          }}
        />
      </body>
    </html>
  );
}
