import type { MetadataRoute } from "next";

/** Makes WatNu installable: "Add to Home Screen" gives a standalone app with the mark as its icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WatNu",
    short_name: "WatNu",
    description: "What's on in Maastricht this week.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    // The light surface; the theme-color meta in app/layout.tsx follows the system theme at runtime.
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
