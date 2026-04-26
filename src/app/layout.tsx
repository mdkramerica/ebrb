import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Nilon Folio — Executive Repositioning Practice",
  description:
    "Every executive has a folio. Nilon writes yours. Built by a recruiter with thirty years placing Director through C-Suite executives. Decision-ready in minutes.",
  openGraph: {
    title: "Nilon Folio — Repositioning, not a template.",
    description:
      "The executive repositioning practice — built by a recruiter, not a template company.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
