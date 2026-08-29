import { NextRequest } from "next/server";

const UPSTREAM = "https://api.backpack.exchange/api/v1";

export const dynamic = "force-dynamic";

/* Backpack sends no CORS headers, so market data has to be fetched server
   side. A plain rewrite forwards the browser's own Origin, Referer and
   Sec-Fetch headers, which the upstream edge answers with 403 — so the
   request is rebuilt here with nothing but the path, query and an accept
   header. */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const search = request.nextUrl.search;
    const target = `${UPSTREAM}/${params.path.map(encodeURIComponent).join("/")}${search}`;

    try {
        const upstream = await fetch(target, {
            headers: { accept: "application/json" },
            cache: "no-store",
        });
        const body = await upstream.text();
        return new Response(body, {
            status: upstream.status,
            headers: {
                "content-type": upstream.headers.get("content-type") ?? "application/json",
                "cache-control": "no-store",
            },
        });
    } catch {
        return Response.json({ error: "Upstream market data is unreachable." }, { status: 502 });
    }
}
