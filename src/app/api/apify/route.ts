import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy requests to Apify API
 * This helps avoid CORS issues when calling Apify API from the browser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, method = 'GET', payload, token } = body;
    
    console.log(`[APIFY PROXY] Request to endpoint: ${endpoint}`);
    console.log(`[APIFY PROXY] Method: ${method}`);
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    const apiKey = token || process.env.NEXT_PUBLIC_APIFY_API_KEY;
    const baseUrl = 'https://api.apify.com/v2';
    
    // Ensure the endpoint doesn't start with a slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${baseUrl}/${cleanEndpoint}?token=${apiKey}`;
    console.log(`[APIFY PROXY] Full URL: ${url}`);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (payload && (method === 'POST' || method === 'PUT')) {
      // For run-sync endpoints, send the payload directly as the body
      if (cleanEndpoint.includes('run-sync')) {
        options.body = JSON.stringify(payload);
        console.log(`[APIFY PROXY] Direct payload for sync endpoint:`, JSON.stringify(payload).substring(0, 500));
      } else {
        // For regular endpoints, use the standard format with 'run' wrapper
        options.body = JSON.stringify({ run: { input: payload } });
        console.log(`[APIFY PROXY] Standard payload with run wrapper:`, JSON.stringify({ run: { input: payload } }).substring(0, 500));
      }
    }

    console.log(`[APIFY PROXY] Sending request to Apify...`);
    const response = await fetch(url, options);
    console.log(`[APIFY PROXY] Response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`[APIFY PROXY] Response body: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`);
    
    // Parse JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[APIFY PROXY] Error parsing JSON response:', e);
      return NextResponse.json(
        { error: 'Invalid JSON response from Apify API', rawResponse: responseText },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[APIFY PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 