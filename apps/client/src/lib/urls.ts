/**
 * Resolves API and WebSocket base URLs.
 *
 * NEXT_PUBLIC_API_URL is enough for separate Render services; the WebSocket
 * URL is derived automatically from the API URL when NEXT_PUBLIC_WS_URL is
 * not provided. Otherwise the app falls back to same-origin mode.
 */

let cached: { apiUrl: string; wsUrl: string } | null = null;

function resolve(): { apiUrl: string; wsUrl: string } {
  if (cached) return cached;

  const envApi = process.env.NEXT_PUBLIC_API_URL;
  const envWs = process.env.NEXT_PUBLIC_WS_URL;

  if (envApi) {
    const wsUrl = envWs ?? `${envApi.replace(/^http/, "ws")}/ws`;
    cached = { apiUrl: envApi, wsUrl };
  } else if (typeof window !== "undefined") {
    const { protocol, host } = window.location;
    const isSecure = protocol === "https:";
    cached = {
      apiUrl: `${protocol}//${host}`,
      wsUrl: `${isSecure ? "wss" : "ws"}://${host}/ws`,
    };
  } else {
    return { apiUrl: "", wsUrl: "" };
  }

  return cached;
}

export function getApiUrl(): string {
  return resolve().apiUrl;
}

export function getWsUrl(): string {
  return resolve().wsUrl;
}
