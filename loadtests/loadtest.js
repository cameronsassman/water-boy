import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// Usage:
//   k6 run -e BASE_URL=https://your-preview.vercel.app loadtest.js
//   k6 run -e BASE_URL=http://localhost:3000 --vus 5 --duration 30s loadtest.js   (smoke test)
const BASE = __ENV.BASE_URL || "http://localhost:3000";

const cacheStatus = new Counter("edge_cache_status"); // tagged HIT / MISS / STALE / none

export const options = {
  scenarios: {
    viewers: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 200 },  // warm-up
        { duration: "2m", target: 1000 }, // ramp to expected crowd
        { duration: "5m", target: 1000 }, // hold: a busy match
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:api_home}": ["p(95)<800", "p(99)<1500"],
    "http_req_duration{name:page}": ["p(95)<1500"],
    checks: ["rate>0.99"],
  },
};

// One iteration = one viewer session: load the page once, then poll like the
// browser does (every ~10s with 0-3s jitter, matching HomeDataProvider).
export default function () {
  const page = http.get(`${BASE}/`, { tags: { name: "page" } });
  check(page, { "page is 200": (r) => r.status === 200 });

  for (let i = 0; i < 12; i++) {
    sleep(10 + Math.random() * 3);

    const res = http.get(`${BASE}/api/home`, { tags: { name: "api_home" } });

    check(res, {
      "api is 200": (r) => r.status === 200,
      "api has expected shape": (r) => {
        try {
          const b = r.json();
          return Array.isArray(b.live) && Array.isArray(b.upcoming) && Array.isArray(b.groups);
        } catch (e) {
          return false;
        }
      },
    });

    cacheStatus.add(1, { status: res.headers["X-Vercel-Cache"] || "none" });
  }
}