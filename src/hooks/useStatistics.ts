// import { useState, useEffect } from "react";
// import { toast } from "sonner";

// interface StatBadge {
//   text: string;
//   color: string;
// }

// export interface Stat {
//   label: string;
//   value: string;
//   subValue?: string;
//   prefix?: string;
//   badge: StatBadge;
// }

// export function useStatistics() {
//   const [stats, setStats] = useState<Stat[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchStatistics = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("/api/statistics");
//       if (!response.ok) {
//         throw new Error("Failed to fetch statistics");
//       }
//       const data = await response.json();
//       setStats(data);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to fetch statistics"
//       );
//       toast.error("Failed to load dashboard statistics");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStatistics();
//     const interval = setInterval(fetchStatistics, 60000); 
//     return () => clearInterval(interval);
//   }, []);

//   const refreshStats = () => {
//     fetchStatistics();
//   };

//   return {
//     stats,
//     isLoading,
//     error,
//     refreshStats,
//   };
// }
