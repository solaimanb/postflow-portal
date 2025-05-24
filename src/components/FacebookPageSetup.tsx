import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FacebookPage } from "../types";
import { getCurrentUser } from "../lib/services/auth";
import { useRouter } from "next/navigation";

export default function FacebookPageSetup() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPage, setNewPage] = useState({
    name: "",
    pageId: "",
    accessToken: "",
  });
  const router = useRouter();

  // Load existing pages
  useEffect(() => {
    const loadPages = async () => {
      const user = getCurrentUser();
      if (!user) {
        setError("You must be logged in to view pages");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      try {
        setLoading(true);
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
        setError("Failed to load Facebook pages");
        console.error("Error loading pages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, [router]);

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
      setError("You must be logged in to add pages");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    if (!newPage.name || !newPage.pageId || !newPage.accessToken) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Adding page with data:", {
        ...newPage,
        userId: user.email,
      });

      // Add to Firestore
      const docRef = await addDoc(collection(db, "facebook_pages"), {
        ...newPage,
        userId: user.email,
        createdAt: new Date().toISOString(),
      });

      console.log("Page added successfully with ID:", docRef.id);

      // Add to local state
      setPages((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newPage,
          userId: user.email,
        } as FacebookPage,
      ]);

      // Reset form
      setNewPage({
        name: "",
        pageId: "",
        accessToken: "",
      });

      setSuccess("Facebook page added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error adding page:", err);
      if (err instanceof Error) {
        setError(`Failed to add Facebook page: ${err.message}`);
      } else {
        setError("Failed to add Facebook page: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, "facebook_pages", pageId));
      setPages((prev) => prev.filter((page) => page.id !== pageId));
      setSuccess("Page removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete page");
      console.error("Error deleting page:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Facebook Page Setup
      </h2>

      {/* Facebook Permissions Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="text-md font-medium text-blue-800 mb-2">
          Facebook App Permission Requirements
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Before adding pages, make sure your Facebook app has these
          permissions:
        </p>
        <div className="space-y-2">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="ml-2 text-sm text-blue-700">
              <code className="px-1 py-0.5 bg-blue-100 rounded font-medium">
                pages_manage_posts
              </code>{" "}
              - Required for posting content to Facebook pages
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="ml-2 text-sm text-blue-700">
              <code className="px-1 py-0.5 bg-blue-100 rounded font-medium">
                pages_read_engagement
              </code>{" "}
              - Required for reading page information
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="ml-2 text-sm text-blue-700">
              <code className="px-1 py-0.5 bg-blue-100 rounded font-medium">
                pages_manage_metadata
              </code>{" "}
              - Required for managing page metadata
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="ml-2 text-sm text-blue-700">
              <code className="px-1 py-0.5 bg-blue-100 rounded font-medium">
                pages_manage_engagement
              </code>{" "}
              - Required for video uploads
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 font-medium"
          >
            Go to Facebook Developers → App Settings → Advanced → Optional
            Permissions
            <span className="ml-1">↗</span>
          </a>
        </div>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add new page form */}
      <form onSubmit={handleAddPage} className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Page Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={newPage.name}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="My Facebook Page"
          />
        </div>

        <div>
          <label
            htmlFor="pageId"
            className="block text-sm font-medium text-gray-700"
          >
            Page ID
          </label>
          <input
            type="text"
            name="pageId"
            id="pageId"
            value={newPage.pageId}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="123456789012345"
          />
          <p className="mt-1 text-xs text-gray-500">
            You can find your Page ID in the About section of your Facebook page
            or in the URL
          </p>
        </div>

        <div>
          <label
            htmlFor="accessToken"
            className="block text-sm font-medium text-gray-700"
          >
            Page Access Token
          </label>
          <input
            type="password"
            name="accessToken"
            id="accessToken"
            value={newPage.accessToken}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your page access token"
          />
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              How to get a Page Access Token:
            </h4>
            <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
              <li>
                Go to{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Graph API Explorer
                </a>
              </li>
              <li>Select your app from the dropdown menu</li>
              <li>Click &quot;Get Token&quot; and select &quot;Get Page Access Token&quot;</li>
              <li>Select the page you want to manage</li>
              <li>
                Make sure to request the necessary permissions:{" "}
                <span className="font-medium">
                  pages_manage_posts, pages_read_engagement, pages_manage_metadata
                </span>
              </li>
              <li>Copy the generated token and paste it here</li>
            </ol>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Facebook Page"}
          </button>
        </div>
      </form>

      {/* Connected pages list */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connected Pages
        </h3>
        {pages.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No Facebook pages connected yet.
          </p>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Page Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Page ID
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {page.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {page.pageId}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
