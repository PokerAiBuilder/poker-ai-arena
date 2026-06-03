import { cn } from "@/lib/utils";

type BrandMarkProps = {
  /** Outer diameter in pixels */
  size?: number;
  className?: string;
  /** Accessible label when used without visible text */
  label?: string;
};

/**
 * CSS/SVG brand mark — chip + spade + neural accent.
 * No text inside the graphic (safe for v1 foundation; replace with final asset later).
 */
export function BrandMark({
  size = 36,
  className,
  label = "Poker AI Arena",
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("shrink-0", className)}
    >
      <defs>
        <radialGradient id="brand-chip-face" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="55%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#030508" />
        </radialGradient>
        <linearGradient id="brand-chip-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="45%" stopColor="#0052ff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="brand-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer chip rim */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="url(#brand-chip-rim)"
        strokeWidth="2.5"
        fill="url(#brand-chip-face)"
        filter="url(#brand-glow)"
      />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="rgba(59, 130, 246, 0.25)"
        strokeWidth="1"
        fill="none"
      />

      {/* Spade */}
      <path
        d="M24 14c-3.2 0-5.5 2.2-5.5 5.1 0 2.4 1.6 4.1 3.8 5.6l-1.3 4.3h6l-1.3-4.3c2.2-1.5 3.8-3.2 3.8-5.6C30.5 16.2 28.2 14 24 14z"
        fill="url(#brand-chip-rim)"
        opacity="0.95"
      />
      <path
        d="M20 28.5h8"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Neural / AI accent nodes */}
      <circle cx="14" cy="30" r="1.5" fill="#22d3ee" opacity="0.9" />
      <circle cx="34" cy="30" r="1.5" fill="#3b82f6" opacity="0.9" />
      <path
        d="M15.5 30h5M27.5 30h5"
        stroke="#0052ff"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />
      <circle cx="24" cy="34" r="1" fill="#60a5fa" opacity="0.75" />

      {/* Subtle human/AI silhouette hints (abstract, not photographic) */}
      <path
        d="M12 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm24 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
        fill="#94a3b8"
        opacity="0.35"
      />
    </svg>
  );
}
