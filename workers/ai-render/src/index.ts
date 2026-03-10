interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

interface RenderRequest {
  roomImage: string;
  sofaImage: string;
  placement?: 'center' | 'left' | 'right' | 'against-wall';
}

const PLACEMENT_HINTS: Record<string, string> = {
  center: 'Place the sofa in the center of the room, facing the viewer.',
  left: 'Place the sofa on the left side of the room.',
  right: 'Place the sofa on the right side of the room.',
  'against-wall': 'Place the sofa against the back wall of the room.',
};

const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function corsHeaders(origin: string, allowed: string[]): HeadersInit {
  const isAllowed = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/** Strip `data:image/...;base64,` prefix if present */
function stripDataPrefix(b64: string): { data: string; mimeType: string } {
  const match = b64.match(/^data:(image\/\w+);base64,(.+)$/s);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/png', data: b64 };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const origin = request.headers.get('Origin') ?? '';
    const headers = corsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/render') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = (await request.json()) as RenderRequest;

      if (!body.roomImage || !body.sofaImage) {
        return new Response(
          JSON.stringify({ error: 'roomImage and sofaImage are required' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      // Rough size check (~20MB limit for both images combined)
      const totalSize = body.roomImage.length + body.sofaImage.length;
      if (totalSize > 20_000_000) {
        return new Response(
          JSON.stringify({ error: 'Images too large. Please use smaller images.' }),
          { status: 413, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const placement = body.placement ?? 'center';
      const placementHint = PLACEMENT_HINTS[placement] ?? PLACEMENT_HINTS.center;

      const prompt = [
        'You are an expert interior designer and photorealistic renderer.',
        'Composite the sofa from the second image into the room shown in the first image.',
        'The sofa should look naturally placed with correct perspective, lighting, and shadows that match the room.',
        "Maintain the room's existing lighting, color temperature, and atmosphere.",
        "The sofa should cast soft shadows on the floor consistent with the room's light sources.",
        placementHint,
        'The result must be photorealistic — indistinguishable from a real photo.',
      ].join(' ');

      const room = stripDataPrefix(body.roomImage);
      const sofa = stripDataPrefix(body.sofaImage);

      const geminiResponse = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: room.mimeType,
                    data: room.data,
                  },
                },
                {
                  inline_data: {
                    mime_type: sofa.mimeType,
                    data: sofa.data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        console.error('Gemini error:', geminiResponse.status, errBody);
        return new Response(
          JSON.stringify({ error: 'AI generation failed. Please try again.' }),
          { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const result = (await geminiResponse.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
              // Gemini returns camelCase in responses
              inlineData?: { mimeType: string; data: string };
            }>;
          };
        }>;
      };

      // Find the image part in the response (Gemini uses camelCase: inlineData)
      const parts = result.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData?.data);

      if (!imagePart?.inlineData) {
        console.error('No image in Gemini response:', JSON.stringify(result).slice(0, 500));
        return new Response(
          JSON.stringify({ error: 'No image returned from AI. Please try again.' }),
          { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ image: imagePart.inlineData.data }),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
  },
};
