"use client";

import { useCallback, useState } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import CameraScreen from "@/components/CameraScreen";
import ResultScreen from "@/components/ResultScreen";
import { useCamera } from "@/lib/useCamera";
import type { CapturedPhoto, Screen, Theme } from "@/types";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [theme, setTheme] = useState<Theme>("girl");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);

  // Owned at this top level (rather than inside CameraScreen) so the very
  // first getUserMedia call can be fired synchronously from the Welcome
  // screen's "Start Camera" click handler — required for iOS Safari to
  // reliably show its permission prompt — while the resulting stream is
  // still available once we navigate to the camera screen and its <video>
  // element mounts.
  const camera = useCamera();

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
          onThemeChange={setTheme}
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
