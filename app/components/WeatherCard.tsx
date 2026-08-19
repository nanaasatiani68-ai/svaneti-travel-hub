"use client";

import { useEffect, useMemo, useState } from "react";

type Language = "ka" | "en";

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

type ForecastDay = {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
};

const MESTIA_LATITUDE = 43.0458;
const MESTIA_LONGITUDE = 42.7297;
const FORECAST_DAYS = 10;

const translations = {
  ka: {
    location: "მესტია • საქართველო",
    city: "მესტია",
    forecastTitle: "10 დღის ამინდის პროგნოზი",
    forecastSubtitle: "მიმდინარე ამინდი და მომდევნო დღეები",
    loading: "მესტიის 10-დღიანი ამინდი იტვირთება...",
    loadingError: "ამინდის პროგნოზის ჩატვირთვა ვერ მოხერხდა.",
    incompleteForecast: "10-დღიანი პროგნოზი ვერ ჩაიტვირთა.",
    feelsLike: "იგრძნობა",
    wind: "ქარი",
    windUnit: "კმ/სთ",
    today: "დღეს",
    source: "წყარო: Open-Meteo • პროგნოზი ავტომატურად ახლდება",
  },

  en: {
    location: "Mestia • Georgia",
    city: "Mestia",
    forecastTitle: "10-Day Weather Forecast",
    forecastSubtitle: "Current weather and upcoming days",
    loading: "Loading the 10-day weather forecast for Mestia...",
    loadingError: "Unable to load the weather forecast.",
    incompleteForecast: "The 10-day forecast could not be loaded.",
    feelsLike: "Feels like",
    wind: "Wind",
    windUnit: "km/h",
    today: "Today",
    source: "Source: Open-Meteo • Forecast updates automatically",
  },
};

