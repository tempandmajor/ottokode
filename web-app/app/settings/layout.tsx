import React from "react";
import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      <aside className="border rounded-lg p-4 h-fit sticky top-20">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/settings" className="text-muted-foreground hover:text-foreground">General</Link>
          <Link href="/settings/billing" className="text-muted-foreground hover:text-foreground">Billing & Usage</Link>
          <Link href="/settings/ai" className="text-muted-foreground hover:text-foreground">AI Settings</Link>
          <Link href="/settings/notifications" className="text-muted-foreground hover:text-foreground">Notifications</Link>
          <Link href="/settings/security" className="text-muted-foreground hover:text-foreground">Security</Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
