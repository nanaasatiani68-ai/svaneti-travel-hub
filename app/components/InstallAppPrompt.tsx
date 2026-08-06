"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type HelpMode = "ios" | "android" | "desktop" | null;

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [helpMode, setHelpMode] = useState<HelpMode>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const userAgent = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.navigator.userAgent.toLowerCase();
  }, []);

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
      setHelpMode(null);
      setInstalling(false);
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

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  async function installApp() {
    if (installing) {
      return;
    }

    if (installEvent) {
      setInstalling(true);

      try {
        await installEvent.prompt();

        const choice = await installEvent.userChoice;

        if (choice.outcome === "accepted") {
          setHelpMode(null);
        }

        setInstallEvent(null);
      } catch (error) {
        console.error("App installation error:", error);
        openPlatformHelp();
      } finally {
        setInstalling(false);
      }

      return;
    }

    openPlatformHelp();
  }

  function openPlatformHelp() {
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);

    if (isIOS) {
      setHelpMode("ios");
      return;
    }

    if (isAndroid) {
      setHelpMode("android");
      return;
    }

    setHelpMode("desktop");
  }

  function closeHelp() {
    setHelpMode(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void installApp()}
        disabled={installing}
        className="fixed bottom-5 right-5 z-[9998] inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        aria-label="Georgia Gateway Hub-ის დაყენება"
      >
        <span className="text-lg">📲</span>
        <span>
          {installing ? "ინსტალაცია..." : "Install App"}
        </span>
      </button>

      {helpMode && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-help-title"
          onClick={closeHelp}
        >
          <section
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeHelp}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20"
              aria-label="დახურვა"
            >
              ✕
            </button>

            <div className="pr-12">
              <div className="text-5xl">📲</div>

              <h2
                id="install-help-title"
                className="mt-4 text-2xl font-black"
              >
                Georgia Gateway Hub-ის დაყენება
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/60">
                ბრაუზერმა ავტომატური ინსტალაციის ფანჯარა ამ
                მომენტში არ გახსნა. გამოიყენე ქვემოთ მოცემული
                ნაბიჯები.
              </p>
            </div>

            {helpMode === "ios" && (
              <div className="mt-6 space-y-3">
                <InstructionStep
                  number="1"
                  text="საიტი გახსენი Safari ბრაუზერში."
                />

                <InstructionStep
                  number="2"
                  text="ქვედა პანელში დააჭირე გაზიარების ღილაკს — Share."
                />

                <InstructionStep
                  number="3"
                  text="აირჩიე „მთავარ ეკრანზე დამატება“ — Add to Home Screen."
                />

                <InstructionStep
                  number="4"
                  text="დააჭირე „დამატებას“."
                />
              </div>
            )}

            {helpMode === "android" && (
              <div className="mt-6 space-y-3">
                <InstructionStep
                  number="1"
                  text="საიტი გახსენი Google Chrome-ში."
                />

                <InstructionStep
                  number="2"
                  text="ზედა მარჯვენა კუთხეში დააჭირე სამ წერტილს."
                />

                <InstructionStep
                  number="3"
                  text="მოძებნე „აპის ინსტალაცია“, „დაინსტალირება“ ან „მთავარ ეკრანზე დამატება“."
                />

                <InstructionStep
                  number="4"
                  text="თუ ეს არჩევანი არ ჩანს, განაახლე გვერდი და რამდენიმე წამში ისევ დააჭირე Install App-ს."
                />
              </div>
            )}

            {helpMode === "desktop" && (
              <div className="mt-6 space-y-3">
                <InstructionStep
                  number="1"
                  text="საიტი გახსენი Google Chrome ან Microsoft Edge ბრაუზერში."
                />

                <InstructionStep
                  number="2"
                  text="მისამართის ზოლის მარჯვენა მხარეს მოძებნე ინსტალაციის ხატულა."
                />

                <InstructionStep
                  number="3"
                  text="ან გახსენი ბრაუზერის მენიუ და აირჩიე „Install Georgia Gateway Hub“."
                />
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              ℹ️ ინსტალაციის არჩევანი გამოჩნდება მხოლოდ მაშინ,
              როცა საიტის PWA ფაილები და ბრაუზერის მოთხოვნები
              სრულად არის დაკმაყოფილებული.
            </div>

            <button
              type="button"
              onClick={closeHelp}
              className="mt-6 w-full rounded-2xl bg-cyan-500 px-5 py-3 font-black text-white transition hover:bg-cyan-600"
            >
              გასაგებია
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function InstructionStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 font-black text-white">
        {number}
      </div>

      <p className="pt-1 text-sm leading-6 text-white/80">
        {text}
      </p>
    </div>
  );
}