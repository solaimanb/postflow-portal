import { Search } from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function SearchHeader() {
  return (
    <CardHeader className="border-b px-6 py-0">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl font-semibold mb-1">
            Topic Search
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Search and analyze Facebook topics with advanced filters
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
} 