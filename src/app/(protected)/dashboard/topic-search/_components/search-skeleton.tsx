import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from "@/components/ui/card";

export function SearchSkeleton() {
  return (
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>
    </CardContent>
  );
} 