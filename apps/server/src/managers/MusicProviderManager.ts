import {
  RawSearchResponseSchema,
  SearchParamsSchema,
  StreamResponseSchema,
  TrackParamsSchema,
} from "@beatsync/shared/";
import type { z } from "zod";
import { searchYouTubeMusic, resolveYouTubeMusicStream } from "../youtubeMusic/provider";

// Beatsync's shared track model uses numeric IDs. YouTube Music uses string
// video IDs, so keep a process-local lookup table from Beatsync ID -> video ID.
const youtubeIds = new Map<number, string>();

function stableNumericId(videoId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < videoId.length; i++) {
    hash ^= videoId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export class MusicProviderManager {
  async search(query: string, offset = 0): Promise<z.infer<typeof RawSearchResponseSchema>> {
    const { q, offset: validOffset } = SearchParamsSchema.parse({ q: query, offset });
    const tracks = await searchYouTubeMusic(q, 20 + validOffset);
    const page = tracks.slice(validOffset, validOffset + 20);

    const items = page.map((track) => {
      const id = stableNumericId(track.id);
      youtubeIds.set(id, track.id);
      const artistId = stableNumericId(`artist:${track.artist}`);
      const albumId = `yt:${track.id}`;
      const thumbnail = track.thumbnail ?? "";

      return {
        id,
        title: track.title,
        version: null,
        duration: track.duration,
        parental_warning: false,
        track_number: 0,
        released_at: undefined,
        isrc: null,
        performer: { id: artistId, name: track.artist },
        album: {
          id: albumId,
          title: track.title,
          duration: track.duration,
          parental_warning: false,
          release_date_original: "",
          image: { small: thumbnail, thumbnail, large: thumbnail, back: null },
          artists: [{ id: artistId, name: track.artist, roles: ["main"] }],
        },
      };
    });

    return RawSearchResponseSchema.parse({
      data: {
        tracks: {
          limit: 20,
          offset: validOffset,
          total: tracks.length,
          items,
        },
      },
    });
  }

  async stream(trackId: number) {
    const { id } = TrackParamsSchema.parse({ id: trackId });
    const videoId = youtubeIds.get(id);
    if (!videoId) {
      throw new Error(`YouTube Music track ${id} is no longer resolvable; search again.`);
    }

    const stream = await resolveYouTubeMusicStream(videoId);
    return StreamResponseSchema.parse({ success: true, data: { url: stream.url } });
  }
}

export const MUSIC_PROVIDER_MANAGER = new MusicProviderManager();
