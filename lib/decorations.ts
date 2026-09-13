import type { ThemeConfig } from "@/types";

/**
 * Each theme gets exactly 4 stickers — one hero corner, the theme's own
 * onesie (just the pink one for girl, just the blue one for boy — both
 * cropped from the same two-onesies-on-a-clothesline source image, see
 * the `cropX`/`cropWidth` on that entry) hanging at the seam between the
 * first and second photo, one seam accent elsewhere, and one bottom
 * "reveal" medallion. Kept deliberately short: every asset here is a
 * solid, fully-colored cutout (flowers, balloons, the question mark),
 * never the thin white/outline-only style, so nothing reads as
 * washed-out or half-rendered against the theme background. No sticker
 * repeats within a theme, and none share an anchor, so nothing stacks on
 * top of itself.
 */
export const THEMES: Record<"boy" | "girl", ThemeConfig> = {
  boy: {
    id: "boy",
    label: "Team Boy",
    frameLabel: "TEAM BLUE",
    accent: "#9CD1F5",
    accentDark: "#3F7EB0",
    accentSoft: "#EAF6FF",
    contrastDark: "#D9578F",
    decorations: [
      {
        src: "/decorations/balloon-dog.jpg",
        anchor: "top-right",
        offsetX: -40,
        offsetY: 30,
        width: 0.46,
        rotationDeg: 6,
        z: 2,
      },
      {
        src: "/decorations/balloons-duo.jpg",
        anchor: "seam1-left",
        offsetX: -30,
        width: 0.36,
        rotationDeg: -5,
        z: 2,
      },
      {
        src: "/decorations/onesies.jpg",
        anchor: "seam1-center",
        width: 0.34,
        rotationDeg: 0,
        // Right half of the shared onesies image — just the blue onesie
        // and its half of the clothesline/clothespin, cropped tight (see
        // public/decorations/onesies.jpg: pink onesie on the left, blue
        // on the right, split just left of center).
        cropX: 0.486,
        cropY: 0.28,
        cropWidth: 0.514,
        cropHeight: 0.46,
        z: 4,
      },
      {
        src: "/decorations/question-bows.jpg",
        anchor: "bottom-right",
        offsetX: -20,
        offsetY: 60,
        width: 0.4,
        rotationDeg: 5,
        z: 2,
      },
    ],
  },
  girl: {
    id: "girl",
    label: "Team Girl",
    frameLabel: "TEAM PINK",
    accent: "#F9A8C9",
    accentDark: "#D9578F",
    accentSoft: "#FFF1F6",
    contrastDark: "#3F7EB0",
    decorations: [
      {
        src: "/decorations/flowers-red.jpg",
        anchor: "top-left",
        offsetX: 40,
        offsetY: 30,
        width: 0.32,
        rotationDeg: -8,
        z: 2,
      },
      {
        src: "/decorations/onesies.jpg",
        anchor: "seam1-center",
        width: 0.34,
        rotationDeg: 0,
        // Left half of the shared onesies image — just the pink onesie
        // and its half of the clothesline/clothespin, cropped tight (see
        // public/decorations/onesies.jpg: pink onesie on the left, blue
        // on the right, split just left of center).
        cropX: 0,
        cropY: 0.28,
        cropWidth: 0.486,
        cropHeight: 0.46,
        z: 4,
      },
      {
        src: "/decorations/rainbow.jpg",
        anchor: "seam2-left",
        offsetX: -30,
        width: 0.34,
        rotationDeg: -3,
        z: 2,
      },
      {
        src: "/decorations/question-balloon.jpg",
        anchor: "bottom-right",
        offsetX: -20,
        offsetY: 60,
        width: 0.42,
        rotationDeg: -5,
        z: 2,
      },
    ],
  },
};

export function allDecorationSources(): string[] {
  const set = new Set<string>();
  Object.values(THEMES).forEach((theme) =>
    theme.decorations.forEach((d) => set.add(d.src))
  );
  return Array.from(set);
}
