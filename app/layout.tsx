import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import VisitorTracker from "@/app/components/VisitorTracker";
import PWARegister from "@/app/components/PWARegister";
import InstallAppPrompt from "@/app/components/InstallAppPrompt";
import SiteLanguageSwitcher from "@/app/components/SiteLanguageSwitcher";
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
    default: "Georgia Gateway Hub",
    template: "%s | Georgia Gateway Hub",
  },

  description:
    "აღმოაჩინე ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გიდები საქართველოში.",

  keywords: [
    "Georgia Gateway Hub",
    "Georgia Travel",
    "Tours in Georgia",
    "Svaneti Tours",
    "Mestia Tours",
    "Hotels in Georgia",
    "Transfers in Georgia",
    "Georgia Guides",
    "Travel Georgia",
  ],

  authors: [{ name: "Georgia Gateway Hub" }],
  creator: "Georgia Gateway Hub",
  publisher: "Georgia Gateway Hub",

  metadataBase: new URL("https://georgiagatewayhub.com"),

  alternates: {
    canonical: "/",
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Georgia Gateway Hub",
  },

  openGraph: {
    title: "Georgia Gateway Hub",
    description:
      "ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გამოცდილებები საქართველოში.",
    url: "https://georgiagatewayhub.com",
    siteName: "Georgia Gateway Hub",
    locale: "ka_GE",
    type: "website",
    images: [
      {
        url: "/georgia-gateway-logo.png",
        width: 1200,
        height: 1200,
        alt: "Georgia Gateway Hub",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Georgia Gateway Hub",
    description:
      "აღმოაჩინე საქართველო — ტურები, სასტუმროები, ტრანსფერები და გიდები.",
    images: ["/georgia-gateway-logo.png"],
  },

  icons: {
    icon: [
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#07111d",
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
        <PWARegister />
        <VisitorTracker />
        {children}
        <SiteLanguageSwitcher />
        <InstallAppPrompt />
      </body>
    </html>
  );
}