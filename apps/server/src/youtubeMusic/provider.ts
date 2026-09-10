import { Innertube, UniversalCache } from "youtubei.js";

export interface YouTubeMusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string;
}

export interface YouTubeMusicStream {
  videoId: string;
  url: string;
  mimeType: string;
  bitrate?: number;
  contentLength?: number;
}

let clientPromise: Promise<Innertube> | undefined;

function getClient(): Promise<Innertube> {
  clientPromise ??= Innertube.create({ cache: new UniversalCache(false) });
  return clientPromise;
}

/** Search YouTube Music for songs. */
export async function searchYouTubeMusic(query: string, limit = 20): Promise<YouTubeMusicTrack[]> {
  const yt = await getClient();
  const result = await yt.music.search(query, { type: "song" });
  const songs = result.songs?.contents ?? [];

  return songs.slice(0, limit).map((song: any) => ({
    id: song.id,
    title: song.title ?? "Unknown title",
    artist: song.artists?.map((a: any) => a.name).filter(Boolean).join(", ") ?? "Unknown artist",
    duration: song.duration?.seconds ?? 0,
    thumbnail: song.thumbnails?.[0]?.url,
  }));
}

/** Resolve a short-lived direct audio URL. Nothing is downloaded or stored. */
export async function resolveYouTubeMusicStream(videoId: string): Promise<YouTubeMusicStream> {
  const yt = await getClient();
  const info = await yt.getBasicInfo(videoId, { client: "YTMUSIC" });
  const format = info.chooseFormat({ type: "audio", quality: "best" });

  if (!format) throw new Error(`No playable audio format found for ${videoId}`);

  const url = await format.decipher(yt.session.player);
  if (!url) throw new Error(`Could not resolve a playable URL for ${videoId}`);

  return {
    videoId,
    url,
    mimeType: format.mime_type ?? "audio/webm",
    bitrate: format.bitrate,
    contentLength: format.content_length,
  };
}
