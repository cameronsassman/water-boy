import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// ============================================================================
// USAGE
// ============================================================================
//
// Full run (local):
//   k6 run -e BASE_URL=http://localhost:3000 loadtest.js
//
// Full run (preview/prod, ideally from a VM near the deployment region):
//   k6 run -e BASE_URL=https://www.sacsjuniorswaterpolo.co.za loadtest.js
//
// Smoke test (5 VUs, 30s):
//   k6 run -e SMOKE=1 -e BASE_URL=http://localhost:3000 loadtest.js
//
// NOTE: CLI --vus/--duration are ignored when options.scenarios is defined,
// so the smoke test is switched with the SMOKE env var instead.
//
// ============================================================================

const BASE = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SMOKE = __ENV.SMOKE === "1";

// ============================================================================
// TEAM SLUGS (must match /teams/[slug])
// ============================================================================

const TEAM_SLUGS = [
  "rhenish-primary",
  "somerset-college",
  "st-johns-prep",
  "st-stithians",
  "stirling-primary",
  "the-ridge",
  "wynberg-boys-junior",
  "sacs-13a",
  "sacs-13b",
  "southern-suburbs-inv",
  "clifton-durban",
  "grey-college-primary",
  "highbury",
  "paarl-boys-primary",
  "reddam-house",
  "rondebosch-boys-prep",
  "st-davids",
  "st-peters-boys-prep",
  "st-benedicts-college",
  "sun-valley-primary",
  "umhlali-preparatory",
  "woodridge-preparatory",
];

// ============================================================================
// CUSTOM METRICS
// ============================================================================

// Only meaningful against Vercel (always "none" on localhost).
const edgeCacheStatus = new Counter("edge_cache_status");

// ============================================================================
// THRESHOLDS
// ============================================================================

const PAGE_THRESHOLDS = ["p(95)<2000", "p(99)<4000"];

const thresholds = {
  // <1% failures; abort early if it's clearly broken.
  http_req_failed: [
    { threshold: "rate<0.01", abortOnFail: true, delayAbortEval: "1m" },
  ],

  "http_req_duration{type:page}": PAGE_THRESHOLDS,
  "http_req_duration{page:fixtures}": PAGE_THRESHOLDS,
  "http_req_duration{page:team}": PAGE_THRESHOLDS,
  "http_req_duration{page:home}": PAGE_THRESHOLDS,
  "http_req_duration{page:standings}": PAGE_THRESHOLDS,
  "http_req_duration{page:other}": PAGE_THRESHOLDS,

  "http_req_duration{type:api}": ["p(95)<1000", "p(99)<2000"],

  checks: [{ threshold: "rate>0.99", abortOnFail: true, delayAbortEval: "1m" }],
};

// ============================================================================
// OPTIONS
// ============================================================================
//
// Traffic mix (per session): Fixtures 50%, Team 35%, Home 7%, Standings 5%,
// Other 3%. Peak: 2,000 VUs (safety margin over expected ~1,000).
//

export const options = SMOKE
  ? {
      vus: 5,
      duration: "30s",
      thresholds,
      summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
    }
  : {
      scenarios: {
        tournament_traffic: {
          executor: "ramping-vus",
          startVUs: 0,
          stages: [
            { duration: "1m", target: 100 }, // warm-up
            { duration: "2m", target: 500 }, // normal
            { duration: "2m", target: 1000 }, // expected peak
            { duration: "5m", target: 1000 }, // hold peak
            { duration: "2m", target: 1500 }, // heavy
            { duration: "3m", target: 1500 }, // hold heavy
            { duration: "2m", target: 2000 }, // stress
            { duration: "3m", target: 2000 }, // hold stress
            { duration: "2m", target: 0 }, // cool down
          ],
          gracefulRampDown: "30s",
        },
      },
      thresholds,
      summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
    };

// ============================================================================
// HELPERS
// ============================================================================

function randomTeamSlug() {
  return TEAM_SLUGS[Math.floor(Math.random() * TEAM_SLUGS.length)];
}

function recordCacheStatus(response) {
  edgeCacheStatus.add(1, {
    status: response.headers["X-Vercel-Cache"] || "none",
  });
}

function getPage(path, pageType) {
  const response = http.get(`${BASE}${path}`, {
    // `name` groups dynamic URLs (e.g. /teams/[slug]) into one series.
    tags: { type: "page", page: pageType, name: pageType },
  });

  check(response, {
    [`${pageType} is 200`]: (r) => r.status === 200,
  });

  recordCacheStatus(response);
  return response;
}

function getApi(path, apiName) {
  const response = http.get(`${BASE}${path}`, {
    tags: { type: "api", name: apiName },
  });

  check(response, {
    [`${apiName} is 200`]: (r) => r.status === 200,
  });

  recordCacheStatus(response);
  return response;
}

// ============================================================================
// MAIN USER SESSION
// ============================================================================

export default function () {
  const random = Math.random();

  if (random < 0.5) {
    // 50% FIXTURES
    getPage("/fixtures", "fixtures");
    sleep(2 + Math.random() * 5);

    // 50% of fixture users revisit
    if (Math.random() < 0.5) {
      getPage("/fixtures", "fixtures");
      sleep(2 + Math.random() * 4);
    }
  } else if (random < 0.85) {
    // 35% TEAM PAGES
    getPage(`/teams/${randomTeamSlug()}`, "team");
    sleep(2 + Math.random() * 6);

    // 30% open another team
    if (Math.random() < 0.3) {
      getPage(`/teams/${randomTeamSlug()}`, "team");
      sleep(2 + Math.random() * 5);
    }
  } else if (random < 0.92) {
    // 7% HOME
    getPage("/", "home");
    sleep(2 + Math.random() * 5);
  } else if (random < 0.97) {
    // 5% STANDINGS
    getPage("/standings", "standings");
    sleep(2 + Math.random() * 5);
  } else {
    // 3% OTHER
    getPage("/", "other");
    sleep(2 + Math.random() * 5);
  }

  // ==========================================================================
  // LIVE DATA POLLING
  // ==========================================================================
  //
  // ~50% of users stay on the site; the browser polls /api/home roughly every
  // 10s. 0-3s jitter avoids every VU hitting the API in the same millisecond.
  //

  if (Math.random() < 0.5) {
    for (let i = 0; i < 6; i++) {
      sleep(10 + Math.random() * 3);

      const response = getApi("/api/home", "api_home");

      check(response, {
        "api has expected shape": (r) => {
          try {
            const body = r.json();
            return (
              Array.isArray(body.live) &&
              Array.isArray(body.upcoming) &&
              Array.isArray(body.groups)
            );
          } catch (e) {
            return false;
          }
        },
      });
    }
  }

  // Between-sessions pause
  sleep(1 + Math.random() * 4);
}