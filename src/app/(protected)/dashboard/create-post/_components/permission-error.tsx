import { AlertCircle } from "lucide-react";

const PERMISSION_CODES = [
  { code: "pages_manage_posts", description: "Required for creating posts" },
  { code: "pages_read_engagement", description: "Required for reading page content" },
  { code: "pages_manage_engagement", description: "Required for managing posts and media" },
  { code: "publish_video", description: "Required for video uploads" },
];

export function PermissionError() {
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 backdrop-blur-[2px]">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-destructive/70 shrink-0 mt-0.5" />
        <div className="space-y-3">
          <p className="text-sm font-medium text-destructive/90">Facebook Permission Error</p>
          <div className="text-sm text-destructive/80 space-y-2">
            <p>Your Facebook app is missing required permissions to post content. To fix this:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:text-destructive"
                >
                  Facebook Developers
                </a>
              </li>
              <li>Select your app</li>
              <li>Navigate to App Settings &gt; Advanced &gt; Optional Permissions</li>
              <li>
                Request the following permissions:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {PERMISSION_CODES.map(({ code, description }) => (
                    <li key={code}>
                      <code className="px-1.5 py-0.5 bg-destructive/10 rounded-md">{code}</code>
                      {" "}({description})
                    </li>
                  ))}
                </ul>
              </li>
              <li>After permissions are approved, get a new Page Access Token</li>
              <li>Update your Page Access Token in the Page Setup tab</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 