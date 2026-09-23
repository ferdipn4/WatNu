import { ImageResponse } from "next/og";

/** The WatNu mark (design/assets/Logos/watnu-mark.svg) as the favicon and the manifest icon. Full-bleed accent so it survives Android's maskable crop. */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** The star from the city's arms, drawn plain — the same path as watnu-star.svg. */
export const STAR_PATH =
  "M64.0 26.0 L73.7 52.7 L102.0 53.6 L79.7 71.1 L87.5 98.4 L64.0 82.5 L40.5 98.4 L48.3 71.1 L26.0 53.6 L54.3 52.7 Z";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#d01f29" }}>
        <svg width={400} height={400} viewBox="0 0 128 128">
          <path d={STAR_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
