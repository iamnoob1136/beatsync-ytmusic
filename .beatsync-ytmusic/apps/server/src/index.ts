import { ADMIN_SECRET, IS_DEMO_MODE } from "@/demo";
import { BackupManager } from "@/managers/BackupManager";
import { getActiveRooms } from "@/routes/active";
import { handleGetDefaultAudio } from "@/routes/default";
import { handleServeAudio } from "@/routes/demoAudio";
import { handleDiscover } from "@/routes/discover";
import { handleHealth } from "@/routes/health";
import { handleRoot } from "@/routes/root";
import { handleStats } from "@/routes/stats";
import { handleGetPresignedURL, handleUploadComplete } from "@/routes/upload";
import { handleWebSocketUpgrade } from "@/routes/websocket";
import { handleYouTubeStream } from "@/routes/youtubeStream";
import { handleClose, handleMessage, handleOpen } from "@/routes/websocketHandlers";
import { corsHeaders, errorResponse } from "@/utils/responses";
import type { WSData } from "@/utils/websocket";

const serverPort = Number(process.env.PORT ?? 8080);

const server = Bun.serve<WSData>({
  hostname: "0.0.0.0",
  port: serverPort,
  async fetch(req, server) {
    const start = performance.now();
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    let response: Response;
    try {
      if (IS_DEMO_MODE && url.pathname.startsWith("/audio/")) {
        response = handleServeAudio(url.pathname);
      } else {
        switch (url.pathname) {
          case "/": response = handleRoot(req); break;
          case "/ws": return handleWebSocketUpgrade(req, server);
          case "/youtube/stream": response = await handleYouTubeStream(req); break;
          case "/upload/get-presigned-url":
            response = IS_DEMO_MODE ? errorResponse("Uploads disabled in demo mode", 403) : await handleGetPresignedURL(req);
            break;
          case "/upload/complete":
            response = IS_DEMO_MODE ? errorResponse("Uploads disabled in demo mode", 403) : await handleUploadComplete(req, server);
            break;
          case "/stats": response = await handleStats(); break;
          case "/default": response = await handleGetDefaultAudio(req); break;
          case "/active-rooms": response = getActiveRooms(req); break;
          case "/discover": response = handleDiscover(req); break;
          case "/health": response = handleHealth(); break;
          default: response = errorResponse("Not found", 404); break;
        }
      }
    } catch (error) {
      const durationMs = (performance.now() - start).toFixed(1);
      console.error(`[${new Date().toISOString()}] ${req.method} ${url.pathname} 500 ${durationMs}ms - Unhandled error:`, error);
      return errorResponse("Internal server error", 500);
    }

    const durationMs = (performance.now() - start).toFixed(1);
    console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname} ${response.status} ${durationMs}ms`);
    return response;
  },
  websocket: {
    open(ws) { handleOpen(ws, server); },
    message(ws, message) { void handleMessage(ws, message, server); },
    close(ws) { handleClose(ws, server); },
  },
});

console.log(`HTTP listening on http://${server.hostname}:${server.port}`);
if (IS_DEMO_MODE) console.log(`🔑 Admin secret: ${ADMIN_SECRET}`);

if (!IS_DEMO_MODE) {
  BackupManager.restoreState().catch((error) => console.error("Failed to restore state on startup:", error));
  setInterval(() => {
    BackupManager.backupState().catch((error) => console.error("Failed to perform periodic backup:", error));
  }, 60 * 1000);
}

const shutdown = async () => {
  console.log("\n⚠️ Shutting down...");
  void server.stop();
  if (!IS_DEMO_MODE) await BackupManager.backupState();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
process.on("uncaughtException", (error) => { console.error("UNCAUGHT EXCEPTION:", error); process.exit(1); });
process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
