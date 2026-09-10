# Beatsync + YouTube Music

A Beatsync variant designed to use YouTube Music as a streaming source instead of downloading provider tracks into R2.

This repository contains the integration overlay for the current `freeman-jiang/beatsync` codebase. The implementation uses the MIT-licensed `youtubei.js` package for YouTube/InnerTube access and does not copy code from the GPL-3.0 Metrolist project.

## Important

YouTube playback URLs are temporary. The integration therefore resolves a fresh stream URL when a track is queued rather than treating a stream URL as a permanent asset.

## Upstream

- Beatsync: https://github.com/freeman-jiang/beatsync
- YouTube.js / youtubei.js: https://github.com/LuanRT/YouTube.js
- Metrolist (reference only): https://github.com/MetrolistGroup/Metrolist

## Integration design

`SEARCH_MUSIC` continues to return Beatsync's existing track model. The provider maintains an in-memory mapping from the numeric Beatsync track id to the YouTube video id. `STREAM_MUSIC` resolves the YouTube audio format and returns a stream URL.

Unlike the upstream handler, the YouTube path must not download the entire response and upload it to R2. Instead, it should add the temporary stream URL as the room audio source.

## Setup

The provider requires `youtubei.js` in `apps/server` and can run without a YouTube API key. Because this relies on YouTube/InnerTube behavior rather than an official public streaming API, breakage can occur when YouTube changes its internal API.

Use this integration only in accordance with the services' terms and applicable law.
