# Beatsync YouTube Music

This repository assembles a full Beatsync build with YouTube Music search and streaming support.

## What it does

- Uses YouTube Music song search through YouTube.js / InnerTube.
- Resolves playable audio on the server and proxies it to the browser.
- Does not persist downloaded music files in R2 for playback.
- Keeps Beatsync's synchronized multi-device playback behavior.
- Builds the full upstream Beatsync source automatically in GitHub Actions.

## Deploy it

The repository includes `render.yaml` for Render. After the build workflow completes, connect this GitHub repository to Render and deploy the Blueprint. It creates the web client and server as two linked services; the client automatically receives the server's public URL.

Render web services support WebSockets, which Beatsync uses for synchronized rooms.

## Use on your devices

Open the deployed web URL in Chrome/Safari on your phone, tablet, or PC. For an app-like experience, use the browser's **Add to Home Screen** / **Install app** option.

## Development

The upstream project is MIT licensed. This integration also depends on `youtubei.js`, which is MIT licensed. YouTube content should be used in accordance with applicable YouTube terms and local law.
