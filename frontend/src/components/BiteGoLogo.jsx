import React from "react";

/**
 * BiteGo brand logo — burger + location pin concept.
 * Uses the existing primary palette (#b12408 / #d53d21).
 * Renders as a self-contained SVG so it works at any size.
 */
export default function BiteGoLogo({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BiteGo logo"
    >
      {/* Location pin body */}
      <path
        d="M24 4C16.268 4 10 10.268 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z"
        fill="#b12408"
      />
      {/* Burger top bun */}
      <path
        d="M16 16h16c0-4.418-3.582-8-8-8s-8 3.582-8 8z"
        fill="#ffffff"
        opacity="0.95"
      />
      {/* Burger patty */}
      <rect x="15" y="18" width="18" height="3" rx="1.5" fill="#ffffff" opacity="0.85" />
      {/* Burger bottom bun */}
      <path
        d="M16 23h16v2c0 1.1-.9 2-2 2H18c-1.1 0-2-.9-2-2v-2z"
        fill="#ffffff"
        opacity="0.95"
      />
      {/* Sesame seeds */}
      <circle cx="21" cy="13" r="1" fill="#b12408" opacity="0.4" />
      <circle cx="27" cy="12" r="1" fill="#b12408" opacity="0.4" />
      <circle cx="24" cy="14.5" r="0.8" fill="#b12408" opacity="0.3" />
    </svg>
  );
}
