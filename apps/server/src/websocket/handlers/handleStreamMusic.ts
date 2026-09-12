import { IS_DEMO_MODE } from "@/demo";
import { globalManager } from "@/managers";
import { MUSIC_PROVIDER_MANAGER } from "@/managers/MusicProviderManager";
import { sendBroadcast } from "@/utils/responses";
import type { HandlerFunction } from "@/websocket/types";
import type { ExtractWSRequestFrom } from "@beatsync/shared";

export const handleStreamMusic: HandlerFunction<ExtractWSRequestFrom["STREAM_MUSIC"]> = async ({ ws, message, server }) => {
  if (IS_DEMO_MODE) return;
  const roomId = ws.data.roomId;
  const room = globalManager.getRoom(roomId);
  if (!room) return;

  const trackId = message.trackId.toString();
  if (room.hasActiveStreamJob(trackId)) return;

  room.addStreamJob(trackId);
  sendBroadcast({ server, roomId, message: { type: "STREAM_JOB_UPDATE", activeJobCount: room.getActiveStreamJobCount() } });

  try {
    const streamResponse = await MUSIC_PROVIDER_MANAGER.stream(message.trackId);
    if (!streamResponse.success) throw new Error("Failed to resolve YouTube Music track");

    // The URL is a server-side proxy. Audio is streamed from YouTube through the server
    // and is never written to R2 or another persistent store.
    const sources = room.addAudioSource({ url: streamResponse.data.url });

    sendBroadcast({
      server,
      roomId,
      message: { type: "ROOM_EVENT", event: { type: "SET_AUDIO_SOURCES", sources } },
    });
  } catch (error) {
    console.error("Error resolving YouTube Music stream:", error);
  } finally {
    room.removeStreamJob(trackId);
    sendBroadcast({ server, roomId, message: { type: "STREAM_JOB_UPDATE", activeJobCount: room.getActiveStreamJobCount() } });
  }
};
