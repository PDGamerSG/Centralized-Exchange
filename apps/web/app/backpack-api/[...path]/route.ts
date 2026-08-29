import { NextRequest } from "next/server";

const UPSTREAM = "https://api.backpack.exchange/api/v1";

/* Exactly the read-only endpoints the UI calls. An allowlist rather than a
   pass-through: `encodeURIComponent` leaves `.` alone, so a `%2e%2e` segment
   arrives here as `..` and fetch would normalise it away, walking out of
   /api/v1 to anything else the upstream host serves. */
const ALLOWED = new Set(["tickers", "depth", "trades", "klines"]);

export const dynamic = "force-dynamic";

/* Backpack sends no CORS headers, so market data has to be fetched server
   side. A plain rewrite forwards the browser's own Origin, Referer and
   Sec-Fetch headers, which the upstream edge answers with 403 — so the
   request is rebuilt here with nothing but the path, query and an accept
   header. */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const [endpoint, ...rest] = params.path;
    if (rest.length > 0 || !ALLOWED.has(endpoint)) {
        return json({ error: "Unknown market data endpoint." }, 404);
    }

    try {
        const upstream = await fetch(`${UPSTREAM}/${endpoint}${request.nextUrl.search}`, {
            headers: { accept: "application/json" },
            cache: "no-store",
        });
        const body = await upstream.text();

        /* The upstream content type is deliberately not forwarded. Its edge
           answers rate limits and blocks with an HTML page, and echoing that
           type would render the page as same-origin HTML on this app. */
        if (!upstream.headers.get("content-type")?.includes("json")) {
            return json({ error: "Upstream market data returned an unexpected response." }, 502);
        }
        return new Response(body, { status: upstream.status, headers: headers() });
    } catch {
        return json({ error: "Upstream market data is unreachable." }, 502);
    }
}

function headers() {
    return {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
    };
}

function json(body: unknown, status: number) {
    return new Response(JSON.stringify(body), { status, headers: headers() });
}
