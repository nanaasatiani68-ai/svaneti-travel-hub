"use client";

import { useEffect, useMemo, useState } from "react";

type GeocodingResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country?: string;
    timezone?: string;
  }>;
};

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

const LOCATION_NAME = "Mestia";
const FORECAST_DAYS = 10;

export default function WeatherCard() {
  const [days, setDays] = useState<ForecastDay[]>([]);
  const [currentTemperature, setCurrentTemperature] =
    useState<number | null>(null);
  const [apparentTemperature, setApparentTemperature] =
    useState<number | null>(null);
  const [currentWeatherCode, setCurrentWeatherCode] =
    useState<number | null>(null);
  const [windSpeed, setWindSpeed] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setLoading(true);
      setErrorMessage("");

      try {
        const geocodingUrl =
          "https://geocoding-api.open-meteo.com/v1/search" +
          `?name=${encodeURIComponent(LOCATION_NAME)}` +
          "&count=1" +
          "&language=en" +
          "&format=json";

        const geocodingResponse = await fetch(
          geocodingUrl,
          {
            cache: "no-store",
          }
        );

        if (!geocodingResponse.ok) {
          throw new Error(
            "მესტიის მდებარეობა ვერ მოიძებნა."
          );
        }

        const geocodingData =
          (await geocodingResponse.json()) as GeocodingResponse;

        const location =
          geocodingData.results?.[0];

        if (!location) {
          throw new Error(
            "მესტიის მდებარეობა ვერ მოიძებნა."
          );
        }

        const forecastUrl =
          "https://api.open-meteo.com/v1/forecast" +
          `?latitude=${location.latitude}` +
          `&longitude=${location.longitude}` +
          "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m" +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
          `&forecast_days=${FORECAST_DAYS}` +
          "&timezone=auto";

        const forecastResponse = await fetch(
          forecastUrl,
          {
            cache: "no-store",
          }
        );

        if (!forecastResponse.ok) {
          throw new Error(
            "ამინდის პროგნოზის მიღება ვერ მოხერხდა."
          );
        }

        const forecastData =
          (await forecastResponse.json()) as ForecastResponse;

        const dates =
          forecastData.daily?.time ?? [];
        const weatherCodes =
          forecastData.daily?.weather_code ?? [];
        const maxTemperatures =
          forecastData.daily?.temperature_2m_max ?? [];
        const minTemperatures =
          forecastData.daily?.temperature_2m_min ?? [];
        const precipitationProbabilities =
          forecastData.daily
            ?.precipitation_probability_max ?? [];

        const preparedDays = dates
          .slice(0, FORECAST_DAYS)
          .map((date, index) => ({
            date,
            weatherCode:
              weatherCodes[index] ?? 0,
            maxTemp:
              maxTemperatures[index] ?? 0,
            minTemp:
              minTemperatures[index] ?? 0,
            precipitationProbability:
              precipitationProbabilities[index] ?? 0,
          }));

        if (preparedDays.length === 0) {
          throw new Error(
            "10-დღიანი პროგნოზი ვერ მოიძებნა."
          );
        }

        if (cancelled) {
          return;
        }

        setDays(preparedDays);
        setCurrentTemperature(
          typeof forecastData.current
            ?.temperature_2m === "number"
            ? forecastData.current.temperature_2m
            : null
        );
        setApparentTemperature(
          typeof forecastData.current
            ?.apparent_temperature === "number"
            ? forecastData.current.apparent_temperature
            : null
        );
        setCurrentWeatherCode(
          typeof forecastData.current
            ?.weather_code === "number"
            ? forecastData.current.weather_code
            : null
        );
        setWindSpeed(
          typeof forecastData.current
            ?.wind_speed_10m === "number"
            ? forecastData.current.wind_speed_10m
            : null
        );
      } catch (error) {
        console.error(
          "Weather loading error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "ამინდის პროგნოზის ჩატვირთვა ვერ მოხერხდა."
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

  const todayLabel = useMemo(() => {
    if (currentWeatherCode === null) {
      return "მესტია";
    }

    return weatherDescription(
      currentWeatherCode
    );
  }, [currentWeatherCode]);

  if (loading) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex min-h-44 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-cyan-400" />

            <p className="mt-4 font-bold text-white/65">
              მესტიის 10-დღიანი ამინდი იტვირთება...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          🌤️ Mestia Weather
        </p>

        <p className="mt-3 font-semibold text-amber-200">
          {errorMessage}
        </p>

        <p className="mt-2 text-sm text-white/45">
          გვერდის განახლებისას პროგნოზი თავიდან ჩაიტვირთება.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-cyan-950/85 to-slate-950/90 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              🌤️ Mestia • Georgia
            </p>

            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              10 დღის ამინდის პროგნოზი
            </h2>

            <p className="mt-2 text-sm text-white/50">
              10-Day Weather Forecast
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
            <div className="text-5xl">
              {weatherIcon(
                currentWeatherCode ?? 0
              )}
            </div>

            <div>
              <p className="text-4xl font-black text-white">
                {currentTemperature !== null
                  ? `${Math.round(
                      currentTemperature
                    )}°`
                  : "—"}
              </p>

              <p className="mt-1 text-sm font-semibold text-cyan-200">
                {todayLabel}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
                {apparentTemperature !== null && (
                  <span>
                    იგრძნობა{" "}
                    {Math.round(
                      apparentTemperature
                    )}
                    °
                  </span>
                )}

                {windSpeed !== null && (
                  <span>
                    ქარი{" "}
                    {Math.round(windSpeed)} km/h
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {days.map((day, index) => (
            <article
              key={day.date}
              className={`min-w-[132px] flex-1 rounded-2xl border p-4 text-center ${
                index === 0
                  ? "border-cyan-400/40 bg-cyan-500/15"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wide text-white/50">
                {index === 0
                  ? "დღეს"
                  : formatWeekday(day.date)}
              </p>

              <p className="mt-1 text-xs text-white/35">
                {formatDate(day.date)}
              </p>

              <div className="mt-3 text-4xl">
                {weatherIcon(
                  day.weatherCode
                )}
              </div>

              <p className="mt-3 text-sm font-bold text-white/70">
                {weatherDescription(
                  day.weatherCode
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
                {Math.round(
                  day.precipitationProbability
                )}
                %
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            მობილურზე გადაასრიალე მარჯვნივ →
          </p>

          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Weather data: Open-Meteo
          </a>
        </div>
      </div>
    </section>
  );
}

function formatWeekday(value: string) {
  const date = new Date(
    `${value}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "ka-GE",
    {
      weekday: "short",
    }
  ).format(date);
}

function formatDate(value: string) {
  const date = new Date(
    `${value}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "ka-GE",
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

  if (
    [51, 53, 55, 56, 57].includes(code)
  ) {
    return "🌦️";
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82].includes(
      code
    )
  ) {
    return "🌧️";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(
      code
    )
  ) {
    return "🌨️";
  }

  if (
    [95, 96, 99].includes(code)
  ) {
    return "⛈️";
  }

  return "🌤️";
}

function weatherDescription(code: number) {
  if (code === 0) {
    return "მზიანი";
  }

  if (code === 1) {
    return "ძირითადად მზიანი";
  }

  if (code === 2) {
    return "ნაწილობრივ ღრუბლიანი";
  }

  if (code === 3) {
    return "ღრუბლიანი";
  }

  if (code === 45 || code === 48) {
    return "ნისლი";
  }

  if (
    [51, 53, 55, 56, 57].includes(code)
  ) {
    return "ჟინჟღლი";
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82].includes(
      code
    )
  ) {
    return "წვიმა";
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(
      code
    )
  ) {
    return "თოვლი";
  }

  if (
    [95, 96, 99].includes(code)
  ) {
    return "ჭექა-ქუხილი";
  }

  return "ცვალებადი ამინდი";
}