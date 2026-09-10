# Beatsync + YouTube Music 🎵

A Beatsync variant designed to use YouTube Music as a streaming source instead of downloading provider tracks into R2.

## What you get

- YouTube/YouTube Music search from the existing Beatsync search UI.
- Audio resolved through YouTube.js / InnerTube.
- Audio proxied through the Beatsync server without persistent storage.
- Existing Beatsync synchronized multi-device playback.
- No YouTube API key required.

## Automatic setup

The GitHub Actions workflow assembles the complete upstream Beatsync source and applies the YouTube Music integration automatically. You do not need to manually copy source files.

The existing Beatsync player buffers the audio into Web Audio for precise synchronization. The important difference is that the server does **not** download the track into R2 or another persistent music library.

## Upstream / dependencies

- Beatsync: https://github.com/freeman-jiang/beatsync
- YouTube.js / youtubei.js: https://github.com/LuanRT/YouTube.js
- Metrolist was used only as architectural reference; its GPL-3.0 code is not copied here.

YouTube/InnerTube behavior can change without notice, so occasional maintenance may be required. Use this software in accordance with YouTube's terms and applicable law.
