import React, { useState } from "react";
import { TopicSearchParams } from "../types";

interface TopicSearchProps {
  onSearch: (params: TopicSearchParams) => Promise<void>;
  isLoading: boolean;
}

const TopicSearch: React.FC<TopicSearchProps> = ({ onSearch, isLoading }) => {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showActorInfo, setShowActorInfo] = useState(false);
  
  const actorId = process.env.NEXT_PUBLIC_APIFY_ACTOR_ID || "blf62maenLRO8Rsfv";
  const actorStoreUrl = `https://apify.com/store?search=${actorId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    onSearch({
      keyword: keyword.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Search Topics</h2>
        <button
          type="button"
          onClick={() => setShowActorInfo(!showActorInfo)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {showActorInfo ? "Hide Actor Info" : "Show Actor Info"}
        </button>
      </div>
      
      {showActorInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Current Apify Actor</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ID: <span className="font-mono">{actorId}</span></p>
            </div>
            <a 
              href={actorStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1 px-2 rounded"
            >
              View in Apify Store
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="keyword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter a topic keyword"
              required
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TopicSearch; 