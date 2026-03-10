export type Placement = 'center' | 'left' | 'right' | 'against-wall';

interface RenderRequest {
  roomImage: string;
  sofaImage: string;
  placement?: Placement;
}

interface RenderResponse {
  image: string;
}

const AI_RENDER_URL = process.env.NEXT_PUBLIC_AI_RENDER_URL;

export async function requestAiRender(req: RenderRequest): Promise<RenderResponse> {
  if (!AI_RENDER_URL) {
    throw new Error('AI rendering is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${AI_RENDER_URL}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `Request failed (${response.status})`
      );
    }

    return (await response.json()) as RenderResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
