import React, { useState } from "react";
import { TopicSearchParams } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, SearchIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TopicSearchProps {
  onSearch: (params: TopicSearchParams) => Promise<void>;
  isLoading: boolean;
}

export function TopicSearch({ onSearch, isLoading }: TopicSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [maxItems, setMaxItems] = useState("20");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    onSearch({
      keyword: keyword.trim(),
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      maxItems: parseInt(maxItems) || 20,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keywords to search Facebook topics..."
            className="w-full h-10 text-base"
            required
          />
        </div>
        <div>
          <Select value={maxItems} onValueChange={setMaxItems}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Max results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 results</SelectItem>
              <SelectItem value="50">50 results</SelectItem>
              <SelectItem value="100">100 results</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-10 justify-start text-left font-normal text-base",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {startDate ? format(startDate, "PP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-10 justify-start text-left font-normal text-base",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {endDate ? format(endDate, "PP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="w-[140px] h-10"
        >
          <SearchIcon className="h-5 w-5 mr-2" />
          <span className="text-base">
            {isLoading ? "Searching..." : "Search"}
          </span>
        </Button>
      </div>
    </form>
  );
} 