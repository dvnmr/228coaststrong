/* Coast Strong live activity — POST /api/activity
 *
 * Backend for the "Watch our community grow" panel (activity.js).
 * Stores aggregate counts only: no names, IPs, locations or referrers.
 * Storage: one KV namespace, bound as ACTIVITY_KV in wrangler.toml.
 *
 * Keys:
 *   total              total page views since tracking began (int string)
 *   day:YYYY-MM-DD     page views for that day, America/Chicago (int string, 48h TTL)
 *   started            ISO timestamp of the first recorded view (set once)
 *   view:<viewId>      "1", 24h TTL — idempotency: one viewId counts once
 *   s:<lastSeenMs>:<sessionId>  "1", 5 min TTL — live sessions; the
 *                      timestamp lives in the key so counting needs no per-key GET.
 *
 * Notes:
 * - Counters are read-modify-write. At this site's traffic two refreshes
 *   landing in the same instant can lose one increment; that is acceptable
 *   here and beats adding a queue for a community counter.
 * - Seeding: the panel never counted anything before this backend existed,
 *   so the first deploy starts from Cloudflare's own verified number, not
 *   zero. Set SEED_TOTAL_VIEWS / SEED_STARTED_AT as [vars] in
 *   wrangler.toml (e.g. 11723 / the site creation date). The seed applies
 *   exactly once — the first time a view is counted while no total exists —
 *   and never fires again.
 * - If ACTIVITY_KV is not bound yet, every request answers 503 JSON so the
 *   panel keeps its "temporarily unavailable" state instead of crashing.
 */

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIVE_WINDOW_MS = 120000; // "Active sessions · last 2 minutes"
const SESSION_TTL_SECONDS = 300;
const VIEW_TTL_SECONDS = 86400; // 24h idempotency window
const DAY_TTL_SECONDS = 172800; // 48h; yesterday's key ages out on its own

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function chicagoDate(now) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

async function readCount(kv, key) {
  const raw = await kv.get(key);
  const n = raw === null ? 0 : parseInt(raw, 10);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

// Seed values come from wrangler.toml [vars]. Invalid values are ignored
// (treated as no seed) rather than failing the request.
function parseSeedInt(raw) {
  if (typeof raw !== "string") return null;
  const n = parseInt(raw, 10);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

function parseSeedDate(raw) {
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

async function countActiveSessions(kv, nowMs) {
  const listed = await kv.list({ prefix: "s:" });
  const seen = new Map(); // sessionId -> newest lastSeenMs
  for (const key of listed.keys || []) {
    const parts = key.name.split(":");
    if (parts.length !== 3) continue;
    const lastSeen = Number(parts[1]);
    if (!Number.isFinite(lastSeen)) continue;
    const prev = seen.get(parts[2]);
    if (prev === undefined || lastSeen > prev) seen.set(parts[2], lastSeen);
  }
  let active = 0;
  for (const lastSeen of seen.values()) {
    if (nowMs - lastSeen <= ACTIVE_WINDOW_MS) active += 1;
  }
  return active;
}

export async function onRequestPost(context) {
  const kv = context.env && context.env.ACTIVITY_KV;
  if (!kv) return json({ error: "unavailable" }, 503);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const { sessionId, viewId, countView } = body || {};
  if (
    typeof sessionId !== "string" ||
    !UUID_V4.test(sessionId) ||
    typeof viewId !== "string" ||
    !UUID_V4.test(viewId) ||
    typeof countView !== "boolean"
  ) {
    return json({ error: "bad_request" }, 400);
  }

  const now = new Date();
  const nowMs = now.getTime();

  try {
    if (countView) {
      const alreadyCounted = (await kv.get(`view:${viewId}`)) !== null;
      if (!alreadyCounted) {
        const dayKey = `day:${chicagoDate(now)}`;
        const [totalRaw, today, started] = await Promise.all([
          kv.get("total"),
          readCount(kv, dayKey),
          kv.get("started"),
        ]);
        // First count ever: start from the seed (Cloudflare's verified
        // number), not zero. Once a total exists the seed never fires again.
        const seedTotal = parseSeedInt(context.env.SEED_TOTAL_VIEWS);
        const base =
          totalRaw === null
            ? seedTotal ?? 0
            : parseSeedInt(totalRaw) ?? 0;
        const startedValue =
          started !== null
            ? started
            : parseSeedDate(context.env.SEED_STARTED_AT) ?? now.toISOString();
        await Promise.all([
          kv.put("total", String(base + 1)),
          kv.put(dayKey, String(today + 1), {
            expirationTtl: DAY_TTL_SECONDS,
          }),
          kv.put(`view:${viewId}`, "1", { expirationTtl: VIEW_TTL_SECONDS }),
          started === null
            ? kv.put("started", startedValue)
            : Promise.resolve(),
        ]);
      }
    }

    // Heartbeat: this session is alive right now. A fresh key each refresh
    // is fine — old ones expire after 5 minutes.
    await kv.put(`s:${nowMs}:${sessionId}`, "1", {
      expirationTtl: SESSION_TTL_SECONDS,
    });

    const [totalViews, todayViews, activeSessions, startedAt] =
      await Promise.all([
        readCount(kv, "total"),
        readCount(kv, `day:${chicagoDate(now)}`),
        countActiveSessions(kv, nowMs),
        kv.get("started"),
      ]);

    return json(
      {
        totalViews,
        todayViews,
        activeSessions,
        updatedAt: now.toISOString(),
        startedAt: startedAt || null,
      },
      200
    );
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

export async function onRequestGet() {
  return json({ error: "method_not_allowed" }, 405);
}
