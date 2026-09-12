import { MUSIC_PROVIDER_MANAGER } from "@/managers/MusicProviderManager";
import { corsHeaders, errorResponse } from "@/utils/responses";

export async function handleYouTubeStream(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const trackId = Number(url.searchParams.get("trackId"));
  if (!Number.isSafeInteger(trackId) || trackId < 1) {
    return errorResponse("Invalid YouTube track ID", 400);
  }

  try {
    const response = await MUSIC_PROVIDER_MANAGER.fetchStream(trackId);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error("YouTube stream error:", error);
    return errorResponse(error instanceof Error ? error.message : "Unable to stream track", 502);
  }
}
