"use client";

import { Users } from "lucide-react";
import {
  listAgentProfiles,
  type AgentProfile,
} from "@/lib/agents/agentProfiles";
import { cn } from "@/lib/utils";

type AgentProfilesPanelProps = {
  className?: string;
};

const MENU_AGENT_TRAITS: Record<string, readonly [string, string, string]> = {
  "poker-master": ["Range control", "Value bets", "Low tilt"],
  "bluff-bot": ["Wide range", "High bluff", "Pot pressure"],
  "river-mind": ["Tight range", "Value heavy", "Folds marginal"],
  "chip-hunter": ["Semi-loose", "Pot pressure", "Attacks weakness"],
};

const MENU_AGENT_SIGNATURE: Record<string, string> = {
  "poker-master": "Adapts to board pressure",
  "bluff-bot": "Creates action with pressure",
  "river-mind": "Waits for strong value",
  "chip-hunter": "Builds pots on weakness",
};

function compactTraits(profile: AgentProfile): string {
  const traits = MENU_AGENT_TRAITS[profile.id];
  if (traits) return traits.join(" · ");
  return `${profile.range} · ${profile.styleBadge}`;
}

function compactSignature(profile: AgentProfile): string {
  return MENU_AGENT_SIGNATURE[profile.id] ?? profile.signature.split(".")[0] ?? profile.signature;
}

function AgentProfileCard({ profile }: { profile: AgentProfile }) {
  return (
    <article className="arena-menu-card p-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--arena-cyan)]/20 bg-[var(--arena-blue)]/10 text-base">
          {profile.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold leading-snug text-white">
            {profile.name}
            <span className="font-normal text-[var(--arena-muted)]"> · </span>
            <span className="text-[var(--arena-cyan)]">{profile.styleBadge}</span>
          </p>
          <p className="mt-1 text-[10px] leading-snug text-white/60">
            {compactTraits(profile)}
          </p>
          <p className="mt-1 text-[10px] leading-snug text-white/45">
            <span className="text-white/55">Signature:</span> {compactSignature(profile)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function AgentProfilesPanel({ className }: AgentProfilesPanelProps) {
  const profiles = listAgentProfiles();

  return (
    <div className={cn("min-w-0 max-w-full space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-[var(--arena-cyan)]/80" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
          Agents
        </h3>
      </div>

      <div className="space-y-2">
        {profiles.map((profile) => (
          <AgentProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
