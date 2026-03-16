/**
 * Cloudflare Worker — Claude API Proxy for Grain & Grit Executive OS
 *
 * Deploy this to Cloudflare Workers (free tier) to proxy Claude API
 * requests from the browser, avoiding CORS issues.
 *
 * SETUP:
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this code and deploy
 * 3. Go to Settings → Variables → add ANTHROPIC_API_KEY with your key
 * 4. Copy your worker URL (e.g., https://gg-proxy.yourname.workers.dev)
 * 5. Paste that URL into the Chat settings in the app
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.text();

      // Use the API key from environment variable (set in Cloudflare dashboard)
      // Falls back to the key sent from the client
      const apiKey = env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'No API key configured' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
