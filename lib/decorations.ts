import type { ThemeConfig } from "@/types";

/**
 * Decoration positions are fractions of the final strip canvas (0–1),
 * anchored to the top-left of each sticker. Negative x/y and values that
 * push past 1 are intentional — real photobooth props overlap the edges
 * and the gaps between frames instead of sitting neatly inside them.
 *
 * Layout target: a classic 3-photo vertical photobooth strip — title band
 * up top, three stacked photo windows, stickers straddling the seams
 * between them, hashtag footer at the bottom.
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
        src: "/decorations/flower-green.jpg",
        x: -0.09,
        y: 0.05,
        width: 0.24,
        rotationDeg: -6,
        z: 3,
      },
      {
        src: "/decorations/balloon-dog.jpg",
        x: 0.5,
        y: 0.015,
        width: 0.55,
        rotationDeg: 6,
        z: 2,
      },
      {
        src: "/decorations/balloons-duo.jpg",
        x: -0.12,
        y: 0.33,
        width: 0.4,
        rotationDeg: -5,
        z: 2,
      },
      {
        src: "/decorations/mushrooms.jpg",
        x: -0.1,
        y: 0.565,
        width: 0.32,
        rotationDeg: 4,
        z: 2,
      },
      {
        src: "/decorations/question-bows.jpg",
        x: 0.56,
        y: 0.78,
        width: 0.44,
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
        x: -0.09,
        y: 0.045,
        width: 0.3,
        rotationDeg: -8,
        z: 3,
      },
      {
        src: "/decorations/flower-green.jpg",
        x: 0.68,
        y: 0.06,
        width: 0.26,
        rotationDeg: 6,
        z: 2,
      },
      {
        src: "/decorations/rainbow.jpg",
        x: -0.12,
        y: 0.335,
        width: 0.36,
        rotationDeg: -3,
        z: 2,
      },
      {
        src: "/decorations/onesies.jpg",
        x: 0.55,
        y: 0.32,
        width: 0.42,
        rotationDeg: 4,
        z: 2,
      },
      {
        src: "/decorations/flower-green.jpg",
        x: -0.09,
        y: 0.575,
        width: 0.2,
        rotationDeg: 5,
        z: 2,
      },
      {
        src: "/decorations/flowers-red.jpg",
        x: -0.09,
        y: 0.79,
        width: 0.3,
        rotationDeg: 4,
        z: 2,
      },
      {
        src: "/decorations/question-balloon.jpg",
        x: 0.58,
        y: 0.775,
        width: 0.44,
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
