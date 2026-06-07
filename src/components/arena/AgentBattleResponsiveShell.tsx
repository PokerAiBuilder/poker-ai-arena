"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Agent Battle ellipse only at this width and above (Tailwind 2xl). */
export const AGENT_BATTLE_ELLIPSE_MIN_PX = 1536;

const ELLIPSE_MEDIA = `(min-width: ${AGENT_BATTLE_ELLIPSE_MIN_PX}px)`;

/** Set true locally when debugging AB broadcast vs ellipse breakpoint. */
const ENABLE_AB_LAYOUT_DEBUG = false;

export type AgentBattleLayoutMode = "broadcast" | "ellipse";

function AgentBattleLayoutDebugLabel({ layout }: { layout: AgentBattleLayoutMode }) {
  const text =
    layout === "ellipse"
      ? "AB layout: ellipse >=1536"
      : "AB layout: broadcast <1536";

  return (
    <div
      className="arena-ab-layout-debug pointer-events-none absolute left-2 top-2 z-[40] rounded border border-amber-400/60 bg-black/80 px-2 py-0.5 font-mono text-[9px] leading-tight text-amber-100 shadow-sm"
      aria-hidden
    >
      {text}
    </div>
  );
}

type AgentBattleResponsiveShellProps = {
  broadcast: ReactNode;
  ellipse: ReactNode;
};

/**
 * Mounts exactly one AB layout — broadcast below 1536px, ellipse at 1536px+.
 * SSR defaults to broadcast (safe for narrow viewports).
 */
export function AgentBattleResponsiveShell({
  broadcast,
  ellipse,
}: AgentBattleResponsiveShellProps) {
  const [layout, setLayout] = useState<AgentBattleLayoutMode>("broadcast");

  useEffect(() => {
    const mq = window.matchMedia(ELLIPSE_MEDIA);

    const sync = () => {
      setLayout(mq.matches ? "ellipse" : "broadcast");
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full">
      {ENABLE_AB_LAYOUT_DEBUG && process.env.NODE_ENV === "development" ? (
        <AgentBattleLayoutDebugLabel layout={layout} />
      ) : null}
      {layout === "ellipse" ? ellipse : broadcast}
    </div>
  );
}
