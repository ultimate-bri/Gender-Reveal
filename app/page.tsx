"use client";

import { useCallback, useEffect, useState } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import CameraScreen from "@/components/CameraScreen";
import ResultScreen from "@/components/ResultScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { useCamera } from "@/lib/useCamera";
import { preloadDecorations } from "@/lib/chromaKey";
import { allDecorationSources } from "@/lib/decorations";
import type { CapturedPhoto, Screen, Theme } from "@/types";

// Floor on how long the loading screen stays up, so on a fast/cached load
// it still reads as an intentional splash rather than a one-frame flicker.
const MIN_LOADING_MS = 500;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [theme, setTheme] = useState<Theme>("girl");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);

  // Owned at this top level (rather than inside CameraScreen) so the very
  // first getUserMedia call can be fired synchronously from the Welcome
  // screen's "Start Camera" click handler — required for iOS Safari to
  // reliably show its permission prompt — while the resulting stream is
  // still available once we navigate to the camera screen and its <video>
  // element mounts.
  const camera = useCamera();

  // Do the one-time, non-gesture-gated setup work up front — chroma-keying
  // every sticker and waiting on web fonts — behind a loading screen,
  // instead of letting it happen lazily the first time a theme is chosen
  // or the shutter is pressed (which is what used to make those first
  // interactions feel laggy/unresponsive).
  useEffect(() => {
    let cancelled = false;

    const ready = Promise.all([
      preloadDecorations(allDecorationSources()),
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready
        : Promise.resolve(),
    ]);
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));

    Promise.all([ready, minDelay]).then(() => {
      if (!cancelled) setScreen("welcome");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = useCallback(async () => {
    await camera.start();
    setScreen("camera");
  }, [camera]);

  const handleCaptured = useCallback((captured: CapturedPhoto) => {
    setPhoto(captured);
    setScreen("result");
  }, []);

  const handleRetake = useCallback(() => {
    setPhoto(null);
    setScreen("camera");
  }, []);

  const handleExit = useCallback(() => {
    setPhoto(null);
    camera.stop();
    setScreen("welcome");
  }, [camera]);

  return (
    <div id="app-shell">
      {screen === "loading" && <LoadingScreen />}
      {screen === "welcome" && (
        <WelcomeScreen
          onStart={handleStart}
          isStarting={camera.isStarting}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}
      {screen === "camera" && (
        <CameraScreen
          camera={camera}
          theme={theme}
          onCaptured={handleCaptured}
          onExit={handleExit}
        />
      )}
      {screen === "result" && photo && (
        <ResultScreen photo={photo} onRetake={handleRetake} onDone={handleExit} />
      )}
    </div>
  );
}

