"use client";

import { CameraErrorKind } from "@/hooks/useCamera";

interface Props {
  errorKind: CameraErrorKind;
  onRetry: () => void;
  onBack: () => void;
}

const COPY: Record<CameraErrorKind, { title: string; body: string }> = {
  "permission-denied": {
    title: "We need camera access",
    body: "Looks like camera permission was denied. Check your browser's site settings and allow camera access, then try again.",
  },
  "not-found": {
    title: "No camera found",
    body: "We couldn't find a camera on this device. Plug one in or try a different device.",
  },
  "not-supported": {
    title: "Camera isn't supported here",
    body: "This browser doesn't support camera capture. Try the latest Chrome, Safari, or Edge.",
  },
  "insecure-context": {
    title: "This page needs HTTPS",
    body: "Camera access only works on a secure (https://) connection or localhost. Open this app over HTTPS and try again.",
  },
  unknown: {
    title: "Something went wrong",
    body: "We couldn't start the camera. Please try again.",
  },
};

export default function PermissionError({ errorKind, onRetry, onBack }: Props) {
  const copy = COPY[errorKind];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="animate-float text-7xl">📷</div>
      <h1 className="font-display text-2xl text-girl-700">{copy.title}</h1>
      <p className="max-w-sm text-base text-slate-600">{copy.body}</p>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-full border-2 border-slate-300 bg-white px-6 py-3 font-bold text-slate-500 shadow-sm transition active:scale-95"
        >
          Go back
        </button>
        <button
          onClick={onRetry}
          className="rounded-full bg-gradient-to-r from-girl-400 to-boy-400 px-6 py-3 font-bold text-white shadow-lg transition active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
