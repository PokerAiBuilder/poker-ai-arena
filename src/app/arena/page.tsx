import type { Metadata } from "next";
import { ArenaShell } from "@/components/arena/ArenaShell";

export const metadata: Metadata = {
  title: "Arena",
  description:
    "Live Human vs AI poker and shared AI Agent Battle spectator mode — demo chips only, mock session unlock.",
};

export default function ArenaPage() {
  return (
    <div className="v1-gradient-bg min-h-dvh max-h-dvh overflow-hidden overflow-x-hidden">
      <ArenaShell />
    </div>
  );
}
