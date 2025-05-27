import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { TopicSearchParams } from "@/lib/services/apify";

const formSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxItems: z.number().min(1).max(100),
});

export interface TopicSearchProps {
  onSearch: (params: TopicSearchParams) => void;
  isLoading: boolean;
  initialValues?: TopicSearchParams;
}

export function TopicSearch({
  onSearch,
  isLoading,
  initialValues,
}: TopicSearchProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: initialValues?.keyword || "",
      startDate: initialValues?.startDate || "",
      endDate: initialValues?.endDate || "",
      maxItems: initialValues?.maxItems || 20,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.keyword?.trim()) return;
    onSearch({
      ...values,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter keywords to search Facebook topics..."
                      className="w-full h-10 text-base"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="maxItems"
              render={({ field }) => (
                <FormItem>
                  <Select
                    disabled={isLoading}
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-40 h-10">
                        <SelectValue placeholder="Max results" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5 results</SelectItem>
                      <SelectItem value="10">10 results</SelectItem>
                      <SelectItem value="20">20 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="w-full h-10"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="w-full h-10"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !form.watch("keyword")?.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
