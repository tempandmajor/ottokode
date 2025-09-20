import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
  try {
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "tempandmajor/ottokode";
    const url = `https://api.github.com/repos/${repo}/releases/latest`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        // Optional: if you want to increase rate limit, set GH token in env and forward here
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        "User-Agent": "ottokode-web-app",
      },
      cache: "no-store",
      // 10s timeout safeguard
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `GitHub HTTP ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();

    // Return only needed fields
    return NextResponse.json({
      tag_name: data.tag_name,
      assets: (data.assets || []).map((a: any) => ({
        name: a.name,
        browser_download_url: a.browser_download_url,
      })),
    }, {
      headers: {
        "Cache-Control": "no-store",
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch release" }, { status: 500 });
  }
}
