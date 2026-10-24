import type { Metadata } from "next";
import "./globals.css";

import { LanguageProvider } from "./providers/LanguageProvider";
import SiteLanguageSwitcher from "./components/SiteLanguageSwitcher";
import VisitorTracker from "./components/VisitorTracker";
import { getPublicSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();

  let metadataBase: URL;

  try {
    metadataBase = new URL(
      settings.site_url || "https://georgiagatewayhub.com"
    );
  } catch {
    metadataBase = new URL(
      "https://georgiagatewayhub.com"
    );
  }

  const title =
    settings.seo_title ||
    settings.site_name ||
    "Georgia Gateway Hub";

  const description =
    settings.seo_description ||
    "Tours, transfers, hotels and local guides across Georgia.";

  return {
    metadataBase,

    title: {
      default: title,
      template: `%s | ${settings.site_name}`,
    },

    description,

    openGraph: {
      type: "website",
      siteName: settings.site_name,
      title,
      description,
      url: metadataBase,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body>
        <LanguageProvider>
          <VisitorTracker />
          {children}
          <SiteLanguageSwitcher />
        </LanguageProvider>
      </body>
    </html>
  );
}