export default function WeatherCard() {
  const [language, setLanguage] = useState<Language>("ka");

  const [days, setDays] = useState<ForecastDay[]>([]);

  const [currentTemperature, setCurrentTemperature] = useState<
    number | null
  >(null);

  const [apparentTemperature, setApparentTemperature] = useState<
    number | null
  >(null);

  const [currentWeatherCode, setCurrentWeatherCode] = useState<
    number | null
  >(null);

  const [windSpeed, setWindSpeed] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [errorType, setErrorType] = useState<
    "request" | "incomplete" | null
  >(null);

  const t = translations[language];

  useEffect(() => {
    function syncLanguage() {
      const savedLanguage = localStorage.getItem("site-language");

      const nextLanguage: Language =
        savedLanguage === "en" ? "en" : "ka";

      setLanguage((currentLanguage) =>
        currentLanguage === nextLanguage
          ? currentLanguage
          : nextLanguage
      );
    }

    syncLanguage();

    const intervalId = window.setInterval(syncLanguage, 300);

    window.addEventListener("storage", syncLanguage);
    window.addEventListener("focus", syncLanguage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("focus", syncLanguage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setLoading(true);
      setErrorType(null);

      try {
        const forecastUrl =
          "https://api.open-meteo.com/v1/forecast" +
          `?latitude=${MESTIA_LATITUDE}` +
          `&longitude=${MESTIA_LONGITUDE}` +
          "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m" +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
          `&forecast_days=${FORECAST_DAYS}` +
          "&timezone=Asia%2FTbilisi";

        const response = await fetch(forecastUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("weather_request_failed");
        }

        const data = (await response.json()) as ForecastResponse;

        const dates = data.daily?.time ?? [];
        const codes = data.daily?.weather_code ?? [];

        const maxTemps =
          data.daily?.temperature_2m_max ?? [];

        const minTemps =
          data.daily?.temperature_2m_min ?? [];

        const rain =
          data.daily?.precipitation_probability_max ?? [];

        const preparedDays: ForecastDay[] = dates
          .slice(0, FORECAST_DAYS)
          .map((date, index) => ({
            date,
            weatherCode: codes[index] ?? 0,
            maxTemp: maxTemps[index] ?? 0,
            minTemp: minTemps[index] ?? 0,
            precipitationProbability: rain[index] ?? 0,
          }));

        if (preparedDays.length < 2) {
          throw new Error("weather_forecast_incomplete");
        }

        if (cancelled) {
          return;
        }

        setDays(preparedDays);

        setCurrentTemperature(
          typeof data.current?.temperature_2m === "number"
            ? data.current.temperature_2m
            : null
        );

        setApparentTemperature(
          typeof data.current?.apparent_temperature ===
            "number"
            ? data.current.apparent_temperature
            : null
        );

        setCurrentWeatherCode(
          typeof data.current?.weather_code === "number"
            ? data.current.weather_code
            : null
        );

        setWindSpeed(
          typeof data.current?.wind_speed_10m === "number"
            ? data.current.wind_speed_10m
            : null
        );
      } catch (error) {
        console.error("Weather loading error:", error);

        if (!cancelled) {
          setErrorType(
            error instanceof Error &&
              error.message === "weather_forecast_incomplete"
              ? "incomplete"
              : "request"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentDescription = useMemo(() => {
    if (currentWeatherCode === null) {
      return t.city;
    }

    return weatherDescription(
      currentWeatherCode,
      language
    );
  }, [currentWeatherCode, language, t.city]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex min-h-48 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-cyan-400" />

            <p className="mt-4 font-bold text-white/65">
              {t.loading}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (errorType) {
    return (
      <section className="rounded-3xl border border-amber-400/30 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
          🌤️ {t.location}
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {t.forecastTitle}
        </h2>

        <p className="mt-4 font-semibold text-amber-200">
          {errorType === "incomplete"
            ? t.incompleteForecast
            : t.loadingError}
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-cyan-950/90 to-slate-950/95 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              🌤️ {t.location}
            </p>

            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {t.forecastTitle}
            </h2>

            <p className="mt-2 text-sm text-white/50">
              {t.forecastSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
            <div className="text-5xl">
              {weatherIcon(currentWeatherCode ?? 0)}
            </div>

            <div>
              <p className="text-4xl font-black text-white">
                {currentTemperature !== null
                  ? `${Math.round(currentTemperature)}°`
                  : "—"}
              </p>

              <p className="mt-1 text-sm font-semibold text-cyan-200">
                {currentDescription}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
                {apparentTemperature !== null && (
                  <span>
                    {t.feelsLike}{" "}
                    {Math.round(apparentTemperature)}°
                  </span>
                )}

                {windSpeed !== null && (
                  <span>
                    {t.wind} {Math.round(windSpeed)}{" "}
                    {t.windUnit}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {days.map((day, index) => (
            <article
              key={day.date}
              className={`rounded-2xl border p-4 text-center ${
                index === 0
                  ? "border-cyan-400/40 bg-cyan-500/15"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wide text-white/55">
                {index === 0
                  ? t.today
                  : formatWeekday(day.date, language)}
              </p>

              <p className="mt-1 text-xs text-white/35">
                {formatDate(day.date, language)}
              </p>

              <div className="mt-3 text-4xl">
                {weatherIcon(day.weatherCode)}
              </div>

              <p className="mt-3 min-h-10 text-sm font-bold leading-5 text-white/70">
                {weatherDescription(
                  day.weatherCode,
                  language
                )}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-lg font-black text-white">
                  {Math.round(day.maxTemp)}°
                </span>

                <span className="text-sm font-bold text-white/40">
                  {Math.round(day.minTemp)}°
                </span>
              </div>

              <p className="mt-2 text-xs font-semibold text-sky-300">
                💧{" "}
                {Math.round(day.precipitationProbability)}%
              </p>
            </article>
          ))}
        </div>

        <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-white/35">
          {t.source}
        </p>
      </div>
    </section>
  );
}

function formatWeekday(
  value: string,
  language: Language
) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat(
    language === "ka" ? "ka-GE" : "en-US",
    {
      weekday: "short",
    }
  ).format(date);
}

function formatDate(
  value: string,
  language: Language
) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat(
    language === "ka" ? "ka-GE" : "en-US",
    {
      day: "numeric",
      month: "short",
    }
  ).format(date);
}

function weatherIcon(code: number) {
  if (code === 0) {
    return "☀️";
  }

  if (code === 1 || code === 2) {
    return "🌤️";
  }

  if (code === 3) {
    return "☁️";
  }

  if (code === 45 || code === 48) {
    return "🌫️";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "🌦️";
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    return "🌧️";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(code)
  ) {
    return "🌨️";
  }

  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return "🌤️";
}

function weatherDescription(
  code: number,
  language: Language
) {
  if (code === 0) {
    return language === "ka" ? "მზიანი" : "Sunny";
  }

  if (code === 1) {
    return language === "ka"
      ? "ძირითადად მზიანი"
      : "Mostly sunny";
  }

  if (code === 2) {
    return language === "ka"
      ? "ნაწილობრივ ღრუბლიანი"
      : "Partly cloudy";
  }

  if (code === 3) {
    return language === "ka"
      ? "ღრუბლიანი"
      : "Cloudy";
  }

  if (code === 45 || code === 48) {
    return language === "ka" ? "ნისლი" : "Fog";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return language === "ka"
      ? "ჟინჟღლი"
      : "Drizzle";
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    return language === "ka" ? "წვიმა" : "Rain";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(code)
  ) {
    return language === "ka" ? "თოვლი" : "Snow";
  }

  if ([95, 96, 99].includes(code)) {
    return language === "ka"
      ? "ჭექა-ქუხილი"
      : "Thunderstorm";
  }

  return language === "ka"
    ? "ცვალებადი"
    : "Changeable";
}