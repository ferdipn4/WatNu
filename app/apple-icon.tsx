import { ImageResponse } from "next/og";
import { STAR_PATH } from "./icon";

/** The home-screen icon on iOS (which rounds the corners itself). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#d01f29" }}>
        <svg width={140} height={140} viewBox="0 0 128 128">
          <path d={STAR_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
