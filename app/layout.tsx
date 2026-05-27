import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { auth } from "@/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WatUSee | See the Unseen",
  description: "A social network for Pareidolia creators. Discover and share the hidden shapes in the world.",
  icons: {
    icon: [{ url: '/favicon.png', sizes: '32x32', type: 'image/png' }],
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${inter.variable} dark antialiased h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-brand-primary/30 selection:text-white">
        <Providers session={session}>
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
