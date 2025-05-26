export const CARD_STYLES = "border-0 shadow-sm bg-background/95 backdrop-blur-sm rounded-lg";
export const PERMISSION_CODES = [
  { code: "pages_manage_posts", description: "Basic posting" },
  { code: "pages_read_engagement", description: "Reading engagement" },
  { code: "pages_manage_metadata", description: "Managing metadata" },
  { code: "pages_manage_engagement", description: "Video uploads" },
] as const; 