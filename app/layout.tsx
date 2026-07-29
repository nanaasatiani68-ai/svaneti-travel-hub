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

  authors: [
    {
      name: "Georgia Gateway Hub",
    },
  ],

  creator: "Georgia Gateway Hub",
  publisher: "Georgia Gateway Hub",

  metadataBase: new URL("https://georgiagatewayhub.com"),

  alternates: {
    canonical: "/",
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
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
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
}import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import VisitorTracker from "@/app/components/VisitorTracker";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Georgia Gateway Hub", template: "%s | Georgia Gateway Hub" },
  description: "აღმოაჩინე ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გიდები საქართველოში.",
  keywords: ["Georgia Gateway Hub","Georgia Travel","Tours in Georgia","Svaneti Tours","Mestia Tours","Hotels in Georgia","Transfers in Georgia","Georgia Guides","Travel Georgia"],
  authors: [{ name: "Georgia Gateway Hub" }],
  creator: "Georgia Gateway Hub",
  publisher: "Georgia Gateway Hub",
  metadataBase: new URL("https://georgiagatewayhub.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Georgia Gateway Hub",
    description: "ტურები, სასტუმროები, ტრანსფერები და ადგილობრივი გამოცდილებები საქართველოში.",
    url: "https://georgiagatewayhub.com",
    siteName: "Georgia Gateway Hub",
    locale: "ka_GE",
    type: "website",
    images: [{ url: "/georgia-gateway-logo.png", width: 1200, height: 1200, alt: "Georgia Gateway Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Georgia Gateway Hub",
    description: "აღმოაჩინე საქართველო — ტურები, სასტუმროები, ტრანსფერები და გიდები.",
    images: ["/georgia-gateway-logo.png"],
  },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 font-sans text-white">
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}