import { CircleAlert } from "lucide-react";
import { PERMISSION_CODES } from "./shared-styles";

export function PermissionsInfo() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 border-b p-4">
        <CircleAlert className="h-5 w-5 text-blue-500/70" />
        <h3 className="font-medium">Required Facebook Permissions</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {PERMISSION_CODES.map(({ code, description }) => (
          <div key={code} className="flex items-start gap-2 text-sm">
            <code className="px-1.5 py-0.5 bg-blue-100/50 rounded text-blue-700/90 shrink-0">
              {code}
            </code>
            <span className="text-muted-foreground/70">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 