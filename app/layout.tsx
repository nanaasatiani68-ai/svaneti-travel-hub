import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./providers/LanguageProvider";
import SiteLanguageSwitcher from "./components/SiteLanguageSwitcher";
import VisitorTracker from "./components/VisitorTracker";

export const metadata: Metadata = {
  title: "Georgia Gateway Hub",
  description:
    "Tours, transfers, hotels and local guides across Georgia.",
};

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
