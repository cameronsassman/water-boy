"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { HomeData } from "@/lib/home-data";

const HomeDataContext = createContext<HomeData | null>(null);

export function useHomeData(): HomeData {
  const value = useContext(HomeDataContext);
  if (!value) throw new Error("useHomeData must be used inside <HomeDataProvider>");
  return value;
}

// Time zone the match times (matches.match_time) are entered in.
const VENUE_TZ = "Africa/Johannesburg";

const LIVE_MS = 10_000;        // a match is in progress
const NEAR_START_MS = 15_000;  // a match is due to start (or is running late)
const WAKE_BEFORE_MIN = 2;     // start watching this long before the scheduled start
const OVERDUE_MIN = 30;        // keep watching this long after the scheduled start
const IDLE_MS = 5 * 60_000;    // slow fallback check while nothing is live (catches score/scorer corrections)
const JITTER_MS = 3_000;       // spreads 1,000 tabs out so they don't all fire together
const IDLE_JITTER_MS = 30_000; // wider spread for the slow checks

function minutesUntil(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VENUE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const nowMin = get("hour") * 60 + get("minute") + get("second") / 60;
  return Number(m[1]) * 60 + Number(m[2]) - nowMin;
}

// How long until the next background fetch.
function nextDelayMs(data: HomeData): number {
  // A match is in progress: keep scores fresh.
  if (data.live.length > 0) return LIVE_MS;

  // Nothing live: wake up shortly before the next match is due to start.
  const next = data.upcoming[0];
  if (next && next.day === data.currentDay && next.start_time) {
    const mins = minutesUntil(next.start_time);
    if (mins !== null) {
      if (mins > WAKE_BEFORE_MIN) return Math.min((mins - WAKE_BEFORE_MIN) * 60_000, IDLE_MS);
      if (mins >= -OVERDUE_MIN) return NEAR_START_MS;
    }
  }

  // Otherwise just a slow check every few minutes.
  return IDLE_MS;
}

// First paint comes from the server-rendered page (`initial`). After that it
// polls the CDN-cached /api/home every ~10-15s while a match is live or about
// to start, and only every ~5 minutes the rest of the time.
export default function HomeDataProvider({
  initial,
  children,
}: {
  initial: HomeData;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial);
  const [tick, setTick] = useState(0); // bumps after every attempt so the next one gets scheduled

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch("/api/home", { signal: controller.signal });
        if (res.ok && !stopped) setData(await res.json());
      } catch {
        // Network blip or abort: keep the last good data and try again next round.
      }
      if (!stopped) setTick((t) => t + 1);
    };

    const delay = nextDelayMs(data);
    const jitter = delay >= 60_000 ? IDLE_JITTER_MS : JITTER_MS;
    timer = setTimeout(load, delay + Math.random() * jitter);

    // Returning to a tab that has been idle: refresh once straight away.
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [data, tick]);

  return <HomeDataContext.Provider value={data}>{children}</HomeDataContext.Provider>;
}