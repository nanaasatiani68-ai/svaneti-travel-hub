"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & {
        standalone?: boolean;
      }).standalone === true;

    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setShowIOSHelp(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  async function installApp() {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
      return;
    }

    const isIOS =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    if (isIOS) {
      setShowIOSHelp(true);
    } else {
      alert(
        "Chrome-ის მენიუში გახსენით Install app ან Add to Home screen."
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void installApp()}
        className="fixed bottom-5 right-5 z-[9998] rounded-2xl border border-cyan-300/30 bg-cyan-500 px-5 py-3 font-black text-white shadow-2xl transition hover:bg-cyan-600"
      >
        📲 Install App
      </button>

      {showIOSHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <h2 className="text-2xl font-black">
              Georgia Gateway Hub-ის დაყენება
            </h2>

            <p className="mt-4 leading-7 text-white/70">
              iPhone-ზე Safari-ში დააჭირეთ გაზიარების ღილაკს
              <strong className="text-white"> Share</strong>, შემდეგ
              აირჩიეთ
              <strong className="text-white">
                {" "}
                Add to Home Screen
              </strong>
              .
            </p>

            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-6 w-full rounded-2xl bg-cyan-500 px-5 py-3 font-black hover:bg-cyan-600"
            >
              გასაგებია
            </button>
          </div>
        </div>
      )}
    </>
  );
}