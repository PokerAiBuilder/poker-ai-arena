"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  listAgentProfiles,
  traitLevelScore,
  type AgentProfile,
  type TraitLevel,
} from "@/lib/agents/agentProfiles";
import { cn } from "@/lib/utils";

type AgentProfilesPanelProps = {
  className?: string;
};

const traitLabel: Record<TraitLevel, string> = {
  low: "Low",
  medium: "Medium",
  "medium-high": "Med/High",
  high: "High",
};

function TraitBar({
  label,
  level,
  tone,
}: {
  label: string;
  level: TraitLevel;
  tone: "cyan" | "violet" | "amber" | "rose";
}) {
  const filled = traitLevelScore(level);
  const toneClass = {
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  }[tone];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[9px]">
        <span className="text-white/55">{label}</span>
        <span className="font-medium text-white/80">{traitLabel[level]}</span>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full",
              step <= filled ? toneClass : "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function AgentProfileCard({ profile }: { profile: AgentProfile }) {
  return (
    <article className="min-w-0 max-w-full rounded-xl border border-white/10 bg-black/35 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-slate-800 to-slate-950 text-lg">
          {profile.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="break-words text-sm font-semibold text-white">{profile.name}</h4>
            <Badge
              variant="secondary"
              className="border-violet-400/25 bg-violet-500/10 text-[9px] text-violet-200"
            >
              {profile.styleBadge}
            </Badge>
          </div>
          <p className="text-[11px] font-medium text-casino-goldLight/90">
            {profile.title}
          </p>
        </div>
      </div>

      <p className="mt-2 break-words text-[11px] leading-relaxed text-muted-foreground">
        {profile.styleDescription}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 min-[420px]:gap-2">
        <TraitBar label="Aggression" level={profile.aggression} tone="rose" />
        <TraitBar label="Bluff" level={profile.bluff} tone="violet" />
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[9px]">
            <span className="text-white/55">Range</span>
            <span className="font-medium text-white/80">{profile.range}</span>
          </div>
          <Badge
            variant="outline"
            className="w-full justify-center border-cyan-400/25 bg-cyan-500/5 py-0.5 text-[8px] text-cyan-200/90"
          >
            {profile.range}
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-2">
        <p className="break-words text-[10px] leading-snug text-white/75">
          <span className="font-semibold text-casino-goldLight/90">Signature: </span>
          {profile.signature}
        </p>
        <p className="break-words text-[10px] leading-snug text-white/55">
          <span className="font-semibold text-white/65">Watch for: </span>
          {profile.watchFor}
        </p>
      </div>
    </article>
  );
}

export function AgentProfilesPanel({ className }: AgentProfilesPanelProps) {
  const profiles = listAgentProfiles();

  return (
    <div className={cn("min-w-0 max-w-full space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-300/80" />
        <div>
          <h3 className="text-sm font-semibold text-casino-goldLight">
            AI Agent Profiles
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Why each bot plays differently in Agent Battle
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <AgentProfileCard key={profile.id} profile={profile} />
        ))}
      </div>

      <p className="break-words text-[10px] leading-relaxed text-white/40">
        Profiles describe Agent Battle spectator behavior. Human vs AI uses
        PokerMaster only with a separate tuned decision model.
      </p>
    </div>
  );
}
