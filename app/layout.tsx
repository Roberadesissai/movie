// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/components/providers/ClientProvider";
import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
import FloatingAIButton from '@/components/ai/FloatingAIButton';
import { Toaster } from "@/components/ui/toaster";
import { db, auth, storage, timestamp } from '@/firebase/config';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: " Arcaureus Stream - Your Ultimate Entertainment Hub",
  description: "Discover and watch the latest movies and TV shows",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <ClientProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
              {children}
            </div>
            <FloatingAIButton />
            <FooterWrapper />
          </div>
          <Toaster />
        </ClientProvider>
      </body>
    </html>
  );
}