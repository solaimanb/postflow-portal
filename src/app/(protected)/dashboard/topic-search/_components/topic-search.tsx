import React from "react";
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
import { useForm } from "react-hook-form";
import { TopicSearchParams } from "@/lib/services/apify";

export interface TopicSearchProps {
  onSearch: (params: TopicSearchParams) => void;
  isLoading?: boolean;
  initialValues?: TopicSearchParams | null;
}

export function TopicSearch({
  onSearch,
  isLoading,
  initialValues,
}: TopicSearchProps) {
  const { register, handleSubmit, watch, setValue } =
    useForm<TopicSearchParams>({
      defaultValues: initialValues || {
        keyword: "",
        startDate: undefined,
        endDate: undefined,
      },
    });

  const keyword = watch("keyword");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const maxItems = watch("maxItems");

  const onSubmit = handleSubmit((data) => {
    if (!data.keyword?.trim()) return;
    onSearch(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Input
            {...register("keyword")}
            placeholder="Enter keywords to search Facebook topics..."
            className="w-full h-10 text-base"
            required
          />
        </div>
        <div>
          <Select
            value={maxItems?.toString() || "20"}
            onValueChange={(value) => setValue("maxItems", parseInt(value))}
          >
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Max results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 results</SelectItem>
              <SelectItem value="10">10 results</SelectItem>
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
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-10 justify-start text-left font-normal text-base",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {startDate ? format(new Date(startDate), "PP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(date) =>
                  setValue(
                    "startDate",
                    date ? format(date, "yyyy-MM-dd") : undefined
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-10 justify-start text-left font-normal text-base",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {endDate ? format(new Date(endDate), "PP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(date) =>
                  setValue(
                    "endDate",
                    date ? format(date, "yyyy-MM-dd") : undefined
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !keyword?.trim()}
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
