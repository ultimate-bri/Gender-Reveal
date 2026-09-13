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

## Judgment calls / gaps I filled

The brief was thorough, but a few points were ambiguous or under-specified.
Here's what I decided and why:

1. **`showSaveFilePicker` vs. a persistent folder.** The brief asked for
   `window.showSaveFilePicker` *and* for a directory handle that's reused
   silently on every subsequent save. Those are two different APIs —
   `showSaveFilePicker` shows a save dialog per file and doesn't return a
   directory handle. I implemented the actual described *behavior* using
   `window.showDirectoryPicker`: the user picks a parent folder once, the app
   creates/reuses a `GenderReveal` subfolder inside it, and the handle is
   persisted in IndexedDB (with a permission re-check on every use, since
   granted handles can be revoked) so every later photo saves with zero
   prompts.
2. **Attached images are JPGs, not PNGs.** The brief called them "PNGs" but
   the uploaded files are `.jpg`. JPEG's lossy compression can leave faint
   color fringing right at the green/art edge. I compensated with a feathered
   alpha falloff plus a despill pass (pulling the green channel toward the
   red/blue average on partially-keyed edge pixels) rather than a hard
   cutout, which hides most compression artifacts. If you have true
   transparent-edge PNG masters, dropping them into `public/decorations/`
   (same filenames) will look even cleaner.
3. **Portrait output size.** Rather than trusting each device's raw
   `videoWidth`/`videoHeight` (which varies a lot and isn't reliably
   portrait, especially on desktop webcams), the compositor always crops to
   a fixed 1080×1440 (3:4) canvas using the same "cover" math as the live
   preview's `object-fit: cover`. This guarantees identical sticker layout,
   text size, and framing on every device instead of stretched or
   inconsistently-cropped output.
4. **Selfie mirroring on save.** The brief asked for a mirrored preview but
   didn't say whether the *saved* photo should also be mirrored. I mirrored
   the final front-camera photo to match what the user saw and posed for
   (the universal phone-selfie convention) — flipping it back at the very
   end would make people feel like the photo looks "backwards" relative to
   how they framed themselves. Photos from the back camera or the file-input
   fallback are never mirrored.
5. **iOS camera-permission timing.** The brief correctly flagged that
   `getUserMedia` must run inside a real click handler for iOS Safari. I took
   that a step further: the camera hook is instantiated at the top of the
   app (not inside the Camera screen), and the Welcome screen's "Start
   Camera" button calls `camera.start()` directly in its `onClick` — before
   the screen even transitions — so the permission request is never deferred
   into a post-render `useEffect`, which is the usual way this breaks on iOS.
6. **"No camera found" fallback capture.** The brief's fallback (`<input
   type="file" accept="image/*" capture="user">`) opens the *native* camera
   app on mobile, not a live in-page preview. Countdown/flash/live-preview
   only make sense for `getUserMedia`, so the fallback path skips straight
   from "Choose Photo" to the same countdown → flash → composite pipeline
   using the picked image instead of a video frame.
7. **Sticker arrangement per theme.** All 9 images are used, split across the
   two themes so each side of the reveal gets its own distinct corner
   collage (see `lib/decorations.ts` for exact placement/rotation) rather
   than repeating an identical layout with only the accent color changed.
8. **Next.js version.** The brief didn't pin a version. I initially scaffolded
   on 14.2.5 but caught that it's affected by a December 2025 critical RCE
   advisory in the App Router — pinned to the patched **14.2.35** instead.
9. **PWA icons.** No icon artwork was provided, so `scripts/gen_icons.py`
   generated simple placeholder balloon icons at 192px/512px. Swap in real
   artwork before shipping to a home screen for real.

## Browser support notes

- **File System Access API** (the "remembers your folder" save flow) is
  Chromium-only (desktop Chrome/Edge/Opera). Everywhere else — Safari,
  Firefox, all mobile browsers — the app automatically uses Web Share Level 2
  (if the device can share files) or a plain download as the next-best
  option. This fallback chain is automatic; there's nothing to configure.
- **Web Share Level 2 with files** needs iOS 15+ / a reasonably modern
  Android browser. Desktop browsers without `showDirectoryPicker` (Firefox,
  Safari) fall back straight to download.
- Camera flip (front/back) only appears when `enumerateDevices()` reports
  more than one camera, which requires having granted camera permission at
  least once (a browser-privacy limitation, not a bug in this app).
