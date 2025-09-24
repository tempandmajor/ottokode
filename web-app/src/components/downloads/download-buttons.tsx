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

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-center">
        <a
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-lg font-semibold"
          href={mac?.browser_download_url ?? "https://github.com/tempandmajor/ottokode/releases"}
          target="_blank"
          rel="noreferrer"
        >
          Download for macOS {release?.tag_name ? `(${release.tag_name})` : ""}
        </a>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Currently available for macOS only. Windows and Linux versions coming soon.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Looking for release notes? <a href="https://github.com/tempandmajor/ottokode/releases" className="underline" target="_blank" rel="noreferrer">See all releases</a>
        </p>
      </div>
    </div>
  );
}

export default DownloadButtons;
