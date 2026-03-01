/**
 * Cloudflare Worker: minireader
 * GET  /?keyword=...   -> proxy to Jisho API
 * POST /handwrite      -> proxy to Google Input Tools handwriting
 *
 * WHY 403:
 * Jisho detects bot/datacenter traffic via missing browser headers and blocks
 * it with a 403. The fix is to send a realistic browser request — full
 * User-Agent, Accept, Accept-Language, Referer, and sec-fetch headers —
 * so Jisho's WAF treats the request as legitimate.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // ── Handwriting proxy ─────────────────────────────────────────────────
    if (url.pathname === "/handwrite") {
      if (request.method !== "POST") return json({ error: "Use POST" }, 405);

      let body;
      try { body = await request.json(); }
      catch (e) { return json({ error: "BAD_REQUEST_BODY", detail: String(e) }, 400); }

      let upstream;
      try {
        upstream = await fetch(
          "https://www.google.com/inputtools/request?ime=handwriting&app=translate&cs=1",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              "Accept": "application/json",
              "Origin": "https://translate.google.com",
              "Referer": "https://translate.google.com/",
            },
            body: JSON.stringify(body),
          }
        );
      } catch (e) {
        return json({ error: "UPSTREAM_FETCH_FAILED", upstream: "google.com", detail: String(e) }, 502);
      }

      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // ── Jisho proxy ───────────────────────────────────────────────────────
    const keyword = url.searchParams.get("keyword") || "";
    if (!keyword) return json({ error: "Missing keyword" }, 400);

    // Edge cache — serve stale on upstream failure
    const cache = caches.default;
    const cacheKey = new Request(
      "https://cache.minireader.local/v3?kw=" + encodeURIComponent(keyword),
      { method: "GET" }
    );
    const cached = await cache.match(cacheKey);

    const jishoURL =
      "https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(keyword);

    // Spoof a real browser request. Jisho's WAF checks these headers.
    const browserHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://jisho.org/",
      "Origin": "https://jisho.org",
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "Connection": "keep-alive",
    };

    let lastErr = "";
    for (let i = 0; i < 2; i++) {
      let upstream;
      try {
        upstream = await fetch(jishoURL, { headers: browserHeaders });
      } catch (e) {
        lastErr = String(e);
        continue;
      }

      if (upstream.ok) {
        const text = await upstream.text();
        const resp = new Response(text, {
          status: 200,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=600",
          },
        });
        ctx.waitUntil(cache.put(cacheKey, resp.clone()));
        return resp;
      }

      lastErr = `HTTP ${upstream.status}`;
      // Don't retry on definitive rejections
      if ([403, 404, 400, 401].includes(upstream.status)) break;
      await sleep(200);
    }

    // Serve stale cache as fallback
    if (cached) {
      const stale = await cached.text();
      return new Response(stale, {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=60",
          "X-Served-From": "stale-cache",
        },
      });
    }

    return json({ error: "JISHO_UNAVAILABLE", detail: lastErr }, 502);
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
