"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FacebookPage } from "@/types";
import { getCurrentUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageSetupForm } from "./_components/page-setup-form";
import { ConnectedPages } from "./_components/connected-pages";
import { PermissionsGuide } from "./_components/permissions-guide";

export default function PageSetupPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const router = useRouter();

  const loadPages = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) {
      toast.error("You must be logged in to view pages");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    try {
      const pagesQuery = query(
        collection(db, "facebook_pages"),
        where("userId", "==", user.email)
      );

      const snapshot = await getDocs(pagesQuery);
      setPages(
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as FacebookPage)
        )
      );
    } catch (err) {
      toast.error("Failed to load Facebook pages");
      console.error("Error loading pages:", err);
    }
  }, [router]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Facebook Page Setup
        </h2>
      </div>

      <div className="grid gap-8">
        <PermissionsGuide />
        <PageSetupForm onPageAdded={loadPages} />
        <ConnectedPages pages={pages} onPageDeleted={loadPages} />
      </div>
    </div>
  );
}
