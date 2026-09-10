import {
  RawSearchResponseSchema,
  SearchParamsSchema,
  TrackParamsSchema,
} from "@beatsync/shared/";
import type { z } from "zod";
import { Innertube, UniversalCache } from "youtubei.js";

export class MusicProviderManager {
  private youtube: Promise<Innertube> | null = null;
  private readonly tracks = new Map<number, string>();

  private getYouTube(): Promise<Innertube> {
    if (!this.youtube) {
      this.youtube = Innertube.create({ cache: new UniversalCache(false) });
    }
    return this.youtube;
  }

  private makeTrackId(videoId: string): number {
    let hash = 0;
    for (let i = 0; i < videoId.length; i += 1) {
      hash = (hash * 31 + videoId.charCodeAt(i)) | 0;
    }
    let id = Math.abs(hash) || 1;
    while (this.tracks.has(id) && this.tracks.get(id) !== videoId) id += 1;
    this.tracks.set(id, videoId);
    return id;
  }

  async search(query: string, offset = 0): Promise<z.infer<typeof RawSearchResponseSchema>> {
    const { q, offset: validOffset } = SearchParamsSchema.parse({ q: query, offset });
    const youtube = await this.getYouTube();

    const result = await youtube.search(q, { type: "video" });
    const items = ((result as any).results ?? (result as any).items ?? []) as any[];
    const videos = items.filter((item) => item?.type === "Video" || item?.video_id || item?.id);
    const page = videos.slice(validOffset, validOffset + 20);

    const tracks = page.map((item) => {
      const videoId = String(item.video_id ?? item.id);
      const title = String(item.title?.text ?? item.title ?? "YouTube Music track");
      const artist = String(item.author?.name ?? item.author?.text ?? "YouTube");
      const duration = Number(item.duration_seconds ?? item.duration?.seconds ?? 0) || 0;
      const thumbnail = String(item.best_thumbnail?.url ?? item.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      const id = this.makeTrackId(videoId);

      return {
        isrc: null,
        performer: { name: artist, id: this.makeTrackId(`artist:${artist}`) },
        album: {
          image: { small: thumbnail, thumbnail, large: thumbnail, back: null },
          artists: [{ id: this.makeTrackId(`artist:${artist}`), name: artist, roles: ["main"] }],
          title: "YouTube Music",
          duration,
          parental_warning: false,
          id: videoId,
          release_date_original: "",
        },
        track_number: 0,
        title,
        version: null,
        duration,
        parental_warning: false,
        id,
      };
    });

    return RawSearchResponseSchema.parse({
      data: {
        tracks: {
          limit: 20,
          offset: validOffset,
          total: videos.length,
          items: tracks,
        },
      },
    });
  }

  private getVideoId(trackId: number): string {
    const { id } = TrackParamsSchema.parse({ id: trackId });
    const videoId = this.tracks.get(id);
    if (!videoId) throw new Error("Track has expired. Search for it again.");
    return videoId;
  }

  async stream(trackId: number) {
    const videoId = this.getVideoId(trackId);
    return {
      success: true as const,
      data: { url: `/youtube/stream?trackId=${encodeURIComponent(trackId)}` },
      videoId,
    };
  }

  async fetchStream(trackId: number): Promise<Response> {
    const videoId = this.getVideoId(trackId);
    const youtube = await this.getYouTube();
    const info = await youtube.getBasicInfo(videoId);
    const format = info.chooseFormat({ quality: "best", type: "audio" });
    const url = format.url ?? (await format.decipher(youtube.session.player));
    if (!url) throw new Error("YouTube did not provide an audio stream");

    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!upstream.ok || !upstream.body) {
      throw new Error(`YouTube stream failed: ${upstream.status}`);
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/mp4");
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    headers.set("Cache-Control", "no-store");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, { status: 200, headers });
  }
}

export const MUSIC_PROVIDER_MANAGER = new MusicProviderManager();
