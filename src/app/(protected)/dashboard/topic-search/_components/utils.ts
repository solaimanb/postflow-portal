import { Topic } from "@/lib/services/apify";

export function downloadTopicsAsCSV(topics: Topic[]) {
  if (topics.length === 0) return;

  const escapeCSV = (field: string | number | undefined) => {
    if (field === undefined) return "";
    const value = String(field);
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headers = [
    "Content",
    "Page Name",
    "Date",
    "Likes",
    "Comments",
    "Shares",
    "Views",
    "Plays",
    "Type",
    "Post URL",
    "Author Profile",
    "Video URL",
    "Video Thumbnail",
    "Image URL"
  ];
  
  const rows = topics.map((topic) => [
    escapeCSV(topic.text || topic.topic || ""),
    escapeCSV(topic.pageName || "Unknown"),
    escapeCSV(new Date(topic.date).toLocaleString()),
    escapeCSV(topic.likes || 0),
    escapeCSV(topic.comments || 0),
    escapeCSV(topic.shares || 0),
    escapeCSV(topic.viewCount || 0),
    escapeCSV(topic.playCount || 0),
    escapeCSV(topic.type || ""),
    escapeCSV(topic.url || ""),
    escapeCSV(topic.pageUrl || ""),
    escapeCSV(topic.videoUrl || ""),
    escapeCSV(topic.videoThumbnail || ""),
    escapeCSV(topic.imageUrl || "")
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\r\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `facebook-topics-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 