"use client";

import { ChevronRight, Loader2, Play, RotateCcw, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  StepDemoGameplayGuidance,
  StepDemoHumanActions,
  StepDemoRaiseSize,
} from "@/lib/arena/stepDemo";
import type { StepDemoUiControls } from "@/lib/arena/stepDemoUiState";
import { stepDemoUiBannerPhase } from "@/lib/arena/stepDemoUiState";
import { pokerActionButtonClass } from "@/lib/arena/pokerActionButtonStyles";
import { cn } from "@/lib/utils";

type ArenaActionBarProps = {
  onSimulateAgentBattle: () => void;
  onReturnToHumanVsAi?: () => void;
  onPlayStepDemo?: () => void;
  onOpenMenu?: () => void;
  stepDemoActive?: boolean;
  stepDemoUi?: StepDemoUiControls;
  stepDemoHumanActions?: StepDemoHumanActions;
  stepDemoGuidance?: StepDemoGameplayGuidance;
  onHumanFold?: () => void;
  onHumanCall?: () => void;
  onHumanCheck?: () => void;
  onHumanRaise?: (size: StepDemoRaiseSize) => void;
  onHumanAllIn?: () => void;
  stepDemoHandComplete?: boolean;
  onStepDemoReset?: () => void;
  onResetDemoStacks?: () => void;
  headsUpStackDepleted?: boolean;
  onRevealFlop?: () => void;
  onRevealTurn?: () => void;
  onRevealRiver?: () => void;
  onRunoutBoard?: () => void;
  onShowResult?: () => void;
  /** Human vs AI — PokerMaster is deciding after a human action */
  pokerMasterThinking?: boolean;
  loading?: boolean;
  loadingMode?: "human-vs-ai" | "agent-vs-agent" | null;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
  /** AI Agent Battle spectator — override Human vs AI action hints */
  agentBattleSpectator?: boolean;
  agentBattleHasResult?: boolean;
  agentBattleStackDepleted?: boolean;
  /** Local-only Agent Battle fallback (not server shared hand). */
  agentBattleLocalFallback?: boolean;
  /** Shared spectator mode — stacks/timeline controlled by server. */
  agentBattleSharedSpectator?: boolean;
  /** Joined shared broadcast — auto-advances hands. */
  agentBattleWatchingShared?: boolean;
  /** Shared hand in result pause before next hand. */
  agentBattleSharedResultPause?: boolean;
  onResetAgentBattleStacks?: () => void;
  /** Agent Battle live replay in progress */
  agentBattleReplayActive?: boolean;
  onSkipAgentBattleReplay?: () => void;
  /** Live replay — current bot thinking copy for action bar */
  agentBattleActionHint?: string;
  /** Human vs AI — seconds left on player turn timer */
  humanTurnSecondsLeft?: number | null;
  className?: string;
};

const bannerStyles: Record<
  NonNullable<StepDemoGameplayGuidance["phase"]>,
  string
> = {
  "start-hand":
    "border-[var(--arena-border)] bg-[var(--arena-blue)]/15 text-[var(--arena-cyan)]",
  "your-turn": "arena-action-banner-your-turn animate-pulse",
  waiting:
    "border-cyan-400/40 bg-cyan-950/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.2)] animate-pulse",
  "advance-street": "arena-action-banner-advance",
  "hand-complete":
    "border-[var(--arena-cyan)]/45 bg-[var(--arena-blue)]/20 text-[var(--arena-cyan)]",
  "all-in":
    "border-red-400/45 bg-red-950/65 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.18)]",
};

const actionPrimary = "arena-action-btn-primary shadow-arena-blue";
const actionSecondary = "arena-action-btn-secondary";
const actionReset = "arena-action-btn-reset";
const modePillActive = "arena-action-mode-pill-active";

