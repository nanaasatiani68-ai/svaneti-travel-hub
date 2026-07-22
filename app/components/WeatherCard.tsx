"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
};

function getWeatherInfo(code: number) {
  if (code === 0) return { icon: "☀️", text: "მზიანი" };
  if ([1, 2].includes(code)) return { icon: "🌤️", text: "ნაწილობრივ ღრუბლიანი" };
  if (code === 3) return { icon: "☁️", text: "ღრუბლიანი" };
  if ([45, 48].includes(code)) return { icon: "🌫️", text: "ნისლი" };
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: "🌦️", text: "ჟინჟღლი" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: "🌧️", text: "წვიმა" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: "❄️", text: "თოვლი" };
  }
  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈️", text: "ჭექა-ქუხილი" };
  }

  return { icon: "🌡️", text: "ამინდი" };
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadWeather() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=43.0458&longitude=42.7297&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FTbilisi",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = await response.json();

        setWeather(data.current);
      } catch (error) {
        console.error("Weather loading error:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white shadow-xl backdrop-blur-xl">
        <p className="text-sm text-white/70">ამინდი იტვირთება...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white shadow-xl backdrop-blur-xl">
        <p className="text-sm text-white/70">
          ამინდის ჩატვირთვა ვერ მოხერხდა
        </p>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weather_code);

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-slate-950/45 p-5 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-white/60">
            მიმდინარე ამინდი
          </p>

          <h2 className="mt-1 text-xl font-bold">📍 მესტია</h2>

          <p className="mt-3 text-sm font-semibold text-cyan-200">
            {weatherInfo.text}
          </p>
        </div>

        <div className="text-center">
          <div className="text-5xl">{weatherInfo.icon}</div>

          <p className="mt-2 text-3xl font-extrabold">
            {Math.round(weather.temperature_2m)}°
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs text-white/50">იგრძნობა</p>

          <p className="mt-1 font-bold">
            {Math.round(weather.apparent_temperature)}°C
          </p>
        </div>

        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs text-white/50">ქარი</p>

          <p className="mt-1 font-bold">
            {Math.round(weather.wind_speed_10m)} კმ/სთ
          </p>
        </div>
      </div>
    </div>
  );
}