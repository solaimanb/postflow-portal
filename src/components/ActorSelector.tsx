import React, { useState, useEffect } from "react";

interface Actor {
  id: string;
  name: string;
  description: string;
}

interface ActorSelectorProps {
  currentActorId: string;
  onActorChange: (actorId: string) => void;
}

const POPULAR_ACTORS: Actor[] = [
  {
    id: "blf62maenLRO8Rsfv",
    name: "Facebook Topic Analyzer",
    description: "Extracts trending topics from Facebook",
  },
  {
    id: "apify/google-trends",
    name: "Google Trends Scraper",
    description: "Extracts data from Google Trends",
  },
  {
    id: "apify/twitter-scraper",
    name: "Twitter Scraper",
    description: "Extracts tweets and trends from Twitter",
  },
];

const ActorSelector: React.FC<ActorSelectorProps> = ({
  currentActorId,
  onActorChange,
}) => {
  const [customActorId, setCustomActorId] = useState("");
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);

  useEffect(() => {
    const actor = POPULAR_ACTORS.find((a) => a.id === currentActorId);
    setSelectedActor(actor || null);
    
    if (!actor) {
      setCustomActorId(currentActorId);
    }
  }, [currentActorId]);

  const handleActorSelect = (actorId: string) => {
    onActorChange(actorId);
  };

  const handleCustomActorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customActorId.trim()) {
      onActorChange(customActorId.trim());
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Apify Actor Configuration
      </h2>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-2">Popular Actors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {POPULAR_ACTORS.map((actor) => (
            <div
              key={actor.id}
              onClick={() => handleActorSelect(actor.id)}
              className={`cursor-pointer border rounded-md p-3 ${
                currentActorId === actor.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
            >
              <div className="font-medium text-sm">{actor.name}</div>
              <div className="text-xs text-gray-500 mt-1">{actor.description}</div>
              <div className="text-xs font-mono text-gray-400 mt-2 truncate">
                {actor.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">Custom Actor</h3>
        <form onSubmit={handleCustomActorSubmit} className="flex space-x-2">
          <div className="flex-grow">
            <input
              type="text"
              value={customActorId}
              onChange={(e) => setCustomActorId(e.target.value)}
              placeholder="Enter Apify actor ID"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="mt-6 bg-gray-50 rounded p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Actor</h3>
        {selectedActor ? (
          <div>
            <div className="font-medium text-sm">{selectedActor.name}</div>
            <div className="text-xs text-gray-500 mt-1">{selectedActor.description}</div>
          </div>
        ) : (
          <div className="text-sm">
            <span className="font-medium">Custom Actor:</span>{" "}
            <span className="font-mono">{currentActorId}</span>
          </div>
        )}
        <div className="mt-2">
          <a
            href={`https://apify.com/store?search=${currentActorId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            View in Apify Store
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ActorSelector; 