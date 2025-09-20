"use client";

import React, { useEffect, useState } from "react";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface LatestRelease {
  tag_name: string;
  assets: ReleaseAsset[];
}

type Platform = "macos" | "windows" | "linux";

function pickAsset(assets: ReleaseAsset[], platform: Platform) {
  const name = (s: string) => s.toLowerCase();
  if (platform === "macos") {
    return assets.find(a => name(a.name).endsWith(".dmg"))
      || assets.find(a => name(a.name).includes("mac") || name(a.name).includes("darwin"));
  }
  if (platform === "windows") {
    return assets.find(a => name(a.name).endsWith(".msi"))
      || assets.find(a => name(a.name).endsWith(".exe"));
  }
  // linux
  return assets.find(a => name(a.name).endsWith(".AppImage".toLowerCase()))
    || assets.find(a => name(a.name).endsWith(".deb"))
    || assets.find(a => name(a.name).endsWith(".rpm"));
}

export function DownloadButtons() {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        // Fetch via server-side proxy to avoid CSP and CORS issues
        const res = await fetch("/api/releases/latest", { cache: "no-store" });
        if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRelease({ tag_name: data.tag_name, assets: data.assets ?? [] });
      } catch (e: any) {
        if (!cancelled) setError("Failed to fetch release info. Please use the Releases page.");
      }
    }
    fetchLatest();
    return () => { cancelled = true; };
  }, []);

  const mac = pickAsset(release?.assets ?? [], "macos");
  const win = pickAsset(release?.assets ?? [], "windows");
  const lin = pickAsset(release?.assets ?? [], "linux");

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 hover:bg-muted"
          href={mac?.browser_download_url ?? "https://github.com/tempandmajor/ottokode/releases"}
          target="_blank"
          rel="noreferrer"
        >
          Download for macOS {release?.tag_name ? `(${release.tag_name})` : ""}
        </a>
        <a
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 hover:bg-muted"
          href={win?.browser_download_url ?? "https://github.com/tempandmajor/ottokode/releases"}
          target="_blank"
          rel="noreferrer"
        >
          Download for Windows {release?.tag_name ? `(${release.tag_name})` : ""}
        </a>
        <a
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 hover:bg-muted"
          href={lin?.browser_download_url ?? "https://github.com/tempandmajor/ottokode/releases"}
          target="_blank"
          rel="noreferrer"
        >
          Download for Linux {release?.tag_name ? `(${release.tag_name})` : ""}
        </a>
      </div>
      <p className="text-xs text-muted-foreground">Looking for other builds? See all assets on the release page.</p>
    </div>
  );
}

export default DownloadButtons;
