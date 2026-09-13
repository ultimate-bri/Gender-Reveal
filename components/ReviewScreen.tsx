"use client";

import { useEffect, useState } from "react";
import { compositeStrip, CompositeResult } from "@/lib/compositeStrip";
import { CapturedPhoto, Gender } from "@/lib/types";
import SaveModal from "./SaveModal";

interface Props {
  photos: CapturedPhoto[];
  gender: Gender;
  onRetake: () => void;
  onStartOver: () => void;
}

export default function ReviewScreen({
  photos,
  gender,
  onRetake,
  onStartOver,
}: Props) {
  const [result, setResult] = useState<CompositeResult | null>(null);
  const [error, setError] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(false);

    compositeStrip(photos, gender)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [photos, gender]);

  const accent = gender === "girl" ? "girl" : "boy";

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10">
      <h1 className="font-display text-3xl text-girl-600">
        Here&apos;s your strip!
      </h1>

      <div className="w-full max-w-[280px]">
        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-sm font-bold text-red-500">
            Something went wrong putting your strip together. Please retake
            your photos.
          </div>
        )}

        {!error && !result && (
          <div className="flex aspect-[1/3] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-white/60">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
            <p className="text-sm font-bold text-slate-500">
              Building your strip…
            </p>
          </div>
        )}

        {result && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.dataUrl}
            alt="Your gender reveal photo strip"
            className="w-full rounded-2xl strip-shadow"
          />
        )}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={!result}
          className={`w-full rounded-full px-6 py-4 font-display text-lg text-white shadow-xl transition active:scale-95 disabled:opacity-40 ${
            accent === "girl"
              ? "bg-gradient-to-r from-girl-500 to-girl-400"
              : "bg-gradient-to-r from-boy-500 to-boy-400"
          }`}
        >
          Save Photo Strip
        </button>
        <button
          onClick={onRetake}
          className="w-full rounded-full border-2 border-slate-300 bg-white px-6 py-3 font-bold text-slate-600 active:scale-95"
        >
          Retake photos
        </button>
        <button
          onClick={onStartOver}
          className="w-full text-sm font-bold text-slate-400 underline-offset-2 active:underline"
        >
          Start over
        </button>
      </div>

      {showSaveModal && result && (
        <SaveModal
          dataUrl={result.dataUrl}
          blob={result.blob}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
