import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from "@/components/ui/card";

export function ResultsSkeleton() {
  return (
    <CardContent className="p-0">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="border-b">
            <div className="grid grid-cols-7 gap-4 py-4 px-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Table Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b">
              <div className="grid grid-cols-7 gap-4 py-4 px-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  );
}
