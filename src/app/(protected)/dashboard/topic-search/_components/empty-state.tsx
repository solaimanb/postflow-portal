import { Search } from "lucide-react";
import { CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <CardContent className="py-16 text-center">
      <div className="mx-auto w-16 h-16 bg-primary/5 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
        <Search className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground/80 mb-3">
        No Results Yet
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto leading-relaxed">
        Enter your search criteria above and click search to discover Facebook
        topics and discussions.
      </p>
    </CardContent>
  );
}
