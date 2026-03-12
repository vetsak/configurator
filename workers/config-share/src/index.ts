interface Env {
  CONFIG_STORE: KVNamespace;
}

interface ConfigPayload {
  modules: unknown[];
  material: { fabricId: string; colourId: string };
  presetId?: string;
}

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const byte of bytes) {
    id += chars[byte % chars.length];
  }
  return id;
}

const TTL_SECONDS = 2_592_000; // 30 days

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // POST /config — store a configuration
    if (request.method === 'POST' && url.pathname === '/config') {
      try {
        const body = (await request.json()) as ConfigPayload;

        if (!body.modules || !Array.isArray(body.modules)) {
          return jsonResponse({ error: 'modules (array) is required' }, 400);
        }
        if (!body.material || typeof body.material !== 'object') {
          return jsonResponse({ error: 'material (object) is required' }, 400);
        }

        const id = generateId();
        const kvKey = `config:${id}`;

        await env.CONFIG_STORE.put(kvKey, JSON.stringify(body), {
          expirationTtl: TTL_SECONDS,
        });

        const baseUrl = url.origin;
        return jsonResponse({
          id,
          url: `${baseUrl}/config/${id}`,
        });
      } catch (err) {
        console.error('POST /config error:', err);
        return jsonResponse({ error: 'Invalid request body' }, 400);
      }
    }

    // GET /config/:id — retrieve a configuration
    const match = url.pathname.match(/^\/config\/([a-z0-9]{8})$/);
    if (request.method === 'GET' && match) {
      const id = match[1];
      const kvKey = `config:${id}`;
      const value = await env.CONFIG_STORE.get(kvKey);

      if (!value) {
        return jsonResponse({ error: 'Configuration not found' }, 404);
      }

      return jsonResponse(JSON.parse(value));
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
