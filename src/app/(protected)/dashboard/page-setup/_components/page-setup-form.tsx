"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { getCurrentUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";

interface PageSetupFormProps {
  onPageAdded: () => void;
}

export function PageSetupForm({ onPageAdded }: PageSetupFormProps) {
  const [loading, setLoading] = useState(false);
  const [newPage, setNewPage] = useState({
    name: "",
    pageId: "",
    accessToken: "",
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      toast.error("You must be logged in to add pages");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    if (!newPage.name || !newPage.pageId || !newPage.accessToken) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "facebook_pages"), {
        ...newPage,
        userId: user.email,
        createdAt: new Date().toISOString(),
      });

      setNewPage({
        name: "",
        pageId: "",
        accessToken: "",
      });

      toast.success("Facebook page added successfully");
      onPageAdded();
    } catch (err) {
      console.error("Error adding page:", err);
      if (err instanceof Error) {
        toast.error(`Failed to add Facebook page: ${err.message}`);
      } else {
        toast.error("Failed to add Facebook page: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Facebook Page</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddPage} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Page Name</Label>
              <Input
                id="name"
                name="name"
                value={newPage.name}
                onChange={handleInputChange}
                placeholder="My Facebook Page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                name="pageId"
                value={newPage.pageId}
                onChange={handleInputChange}
                placeholder="123456789012345"
              />
              <p className="text-sm text-muted-foreground">
                You can find your Page ID in the About section of your Facebook
                page or in the URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Page Access Token</Label>
              <Input
                type="password"
                id="accessToken"
                name="accessToken"
                value={newPage.accessToken}
                onChange={handleInputChange}
                placeholder="Enter your page access token"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <h4 className="font-medium mb-2">
                  How to get a Page Access Token:
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-sm">
                  <li>
                    Go to{" "}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline inline-flex items-center"
                    >
                      Graph API Explorer
                      <ExternalLink className="h-3 w-3 ml-0.5" />
                    </a>
                  </li>
                  <li>Select your app from the dropdown menu</li>
                  <li>Click &quot;Get Token&quot; and select &quot;Get Page Access Token&quot;</li>
                  <li>Select the page you want to manage</li>
                  <li>
                    Request permissions:{" "}
                    <span className="font-medium">
                      pages_manage_posts, pages_read_engagement,
                      pages_manage_metadata
                    </span>
                  </li>
                  <li>Copy the generated token and paste it here</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Facebook Page"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
