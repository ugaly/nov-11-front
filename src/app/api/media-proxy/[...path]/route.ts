import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/api/config";

export const runtime = "nodejs";

/** Proxy backend media for inline PDF preview (iframes block cross-origin media). */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathStr = path.join("/");
  const upstream = `${API_BASE_URL}/media/${pathStr}${req.nextUrl.search}`;

  const headers: HeadersInit = {};
  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  let res: Response;
  try {
    res = await fetch(upstream, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "media_proxy_unreachable" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
