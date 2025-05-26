import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ResultsHeaderProps {
  topicsCount: number;
}

export function ResultsHeader({ topicsCount }: ResultsHeaderProps) {
  return (
    <CardHeader className="border-b px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold mb-1">
              Search Results
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {topicsCount} topics found matching your search criteria
            </CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {topicsCount} results
        </Badge>
      </div>
    </CardHeader>
  );
} 