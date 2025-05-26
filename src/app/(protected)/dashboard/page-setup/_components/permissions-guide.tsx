"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ExternalLink } from "lucide-react";

export function PermissionsGuide() {
  const permissions = [
    {
      name: "pages_manage_posts",
      description: "Required for posting content to Facebook pages",
    },
    {
      name: "pages_read_engagement",
      description: "Required for reading page information",
    },
    {
      name: "pages_manage_metadata",
      description: "Required for managing page metadata",
    },
    {
      name: "pages_manage_engagement",
      description: "Required for video uploads",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook App Permission Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Before adding pages, make sure your Facebook app has these permissions:
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {permissions.map((permission) => (
            <div key={permission.name} className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {permission.name}
                </code>
                <span className="text-sm text-muted-foreground ml-2">
                  - {permission.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Go to Facebook Developers → App Settings → Advanced → Optional Permissions
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
} 