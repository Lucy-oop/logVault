import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#D97706",
          borderRadius: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="6.5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="16" cy="12" r="1.7" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
