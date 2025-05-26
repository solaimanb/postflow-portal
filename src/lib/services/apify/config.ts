interface ApifyConfig {
  apiKey: string;
  actorId: string;
  baseUrl: string;
}

const config: ApifyConfig = {
  apiKey: process.env.NEXT_PUBLIC_APIFY_API_KEY || "",
  actorId: process.env.NEXT_PUBLIC_APIFY_ACTOR_ID || "blf62maenLRO8Rsfv",
  baseUrl: "https://api.apify.com/v2",
};

export default config;
