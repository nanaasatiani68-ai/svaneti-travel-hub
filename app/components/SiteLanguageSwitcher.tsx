"use client";

import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

export default function SiteLanguageSwitcher() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] rounded-2xl bg-slate-950/95 shadow-2xl backdrop-blur-xl">
      <LanguageSwitcher compact />
    </div>
  );
}