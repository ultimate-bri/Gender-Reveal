import type { ThemeConfig } from "@/types";

/**
 * Decoration positions are fractions of the final photo canvas (0–1),
 * anchored to the top-left of each sticker. Negative x/y and values that
 * push past 1 are intentional — real photobooth props overlap the edges
 * and corners of the print instead of sitting neatly inside them.
 */
export const THEMES: Record<"boy" | "girl", ThemeConfig> = {
  boy: {
    id: "boy",
    label: "Team Boy",
    frameLabel: "TEAM BLUE",
    accent: "#9CD1F5",
    accentDark: "#3F7EB0",
    accentSoft: "#EAF6FF",
    decorations: [
      {
        src: "/decorations/balloons-duo.jpg",
        x: -0.1,
        y: -0.05,
        width: 0.56,
        rotationDeg: -6,
        z: 2,
      },
      {
        src: "/decorations/question-balloon.jpg",
        x: 0.56,
        y: -0.06,
        width: 0.5,
        rotationDeg: 7,
        z: 2,
      },
      {
        src: "/decorations/onesies.jpg",
        x: -0.12,
        y: 0.74,
        width: 0.56,
        rotationDeg: 4,
        z: 2,
      },
      {
        src: "/decorations/balloon-dog.jpg",
        x: 0.62,
        y: 0.7,
        width: 0.48,
        rotationDeg: -5,
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
    decorations: [
      {
        src: "/decorations/flowers-red.jpg",
        x: -0.1,
        y: -0.05,
        width: 0.5,
        rotationDeg: -8,
        z: 2,
      },
      {
        src: "/decorations/question-bows.jpg",
        x: 0.58,
        y: -0.06,
        width: 0.5,
        rotationDeg: 6,
        z: 2,
      },
      {
        src: "/decorations/flower-green.jpg",
        x: 0.38,
        y: 0.02,
        width: 0.2,
        rotationDeg: -4,
        z: 3,
      },
      {
        src: "/decorations/mushrooms.jpg",
        x: -0.1,
        y: 0.72,
        width: 0.46,
        rotationDeg: 5,
        z: 2,
      },
      {
        src: "/decorations/rainbow.jpg",
        x: 0.56,
        y: 0.76,
        width: 0.56,
        rotationDeg: -4,
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
