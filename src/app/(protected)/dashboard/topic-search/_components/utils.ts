import { FacebookTopic } from "@/types";

export function downloadTopicsAsCSV(topics: FacebookTopic[]) {
  if (topics.length === 0) return;

  const escapeCSV = (field: string | number) => {
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
    "Page",
    "Date",
    "Reactions",
    "Comments",
    "Shares",
    "Type",
    "URL",
    "Video URL",
    "Image URL"
  ];
  const rows = topics.map((topic) => [
    escapeCSV(topic.text || topic.topic || ""),
    escapeCSV(topic.pageName || topic.relatedTopics?.[0] || "Unknown"),
    escapeCSV(new Date(topic.time || topic.date).toLocaleString()),
    escapeCSV(topic.likes || 0),
    escapeCSV(topic.comments || 0),
    escapeCSV(topic.shares || 0),
    escapeCSV(topic.type || ""),
    escapeCSV(topic.url || ""),
    escapeCSV(topic.videoUrl || ""),
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