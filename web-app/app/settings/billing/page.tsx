"use client";

import { SubscriptionStatus } from "@/components/billing/subscription-status";
import { UsageChart } from "@/components/billing/usage-chart";

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground">Track usage and manage billing preferences.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SubscriptionStatus />
        </div>
        <div className="space-y-6">
          <UsageChart />
        </div>
      </div>
    </div>
  );
}
