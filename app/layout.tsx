import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Georgia Travel Hub",
    template: "%s | Georgia Travel Hub",
  },
  description:
    "აღმოაჩინე ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გიდები საქართველოში.",
  keywords: [
    "Georgia Travel",
    "Tours in Georgia",
    "Svaneti Tours",
    "Mestia Tours",
    "Hotels in Georgia",
    "Transfers in Georgia",
    "Georgia Travel Hub",
  ],
  authors: [
    {
      name: "Georgia Travel Hub",
    },
  ],
  creator: "Georgia Travel Hub",
  publisher: "Georgia Travel Hub",
  metadataBase: new URL("https://www.georgia-travel-hub.com"),
  openGraph: {
    title: "Georgia Travel Hub",
    description:
      "ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გამოცდილებები საქართველოში.",
    url: "https://www.georgia-travel-hub.com",
    siteName: "Georgia Travel Hub",
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Georgia Travel Hub",
    description:
      "აღმოაჩინე საქართველო — ტურები, სასტუმროები, ტრანსფერები და გიდები.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 font-sans text-white">
        {children}
      </body>
    </html>
  );
}