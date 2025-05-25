"use client";

import FacebookPageSetup from "@/components/FacebookPageSetup";

export default function PageSetupPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Page Setup</h1>
        <p className="text-muted-foreground">Configure and manage your Facebook page connections.</p>
      </div>

      <FacebookPageSetup />
    </div>
  );
} 