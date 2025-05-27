import { NextRequest, NextResponse } from "next/server";
import config from "../../../lib/config";

/**
 * API route to proxy requests to Apify API
 * This helps avoid CORS issues when calling Apify API from the browser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, method = "GET", payload, token } = body;

    console.log(`[APIFY PROXY] Request to endpoint: ${endpoint}`);
    console.log(`[APIFY PROXY] Method: ${method}`);

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint parameter" },
        { status: 400 }
      );
    }

    // Use token from request, fallback to config, then env var
    const apiKey =
      token || config.apify.apiKey || process.env.NEXT_PUBLIC_APIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key available" },
        { status: 400 }
      );
    }

    const baseUrl = "https://api.apify.com/v2";

    // Ensure the endpoint doesn't start with a slash
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.substring(1)
      : endpoint;
    const url = `${baseUrl}/${cleanEndpoint}`;
    console.log(`[APIFY PROXY] Full URL: ${url}`);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
    };

    if (payload && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(payload);
      console.log(
        `[APIFY PROXY] Request payload:`,
        JSON.stringify(payload).substring(0, 500)
      );
    }

    console.log(`[APIFY PROXY] Sending request to Apify...`);
    const response = await fetch(url, options);
    console.log(`[APIFY PROXY] Response status: ${response.status}`);

    const responseText = await response.text();
    console.log(
      `[APIFY PROXY] Response body: ${responseText.substring(0, 1000)}${
        responseText.length
      }`
    );

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[APIFY PROXY] Error parsing JSON response:", e);
      return NextResponse.json(
        {
          error: "Invalid JSON response from Apify API",
          rawResponse: responseText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[APIFY PROXY] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
