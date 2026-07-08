# Background video assets

Drop the **Higgsfield**-generated background clip here. The `BgVideo.astro`
component (`site/src/components/BgVideo.astro`) picks it up automatically.

## Files to add

| File | Required | Notes |
|---|---|---|
| `hero-bg.mp4` | yes | H.264 / MP4 — the main source. |
| `hero-bg.webm` | optional | VP9 / WebM — served first to modern browsers for a smaller payload. |
| `hero-bg-poster.jpg` | recommended | Still frame shown before the video loads and when `prefers-reduced-motion` is on. |

## Recommended export settings (from Higgsfield)

- **Resolution:** 1920×1080 (or 2560×1440 for crisp large screens)
- **Length:** 8–20s, **seamless loop** (first and last frames match)
- **Bitrate / size:** keep MP4 under ~6 MB so the page stays fast
- **Audio:** none (the video is muted/`autoplay`)
- **Look:** subtle, slow motion — a tactical pitch, stadium light, drifting
  particles, etc. Avoid hard cuts or fast camera moves behind text.

## Preview

A live demo lives at `/ui/proto/bg-video/` (`site/src/pages/proto/bg-video.astro`).
Once you add `hero-bg.mp4` here it will appear there immediately.

## Wiring it onto the real hero (when you're ready)

In `site/src/pages/index.astro`, wrap the hero copy:

```astro
---
import BgVideo from "../components/BgVideo.astro";
---
<BgVideo src="video/hero-bg.mp4" poster="video/hero-bg-poster.jpg" overlay={0.62} minHeight="92vh">
  <div class="container hero-inner">
    <!-- existing hero pill / h1 / sub / CTAs go here -->
  </div>
</BgVideo>
```

Give the foreground text a light treatment over the dark video (the demo page
shows the pattern with `.bgv-hero`).
