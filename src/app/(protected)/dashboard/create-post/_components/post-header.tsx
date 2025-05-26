import { CardHeader } from "@/components/ui/card";

export function PostHeader() {
  return (
    <CardHeader className="pb-0">
      <div className="flex flex-col space-y-1.5">
        <h2 className="text-2xl font-semibold text-foreground/80">
          Create New Post
        </h2>
        <p className="text-sm text-muted-foreground/70">
          Create and schedule posts for your Facebook pages
        </p>
      </div>
    </CardHeader>
  );
}