export function ArenaActionBar({
  onSimulateAgentBattle,
  onReturnToHumanVsAi,
  onPlayStepDemo,
  onOpenMenu,
  stepDemoActive = false,
  stepDemoUi,
  stepDemoHumanActions,
  stepDemoGuidance,
  onHumanFold,
  onHumanCall,
  onHumanCheck,
  onHumanRaise,
  onHumanAllIn,
  stepDemoHandComplete = false,
  onStepDemoReset,
  onResetDemoStacks,
  headsUpStackDepleted = false,
  onRevealFlop,
  onRevealTurn,
  onRevealRiver,
  onRunoutBoard,
  onShowResult,
  loading = false,
  loadingMode = null,
  disabled = false,
  disabledReason,
  error,
  agentBattleSpectator = false,
  agentBattleHasResult = false,
  agentBattleStackDepleted = false,
  agentBattleLocalFallback = false,
  agentBattleSharedSpectator = false,
  agentBattleWatchingShared = false,
  agentBattleSharedResultPause = false,
  onResetAgentBattleStacks,
  agentBattleReplayActive = false,
  onSkipAgentBattleReplay,
  agentBattleActionHint,
  pokerMasterThinking = false,
  humanTurnSecondsLeft = null,
  className,
}: ArenaActionBarProps) {
  const useHeadsUpUi = !agentBattleSpectator && stepDemoUi != null;
  const humanActions = useHeadsUpUi ? stepDemoUi.humanActions : stepDemoHumanActions;
  const humanTurnActive = useHeadsUpUi
    ? stepDemoUi.pokerActionsEnabled
    : stepDemoActive &&
      !pokerMasterThinking &&
      humanActions &&
      (humanActions.canFold ||
        humanActions.canCall ||
        humanActions.canCheck ||
        humanActions.canRaise ||
        humanActions.canAllIn);
  const playStepDemoDisabled = useHeadsUpUi
    ? !stepDemoUi.playEnabled || disabled || loading || agentBattleReplayActive
    : disabled ||
      loading ||
      agentBattleReplayActive ||
      stepDemoActive ||
      headsUpStackDepleted ||
      pokerMasterThinking;
  const agentBattleDisabled = useHeadsUpUi
    ? !stepDemoUi.agentBattleEnabled ||
      disabled ||
      loading ||
      agentBattleReplayActive ||
      agentBattleWatchingShared
    : disabled ||
      loading ||
      agentBattleReplayActive ||
      agentBattleWatchingShared ||
      pokerMasterThinking ||
      (agentBattleLocalFallback && agentBattleStackDepleted) ||
      (stepDemoActive && !stepDemoHandComplete);
  const showSkipAgentBattleReplay =
    agentBattleReplayActive && onSkipAgentBattleReplay != null;
  const showStackDepletedUi = useHeadsUpUi
    ? stepDemoUi.state === "stack_depleted"
    : headsUpStackDepleted && !agentBattleSpectator && !humanTurnActive;
  const showAgentBattleDepletedUi =
    agentBattleSpectator &&
    agentBattleLocalFallback &&
    agentBattleStackDepleted &&
    !agentBattleSharedSpectator;

  const sharedLiveSpectator =
    agentBattleSpectator &&
    agentBattleWatchingShared &&
    !agentBattleLocalFallback;

  const compactSharedSpectatorBar =
    sharedLiveSpectator &&
    (agentBattleSharedResultPause || agentBattleReplayActive);

  const guidance: StepDemoGameplayGuidance | undefined = showStackDepletedUi
    ? {
        phase: "hand-complete",
        banner: "NO CHIPS LEFT",
        actionHint:
          "No chips remaining — cash out or start a new test stake session from the side panel.",
      }
    : useHeadsUpUi
      ? {
          phase: stepDemoUiBannerPhase(stepDemoUi.state),
          banner: stepDemoUi.banner,
          actionHint: stepDemoUi.actionHint,
          nextStep: stepDemoUi.nextStep ?? undefined,
        }
    : stepDemoActive
    ? stepDemoGuidance
    : showAgentBattleDepletedUi
      ? {
          phase: "hand-complete" as const,
          banner: "LOCAL SPECTATOR STACKS DEPLETED",
          actionHint:
            "Local replay stacks depleted — reset spectator stacks to continue.",
        }
    : agentBattleSpectator
      ? {
          phase: agentBattleSharedResultPause
            ? ("hand-complete" as const)
            : agentBattleReplayActive
              ? ("waiting" as const)
              : agentBattleHasResult
                ? ("hand-complete" as const)
                : ("waiting" as const),
          banner: sharedLiveSpectator
            ? agentBattleSharedResultPause
              ? "SHARED LIVE ARENA · RESULT"
              : agentBattleReplayActive
                ? "SHARED LIVE ARENA · PLAYING"
                : "SHARED LIVE ARENA"
            : agentBattleSharedResultPause
              ? "SHARED RESULT"
              : agentBattleReplayActive
                ? agentBattleLocalFallback
                  ? "LIVE REPLAY · LOCAL"
                  : "LIVE REPLAY"
                : agentBattleHasResult
                  ? agentBattleLocalFallback
                    ? "LOCAL REPLAY RESULT"
                    : "SPECTATOR RESULT"
                  : agentBattleLocalFallback
                    ? "LOCAL AGENT BATTLE"
                    : "AI AGENT BATTLE",
          actionHint: sharedLiveSpectator
            ? agentBattleSharedResultPause
              ? "Next shared hand starts automatically. Tap Human vs AI to leave Agent Battle."
              : agentBattleReplayActive
                ? (agentBattleActionHint ??
                  "Shared spectator hand — live replay in sync with the arena. Tap Human vs AI to return.")
                : "Tap Human vs AI to return to your table."
            : agentBattleSharedResultPause
              ? "Next shared hand starts automatically. Tap Human vs AI to leave Agent Battle."
              : agentBattleReplayActive
                ? (agentBattleActionHint ??
                  "Local replay — agents acting in sequence. Tap Human vs AI to return.")
              : agentBattleHasResult
                ? agentBattleLocalFallback
                  ? "Local replay result — tap Human vs AI to return to your table."
                  : "Spectator result — tap Human vs AI to return to your table."
                : agentBattleLocalFallback
                  ? "Local fallback — tap Human vs AI to return to your table."
                  : "Spectator Mode — tap Human vs AI to return to your table.",
        }
      : stepDemoGuidance ?? {
          phase: "start-hand",
          banner: "START HAND",
          actionHint: "Start a hand first — tap Play vs PokerMaster.",
        };

  const spectatorBannerClass =
    "border-[var(--arena-cyan)]/45 bg-[var(--arena-blue)]/20 text-[var(--arena-cyan)] shadow-arena-blue";

  const showGuidanceBanner =
    guidance && (!humanTurnActive || guidance.phase !== "your-turn");

  const actionHint = useHeadsUpUi
    ? stepDemoUi.actionHint
    : pokerMasterThinking && !agentBattleSpectator
      ? stepDemoGuidance?.actionHint ?? "PokerMaster is thinking..."
      : humanTurnActive && humanActions?.disabledHint && !agentBattleSpectator
        ? humanActions.disabledHint
        : guidance?.actionHint ??
          (agentBattleSpectator
            ? "Spectator Mode — player actions are disabled while watching."
            : humanActions?.disabledHint);

  const nextStep = useHeadsUpUi ? stepDemoUi.nextStep : guidance?.nextStep;
  const nextStepEnabled = useHeadsUpUi
    ? stepDemoUi.nextStepEnabled && !disabled && !loading
    : Boolean(nextStep) &&
      stepDemoActive &&
      !stepDemoHandComplete &&
      !loading &&
      !disabled &&
      !pokerMasterThinking;
  const newHandEnabled = useHeadsUpUi
    ? stepDemoUi.newHandEnabled
    : stepDemoHandComplete && !showStackDepletedUi;
  const resetStacksEnabled = useHeadsUpUi
    ? stepDemoUi.resetStacksEnabled
    : showStackDepletedUi;

  const showDevResetStacks =
    process.env.NODE_ENV === "development" &&
    Boolean(onResetDemoStacks) &&
    resetStacksEnabled;

  const showHvaiPlayButton =
    Boolean(onPlayStepDemo) &&
    !agentBattleSpectator &&
    (useHeadsUpUi
      ? stepDemoUi.state === "ready_to_start"
      : !stepDemoActive);

  const showHvaiModePill =
    !agentBattleSpectator &&
    (useHeadsUpUi
      ? stepDemoActive &&
        stepDemoUi.state !== "ready_to_start" &&
        stepDemoUi.state !== "hand_complete" &&
        stepDemoUi.state !== "stack_depleted"
      : stepDemoActive && !stepDemoHandComplete);

  const controlsDisabled = disabled || loading || stepDemoActive || agentBattleReplayActive;

  function handleNextStep() {
    if ((useHeadsUpUi ? !stepDemoUi.nextStepEnabled : pokerMasterThinking) || !nextStep) {
      return;
    }
    switch (nextStep.action) {
      case "reveal-flop":
        onRevealFlop?.();
        break;
      case "reveal-turn":
        onRevealTurn?.();
        break;
      case "reveal-river":
        onRevealRiver?.();
        break;
      case "runout-board":
        onRunoutBoard?.();
        break;
      case "show-result":
        onShowResult?.();
        break;
    }
  }

  const mobileTap = "max-md:arena-action-btn-tap";

  const renderHvaiModeControl = (compact = false) => {
    if (agentBattleSpectator) return null;
    if (showHvaiPlayButton && onPlayStepDemo) {
      return (
        <Button
          onClick={onPlayStepDemo}
          disabled={playStepDemoDisabled}
          size={compact ? "default" : "lg"}
          variant="default"
          className={cn(
            "arena-action-btn",
            actionPrimary,
            compact && mobileTap,
            compact ? "min-w-0 flex-1" : "min-w-[9.5rem] xl:min-w-[200px]",
            !compact &&
              !disabled &&
              guidance?.phase === "start-hand" &&
              "ring-2 ring-[var(--arena-cyan)]/30",
          )}
        >
          <Play className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {compact ? "Play vs PM" : "Play vs PokerMaster"}
          </span>
        </Button>
      );
    }
    if (showHvaiModePill) {
      return (
        <span
          className={cn(
            "arena-action-mode-pill",
            modePillActive,
            compact && "min-w-[4.5rem] flex-1 justify-center max-md:min-w-0",
            !compact && "min-w-[7.5rem] xl:min-w-[8.5rem]",
          )}
          title="Human vs AI hand in progress"
        >
          <Users className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <span className="truncate">Human vs AI</span>
        </span>
      );
    }
    return null;
  };

  const renderRaiseOptionButtons = (options?: StepDemoHumanActions["raiseOptions"]) => {
    if (!options?.length) return null;
    return options.map((option) => (
      <Button
        key={option.size}
        variant="secondary"
        size="lg"
        className={cn(
          "arena-action-btn",
          mobileTap,
          option.size === 10 ? "min-w-[4.25rem] xl:min-w-[5.5rem]" : "min-w-[2.75rem] px-2",
          pokerActionButtonClass(
            !!option.enabled,
            humanTurnActive,
            "call",
          ),
        )}
        disabled={!humanTurnActive || !humanActions?.canRaise || !option.enabled}
        title={
          option.cappedToStack
            ? `${option.label} — capped to ${option.increment} (stack limit)`
            : humanActions?.disabledHint ?? actionHint ?? option.label
        }
        onClick={() => onHumanRaise?.(option.size)}
      >
        {option.label}
      </Button>
    ));
  };

  const renderReturnToHumanVsAiButton = (compact = false) => {
    if (!onReturnToHumanVsAi) return null;
    return (
      <Button
        type="button"
        onClick={onReturnToHumanVsAi}
        size={compact ? "default" : "lg"}
        variant="default"
        className={cn(
          "arena-action-btn",
          actionPrimary,
          compact && mobileTap,
          compact ? "min-w-0 flex-1" : "min-w-[9.5rem] xl:min-w-[200px]",
        )}
      >
        <Users className="h-4 w-4 shrink-0" />
        <span className="truncate">Human vs AI</span>
      </Button>
    );
  };

  const renderAgentBattleStatusPill = (compact = false) => {
    if (agentBattleWatchingShared) {
      return (
        <span
          className={cn(
            "arena-action-mode-pill",
            modePillActive,
            compact && "min-w-0 flex-1 justify-center max-md:min-w-0",
            !compact && "min-w-[7.5rem] xl:min-w-[8.5rem]",
          )}
          title="Shared live Agent Battle hand"
        >
          <Swords className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <span className="truncate">
            {compact ? "Watching Shared" : "Watching Shared Battle"}
          </span>
        </span>
      );
    }
    if (agentBattleReplayActive) {
      return (
        <span
          className={cn(
            "arena-action-mode-pill",
            modePillActive,
            compact && "min-w-0 flex-1 justify-center max-md:min-w-0",
            !compact && "min-w-[7.5rem] xl:min-w-[8.5rem]",
          )}
          title="Local Agent Battle replay in progress"
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" />
          <span className="truncate">{compact ? "Live replay" : "Live Agent Battle"}</span>
        </span>
      );
    }
    if (agentBattleLocalFallback && agentBattleSpectator) {
      return (
        <span
          className={cn(
            "arena-action-mode-pill text-[var(--arena-muted)]",
            compact && "min-w-0 flex-1 justify-center max-md:min-w-0",
          )}
        >
          Local replay
        </span>
      );
    }
    return null;
  };

  const renderSkipReplayButton = (compact = false) => {
    if (!showSkipAgentBattleReplay) return null;
    return (
      <Button
        type="button"
        size={compact ? "default" : "lg"}
        className={cn(
          "arena-action-btn",
          actionPrimary,
          compact && mobileTap,
          compact
            ? "min-w-0 shrink-0 px-2.5"
            : "min-w-[7.5rem] xl:min-w-[160px]",
        )}
        title="Skip local animations — shows final result on this device only"
        onClick={onSkipAgentBattleReplay}
      >
        {compact ? "Skip" : "Skip animations"}
      </Button>
    );
  };

  const renderMobileMenuButton = () =>
    onOpenMenu ? (
      <Button
        type="button"
        size="default"
        variant="outline"
        className={cn(
          "arena-action-btn",
          mobileTap,
          "min-w-[3.75rem] shrink-0 border-[var(--arena-border)] text-[var(--arena-cyan)]",
        )}
        onClick={onOpenMenu}
      >
        Menu
      </Button>
    ) : null;

  const renderMobileAgentBattleButton = (compact = false) => (
    <Button
      onClick={onSimulateAgentBattle}
      disabled={agentBattleDisabled}
      size="default"
      variant="outline"
      className={cn(
        "arena-action-btn",
        mobileTap,
        "min-w-0 flex-1",
        agentBattleWatchingShared || agentBattleReplayActive
          ? cn(actionSecondary, modePillActive)
          : actionSecondary,
        agentBattleReplayActive && "opacity-70",
      )}
      title={
        agentBattleReplayActive
          ? "Replay in progress — wait for the hand to finish."
          : controlsDisabled
            ? actionHint ?? "Start a hand first or wait for your turn."
            : "Spectator Mode — watch AI agents play a simulated hand"
      }
    >
      {loading && loadingMode === "agent-vs-agent" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span className="truncate">{compact ? "Joining…" : "Joining..."}</span>
        </>
      ) : agentBattleWatchingShared ? (
        <>
          <Swords className="h-4 w-4 shrink-0" />
          <span className="truncate">{compact ? "Watching" : "Watching Shared"}</span>
        </>
      ) : agentBattleReplayActive ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span className="truncate">{compact ? "Live" : "Live Battle"}</span>
        </>
      ) : (
        <>
          <Swords className="h-4 w-4 shrink-0" />
          <span className="truncate">{compact ? "Agent Battle" : "Join Battle"}</span>
        </>
      )}
    </Button>
  );

  return (
    <div
      className={cn(
        "shrink-0 border-t border-[var(--arena-border)] bg-[var(--arena-surface)]/95 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,82,255,0.08)]",
        agentBattleSpectator && "border-[var(--arena-cyan)]/20",
        className,
      )}
    >
      <div
        className={cn(
          "arena-action-shell",
          compactSharedSpectatorBar ? "py-1" : "py-1.5 sm:py-2",
        )}
      >
        {humanTurnActive ? (
          <div className="mb-1.5 flex justify-center">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                bannerStyles["your-turn"],
              )}
            >
              Your turn
              {humanTurnSecondsLeft != null
                ? ` · ${String(Math.max(0, humanTurnSecondsLeft)).padStart(2, "0")}s`
                : null}
            </span>
          </div>
        ) : showGuidanceBanner && guidance.phase ? (
          <div
            className={cn(
              "flex justify-center",
              compactSharedSpectatorBar ? "mb-1.5" : "mb-2",
            )}
          >
            <span
              className={cn(
                "rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                agentBattleSpectator
                  ? spectatorBannerClass
                  : bannerStyles[guidance.phase],
              )}
            >
              {guidance.banner}
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            "min-w-0 max-w-full",
          )}
        >
          {agentBattleSpectator ? (
            <>
              <div className="arena-controls-mobile">
                <div className="arena-action-mobile-mode">
                  {renderReturnToHumanVsAiButton(true)}
                  {renderAgentBattleStatusPill(true)}
                  {renderSkipReplayButton(true)}
                  {showAgentBattleDepletedUi && onResetAgentBattleStacks ? (
                    <Button
                      type="button"
                      size="default"
                      className={cn(
                        "arena-action-btn",
                        mobileTap,
                        actionSecondary,
                        "min-w-0 shrink-0 px-2.5",
                      )}
                      onClick={onResetAgentBattleStacks}
                    >
                      <RotateCcw className="h-4 w-4 shrink-0" />
                      Reset
                    </Button>
                  ) : null}
                  {renderMobileMenuButton()}
                </div>
              </div>

              <div className="arena-controls-desktop-ab">
                {renderReturnToHumanVsAiButton(false)}
                {renderAgentBattleStatusPill(false)}
                {renderSkipReplayButton(false)}
                {showAgentBattleDepletedUi && onResetAgentBattleStacks ? (
                  <Button
                    type="button"
                    size="lg"
                    className={cn(
                      "arena-action-btn h-11 min-w-[240px]",
                      actionSecondary,
                    )}
                    onClick={onResetAgentBattleStacks}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Agent Battle Stacks
                  </Button>
                ) : null}
                {onOpenMenu ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 border-[var(--arena-border)] text-[var(--arena-cyan)] text-xs 2xl:hidden"
                    onClick={onOpenMenu}
                  >
                    Menu
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="arena-controls-mobile">
                <div className="arena-action-mobile-mode">
                  {renderHvaiModeControl(true)}
                  {renderMobileAgentBattleButton(true)}
                  {renderMobileMenuButton()}
                </div>
                {(nextStepEnabled && nextStep && !resetStacksEnabled) ||
                (newHandEnabled && onStepDemoReset) ||
                showDevResetStacks ? (
                  <div className="arena-action-mobile-mode">
                    {nextStepEnabled && nextStep && !resetStacksEnabled ? (
                      <Button
                        type="button"
                        size="default"
                      className={cn(
                        "arena-action-flow-btn arena-action-btn",
                        mobileTap,
                        actionPrimary,
                        "min-w-0 flex-1",
                      )}
                        onClick={handleNextStep}
                      >
                        {nextStep.label}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : null}
                    {newHandEnabled && onStepDemoReset ? (
                      <Button
                        type="button"
                        size="default"
                        className={cn(
                          "arena-action-flow-btn arena-action-btn",
                          mobileTap,
                          actionReset,
                          "min-w-0 flex-1",
                        )}
                        onClick={onStepDemoReset}
                      >
                        <RotateCcw className="mr-1 h-4 w-4 shrink-0" />
                        New Hand
                      </Button>
                    ) : null}
                    {showDevResetStacks ? (
                      <Button
                        type="button"
                        size="default"
                        className={cn(
                          "arena-action-flow-btn arena-action-btn",
                          mobileTap,
                          "min-w-0 flex-1 border-2 border-amber-500/40 bg-amber-950/30 font-bold text-amber-200",
                        )}
                        onClick={onResetDemoStacks}
                      >
                        <RotateCcw className="mr-1 h-4 w-4 shrink-0" />
                        Dev reset stacks
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                <div className="arena-action-mobile-poker-core">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "arena-action-btn",
                      mobileTap,
                      "min-w-[3.75rem] flex-1",
                      pokerActionButtonClass(
                        !!humanActions?.canFold,
                        humanTurnActive,
                        "fold",
                      ),
                    )}
                    disabled={!humanTurnActive || !humanActions?.canFold}
                    title={humanActions?.disabledHint ?? actionHint ?? undefined}
                    onClick={onHumanFold}
                  >
                    Fold
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "arena-action-btn",
                      mobileTap,
                      "min-w-[3.75rem] flex-1",
                      pokerActionButtonClass(
                        !!humanActions?.canCheck,
                        humanTurnActive,
                        "call",
                      ),
                    )}
                    disabled={!humanTurnActive || !humanActions?.canCheck}
                    title={humanActions?.disabledHint ?? actionHint ?? undefined}
                    onClick={onHumanCheck}
                  >
                    Check
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "arena-action-btn",
                      mobileTap,
                      "min-w-[3.75rem] flex-1",
                      pokerActionButtonClass(
                        !!humanActions?.canCall,
                        humanTurnActive,
                        "call",
                      ),
                    )}
                    disabled={!humanTurnActive || !humanActions?.canCall}
                    title={humanActions?.disabledHint ?? actionHint ?? undefined}
                    onClick={onHumanCall}
                  >
                    {humanActions?.canCall
                      ? `Call ${humanActions.callAmount}`
                      : "Call"}
                  </Button>
                  {!humanActions?.raiseOptions?.length ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className={cn(
                        "arena-action-btn arena-poker-btn--disabled",
                        mobileTap,
                        "min-w-[3.75rem] flex-1",
                      )}
                      disabled
                    >
                      Raise
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "arena-action-btn",
                      mobileTap,
                      "min-w-[3.75rem] flex-1",
                      pokerActionButtonClass(
                        !!humanActions?.canAllIn,
                        humanTurnActive,
                        "allin",
                      ),
                    )}
                    disabled={!humanTurnActive || !humanActions?.canAllIn}
                    title={
                      humanActions?.canAllIn
                        ? `All-in ${humanActions.allInAmount} chips`
                        : humanActions?.disabledHint ?? actionHint ?? "All-in unavailable"
                    }
                    onClick={onHumanAllIn}
                  >
                    All-in
                  </Button>
                </div>
                {!showStackDepletedUi && humanActions?.raiseOptions?.length ? (
                  <div className="arena-action-mobile-raises">
                    {renderRaiseOptionButtons(humanActions.raiseOptions)}
                  </div>
                ) : null}
              </div>

              <div className="arena-controls-desktop-hvai">
              <div className="arena-action-hvai-cluster flex min-w-0 max-w-full flex-1 flex-col gap-2 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-1.5 lg:overflow-x-auto">
                <div className="arena-action-row arena-action-row-mode min-w-0 max-w-full">
            {renderHvaiModeControl()}

            <div className="hidden flex-wrap items-center gap-1.5 sm:flex 2xl:hidden">
              <Button
                onClick={onSimulateAgentBattle}
                disabled={agentBattleDisabled}
                size="lg"
                variant="outline"
                className={cn("arena-action-btn min-w-[9rem]", actionSecondary)}
                title={
                  agentBattleReplayActive
                    ? "Replay in progress — wait for the hand to finish."
                    : controlsDisabled
                      ? actionHint ?? "Start a hand first or wait for your turn."
                      : "Spectator Mode — watch AI agents play a simulated hand"
                }
              >
                {loading && loadingMode === "agent-vs-agent" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running...
                  </>
                ) : agentBattleReplayActive ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Swords className="h-3.5 w-3.5" />
                    Agent Battle
                  </>
                )}
              </Button>
              {agentBattleReplayActive && onSkipAgentBattleReplay && !agentBattleSpectator ? (
                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "arena-action-btn min-w-[9rem]",
                    actionPrimary,
                  )}
                  title="Skip local animations — shows final result on this device only"
                  onClick={onSkipAgentBattleReplay}
                >
                  Skip
                </Button>
              ) : null}
              {onOpenMenu ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="arena-action-btn h-9 border-[var(--arena-border)] text-[var(--arena-cyan)] text-xs"
                  onClick={onOpenMenu}
                >
                  Menu
                </Button>
              ) : null}
            </div>

            {nextStepEnabled && nextStep && !resetStacksEnabled ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "arena-action-flow-btn arena-action-btn min-w-0 max-sm:min-w-[8.5rem] sm:min-w-[9.5rem]",
                  actionPrimary,
                )}
                onClick={handleNextStep}
              >
                {nextStep.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}

            {newHandEnabled && onStepDemoReset ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "arena-action-flow-btn arena-action-btn min-w-0 max-sm:min-w-[7.5rem] sm:min-w-[9rem]",
                  actionReset,
                )}
                onClick={onStepDemoReset}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                New Hand
              </Button>
            ) : null}

            {showDevResetStacks ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "arena-action-flow-btn arena-action-btn min-w-0 max-sm:min-w-[8.5rem] sm:min-w-[11rem] border-2 border-amber-500/40 bg-amber-950/30 font-bold text-amber-200",
                  "hover:bg-amber-950/50",
                )}
                onClick={onResetDemoStacks}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Dev reset stacks
              </Button>
            ) : null}
                </div>

                <div className="arena-action-row arena-action-row-poker min-w-0 max-w-full">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "arena-action-btn min-w-[3.5rem] xl:min-w-[4.5rem]",
                pokerActionButtonClass(
                  !!humanActions?.canFold,
                  humanTurnActive,
                  "fold",
                ),
              )}
              disabled={!humanTurnActive || !humanActions?.canFold}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanFold}
            >
              Fold
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "arena-action-btn min-w-[3.5rem] xl:min-w-[4.5rem]",
                pokerActionButtonClass(
                  !!humanActions?.canCheck,
                  humanTurnActive,
                  "call",
                ),
              )}
              disabled={!humanTurnActive || !humanActions?.canCheck}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanCheck}
            >
              Check
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "arena-action-btn min-w-[3.5rem] xl:min-w-[4.5rem]",
                pokerActionButtonClass(
                  !!humanActions?.canCall,
                  humanTurnActive,
                  "call",
                ),
              )}
              disabled={!humanTurnActive || !humanActions?.canCall}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanCall}
            >
              {humanActions?.canCall
                ? `Call ${humanActions.callAmount}`
                : "Call"}
            </Button>
            {showStackDepletedUi ? (
              <Button
                variant="outline"
                size="lg"
                className="arena-action-btn arena-poker-btn--disabled min-w-[3.5rem] xl:min-w-[4.5rem]"
                disabled
              >
                Raise
              </Button>
            ) : humanActions?.raiseOptions?.length ? (
              renderRaiseOptionButtons(humanActions.raiseOptions)
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="arena-action-btn arena-poker-btn--disabled min-w-[3.5rem] xl:min-w-[4.5rem]"
                disabled
              >
                Raise
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "arena-action-btn min-w-[3.5rem] xl:min-w-[4.5rem]",
                pokerActionButtonClass(
                  !!humanActions?.canAllIn,
                  humanTurnActive,
                  "allin",
                ),
              )}
              disabled={!humanTurnActive || !humanActions?.canAllIn}
              title={
                humanActions?.canAllIn
                  ? `All-in ${humanActions.allInAmount} chips`
                  : humanActions?.disabledHint ?? actionHint ?? "All-in unavailable"
              }
              aria-label={
                humanActions?.canAllIn
                  ? `All-in ${humanActions.allInAmount} chips`
                  : "All-in — unavailable"
              }
              onClick={onHumanAllIn}
            >
              All-in
            </Button>
                </div>
              </div>

              <div className="arena-action-row hidden min-w-0 shrink-0 2xl:flex 2xl:justify-end">
            <Button
              onClick={onSimulateAgentBattle}
              disabled={agentBattleDisabled}
              size="lg"
              variant="outline"
              className={cn("arena-action-btn min-w-[160px] text-sm font-semibold", actionSecondary)}
              title={
                agentBattleReplayActive
                  ? "Replay in progress — wait for the hand to finish."
                  : controlsDisabled
                    ? actionHint ?? "Start a hand first or wait for your turn."
                    : "Spectator Mode — watch AI agents play a simulated hand"
              }
            >
              {loading && loadingMode === "agent-vs-agent" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </>
              ) : agentBattleReplayActive ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Swords className="h-3.5 w-3.5" />
                  Agent Battle
                </>
              )}
            </Button>
            {agentBattleReplayActive && onSkipAgentBattleReplay && !agentBattleSpectator ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "arena-action-btn min-w-[160px] text-sm font-semibold",
                  actionPrimary,
                )}
                title="Skip local animations — shows final result on this device only"
                onClick={onSkipAgentBattleReplay}
              >
                Skip animations
              </Button>
            ) : null}
              </div>
              </div>
            </>
          )}
        </div>

        {disabled && disabledReason ? (
          <p className="mt-2 text-center text-xs font-medium text-[var(--arena-muted)]">
            {disabledReason}
          </p>
        ) : null}

        {error ? (
          <p
            className={cn(
              "text-center text-xs leading-snug text-red-400",
              compactSharedSpectatorBar ? "mt-1" : "mt-2",
            )}
          >
            {error}
          </p>
        ) : actionHint ? (
          <p
            className={cn(
              "text-center text-xs leading-snug",
              compactSharedSpectatorBar ? "mt-1" : "mt-2 leading-relaxed",
              humanTurnActive
                ? "text-[var(--arena-cyan)]/90"
                : agentBattleSpectator
                  ? "text-[var(--arena-cyan)]/85"
                  : showStackDepletedUi
                    ? "text-[var(--arena-cyan)]/90"
                    : nextStepEnabled
                    ? "font-medium text-[var(--arena-cyan)]/85"
                    : "text-muted-foreground",
            )}
          >
            {actionHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
