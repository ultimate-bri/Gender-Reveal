# Gender Reveal Photobooth

A mobile-first, installable (PWA) photobooth built with Next.js 14 (App Router,
TypeScript). Guests pick Team Boy or Team Girl, take a countdown photo, and
get a framed keepsake with chroma-keyed party stickers and a thank-you
message — saved or shared straight from the browser.

## What I customized

- **Onesie hanging right at the photo seam, one color per team.** Moved it
  off the top of the strip (where it was overlapping the "Gender Reveal!"
  title) down to the seam between the first and second photo, so it reads
  as clipped to a little line strung between them, overlapping into both.
  It's also now split by team instead of always showing both colors: Team
  Girl gets just the pink onesie, Team Boy gets just the blue one — both
  cropped from the same source image at runtime rather than needing two
  separate files (`lib/decorations.ts`'s `cropX`/`cropWidth` fields on that
  entry; the crop + new `seam1-center` anchor are implemented in
  `lib/compositor.ts`).
- **Thank-you footer.** Replaced the `#GirlorBoy? #BabyShower` hashtags at
  the bottom of the strip with "Thank You for Coming!" / "– Mommy She &
  Daddy Bri", centered under the photos (`lib/compositor.ts`, footer
  section — plain text in a `fillText` call, easy to tweak).
- **Loading screen on launch.** The app used to drop you straight onto the
  Welcome screen while stickers were still being fetched and chroma-keyed
  in the background, so the first theme pick or shutter press could stall
  on that work. Now there's a short splash screen on launch that waits for
  every sticker to finish loading (plus the web fonts) before handing
  control to the Welcome screen (`components/LoadingScreen.tsx`, wired up
  in `app/page.tsx`).
- **Fixed the unresponsive-feeling flip-camera button.** Switching to the
  back camera restarts the whole camera stream, which takes a moment —
  but the flip button stayed clickable the whole time, so tapping it again
  mid-switch (because it "didn't seem to respond") could fire a second,
  overlapping camera request and leave things in a stuck state. The button
  is now disabled and shows a small spinner while a switch is in progress,
  so it's clear it's working and can't be double-tapped into a bad state
  (`lib/useCamera.ts`'s existing `isStarting` flag, now also wired into
  `components/CameraScreen.tsx`'s flip button).

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Camera access works over `http://localhost`
during development without extra setup.

```bash
npm run build
npm run start   # production server
```

> **Camera requires HTTPS in production.** `getUserMedia`, the File System
> Access API, and Web Share Level 2 are all gated behind a "secure context."
> Deploy behind TLS (Vercel, Netlify, or your own reverse proxy with a
> certificate) — plain `http://` on a real domain will silently fail with a
> permission/insecure-context error, which the app detects and explains to
> the user rather than failing silently.

## Project structure

```
app/
  layout.tsx          Root layout: fonts (Baloo 2 + Nunito), PWA metadata, viewport
  page.tsx             Screen state machine (loading -> welcome -> camera -> result)
  globals.css          Design tokens, 100dvh no-scroll shell, safe-area padding
components/
  WelcomeScreen.tsx     + .module.css
  CameraScreen.tsx      + .module.css   (preview, theme picker, countdown/flash, flip, fallback)
  ResultScreen.tsx       + .module.css   (final photo, Retake / Save-or-Share)
  LoadingScreen.tsx       + .module.css   (startup splash, shown until stickers + fonts are ready)
  ChromaKeyedImage.tsx   Reusable canvas component: renders any green-screen
                         sticker with the background keyed out, used for
                         decorative flourishes on Welcome/Camera as well as
                         inside the final composite
lib/
  useCamera.ts          getUserMedia hook: gesture-gated start, front/back
                         switch, typed errors
  chromaKey.ts           Green-screen removal (feathered edge + despill),
                         cached per source image
  compositor.ts          Canvas composition: crop/mirror capture, draw
                          decorations, footer text, frame border, export PNG
  decorations.ts          Theme -> sticker layout configuration
  saveShare.ts            Device-aware save: File System Access API /
                          Web Share Level 2 / <a download> fallback
  idb.ts                  Minimal IndexedDB helper (persists the chosen
                          "GenderReveal" folder handle across sessions)
types/
  index.ts                Shared app types
  browser-apis.d.ts       Ambient types for File System Access API + canShare,
                          which aren't fully covered by TypeScript's DOM lib
public/
  decorations/*.jpg       Your 9 uploaded sticker images (green-screen originals)
  icons/icon-192.png, icon-512.png    Generated placeholder PWA icons
  manifest.webmanifest
scripts/gen_icons.py       One-off script that generated the placeholder icons
                            (not used at runtime; re-run and replace the PNGs
                            in public/icons if you want your own artwork)
```

