"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "ggh_visitor_id";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin-v2")) return;

    let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        path: pathname,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch((error) => console.error("Visitor tracking error:", error));
  }, [pathname]);

  return null;
}