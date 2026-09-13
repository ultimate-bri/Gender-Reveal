"use client";

import { useState } from "react";
import { saveStrip } from "@/lib/saveStrip";
import { isMobileDevice } from "@/lib/device";

interface Props {
  dataUrl: string;
  blob: Blob;
  onClose: () => void;
}

type SaveState = "idle" | "saving" | "done" | "error";

export default function SaveModal({ dataUrl, blob, onClose }: Props) {
  const [state, setState] = useState<SaveState>("idle");
  const mobile = isMobileDevice();

  const handleSave = async () => {
    setState("saving");
    try {
      const result = await saveStrip(blob);
      if (result.cancelled) {
        setState("idle");
      } else {
        setState("done");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <p className="mb-3 text-center font-display text-xl text-slate-700">
          Save your strip
        </p>

        <div className="mx-auto mb-4 max-h-[50vh] overflow-hidden rounded-2xl strip-shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Photo strip preview"
            className="h-full w-full object-contain"
          />
        </div>

        {state === "done" ? (
          <div className="space-y-3 text-center">
            <p className="font-bold text-green-600">
              {mobile
                ? "Sent to your share sheet 🎉"
                : "Saved! 🎉"}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-full bg-slate-800 px-6 py-3 font-bold text-white active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {state === "error" && (
              <p className="text-center text-sm font-bold text-red-500">
                Couldn&apos;t save automatically — try the download instead.
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={state === "saving"}
              className="w-full rounded-full bg-gradient-to-r from-girl-500 to-boy-500 px-6 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              {state === "saving"
                ? "Saving…"
                : mobile
                ? "Save to Photos"
                : "Save to my computer"}
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-full border-2 border-slate-200 px-6 py-3 font-bold text-slate-500 active:scale-95"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
