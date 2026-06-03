"use client";

import Image from "next/image";
import { useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

/** Public path to the premium logo mark (`public/brand/poker-ai-arena-mark.png`). */
export const ARENA_LOGO_SRC = "/brand/poker-ai-arena-mark.png";

export const ARENA_LOGO_ALT = "Poker AI Arena logo";

type ArenaLogoProps = {
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  /** Force inline SVG (e.g. compact header). */
  useSvgFallback?: boolean;
};

/**
 * Renders the real logo asset when available; falls back to BrandMark on load error.
 */
export function ArenaLogo({
  width,
  height,
  className,
  priority = false,
  useSvgFallback = false,
}: ArenaLogoProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (useSvgFallback || loadFailed) {
    return (
      <BrandMark
        size={width}
        className={className}
        label={ARENA_LOGO_ALT}
      />
    );
  }

  return (
    <Image
      src={ARENA_LOGO_SRC}
      alt={ARENA_LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height, maxWidth: width, maxHeight: height }}
      onError={() => setLoadFailed(true)}
    />
  );
}
