import { BluffBot, ChipHunter, RiverMind } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import {
  type AgentBattleRaiseTier,
  computeAgentBattleRaiseTotal,
  pickAgentBattleRaiseTier,
} from "@/lib/poker/agentBattleSizing";
import { amountToCall } from "@/lib/poker/betting";
import {
  analyzePostflopHand,
  isDryBoard,
  isMonsterMadeHand,
  isScaryBoard,
  type DrawInfo,
  type HandProfile,
} from "@/lib/poker/handAnalysis";
import type { GameState, HandRank, Player } from "@/lib/poker/types";

export type PostflopHandProfile = HandProfile & {
  /** Legacy score 0–100 for compatibility. */
  score: number;
  rank: HandRank;
  hasDraw: boolean;
  hasPairOrBetter: boolean;
  boardTexture: { isPaired: boolean; isFlushy: boolean; isConnected: boolean };
  isStrong: boolean;
  isMedium: boolean;
  isWeak: boolean;
  isDryBoard: boolean;
  isScaryBoard: boolean;
};

export type BoardTexture = {
  isPaired: boolean;
  isFlushy: boolean;
  isConnected: boolean;
};

type BetPressure = "small" | "medium" | "large" | "pot";

type BetContext = {
  toCall: number;
  pot: number;
  callPotRatio: number;
  pressure: BetPressure;
};

type AgentStyle = {
  aggressive: boolean;
  tight: boolean;
  bluffHeavy: boolean;
};

function streetFromStage(stage: GameState["stage"]): "flop" | "turn" | "river" {
  if (stage === "turn") return "turn";
  if (stage === "river") return "river";
  return "flop";
}

function betContext(state: GameState, toCall: number): BetContext {
  const pot = state.pot;
  const potAfter = pot + toCall;
  const callPotRatio = toCall > 0 ? toCall / Math.max(1, potAfter) : 0;
  const bb = state.bigBlind;

  let pressure: BetPressure = "small";
  if (callPotRatio >= 0.5 || toCall >= pot * 0.85) pressure = "pot";
  else if (callPotRatio >= 0.35 || toCall >= bb * 15) pressure = "large";
  else if (callPotRatio >= 0.2 || toCall >= bb * 6) pressure = "medium";

  return { toCall, pot, callPotRatio, pressure };
}

export function evaluateAgentBattlePostflop(
  player: Player,
  state: GameState,
): PostflopHandProfile {
  const street = streetFromStage(state.stage);
  const board = state.communityCards;
  const profile = analyzePostflopHand(player.holeCards, board, street);

  return {
    ...profile,
    rank: profile.rank ?? "high_card",
    score: profile.strength,
    hasDraw: profile.draws.hasEquityDraw,
    hasPairOrBetter: profile.madeHand !== "high_card" && profile.madeHand !== undefined,
    boardTexture: {
      isPaired: profile.board.paired,
      isFlushy: profile.board.flushHeavy,
      isConnected: profile.board.connected,
    },
    isStrong: profile.tier === "premium" || profile.tier === "strong",
    isMedium: profile.tier === "playable" || profile.tier === "speculative",
    isWeak: profile.tier === "weak",
    isDryBoard: isDryBoard(profile.board),
    isScaryBoard: isScaryBoard(profile.board),
  };
}

function agentStyle(agentId: string): AgentStyle {
  switch (agentId) {
    case BluffBot.id:
      return { aggressive: true, tight: false, bluffHeavy: true };
    case RiverMind.id:
      return { aggressive: false, tight: true, bluffHeavy: false };
    case ChipHunter.id:
      return { aggressive: true, tight: false, bluffHeavy: false };
    default:
      return { aggressive: false, tight: false, bluffHeavy: false };
  }
}

function bluffSeed(player: Player, state: GameState): number {
  return (
    player.holeCards.reduce((s, c) => s + c.rank.charCodeAt(0), 0) +
    state.communityCards.length * 7
  );
}

function boardPhrase(profile: PostflopHandProfile): string {
  if (profile.isDryBoard) return " on a dry board";
  if (profile.board.summary === "paired board") return " on a paired board";
  if (profile.isScaryBoard) return ` on a ${profile.board.summary}`;
  return "";
}

function drawLabel(draws: DrawInfo): string {
  if (draws.flushDraw && draws.openEndedStraight) return "Combo draw";
  if (draws.flushDraw && draws.overcards) return "Flush draw with overcards";
  if (draws.flushDraw) return "Flush draw";
  if (draws.openEndedStraight) return "Open-ended straight draw";
  if (draws.gutshot) return "Gutshot";
  return "Draw";
}

function raiseTier(
  player: Player,
  state: GameState,
  tier: AgentBattleRaiseTier,
  reasoning: string,
  confidence: number,
): AgentDecision {
  return {
    action: "raise",
    amount: computeAgentBattleRaiseTotal(player, state, tier),
    confidence,
    reasoning,
  };
}

function sizedRaise(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  style: AgentStyle,
  intent: "value" | "semi_bluff" | "bluff" | "thin",
  reasoning: string,
  confidence: number,
): AgentDecision {
  const tier = pickAgentBattleRaiseTier(intent, {
    isMonster: isMonsterMadeHand(profile.madeHand),
    isStrongMade:
      profile.madeHand === "two_pair" ||
      profile.madeHand === "trips" ||
      profile.tier === "strong",
    isTopPair: profile.madeHand === "top_pair" || profile.isOverpair,
    isComboDraw: profile.draws.flushDraw && profile.draws.openEndedStraight,
    dryBoard: profile.isDryBoard,
    scaryBoard: profile.isScaryBoard,
    aggressive: style.aggressive,
    tight: style.tight,
    river: profile.street === "river",
  });
  return raiseTier(player, state, tier, reasoning, confidence);
}

function check(reasoning: string, confidence = 0.62): AgentDecision {
  return { action: "check", confidence, reasoning };
}

function call(amount: number, reasoning: string, confidence = 0.7): AgentDecision {
  return { action: "call", amount, confidence, reasoning };
}

function fold(reasoning: string, confidence = 0.8): AgentDecision {
  return { action: "fold", confidence, reasoning };
}

function shouldFoldWeak(
  profile: PostflopHandProfile,
  ctx: BetContext,
  style: AgentStyle,
): boolean {
  const { pressure } = ctx;
  if (profile.tier === "premium" || profile.tier === "strong") return false;
  if (profile.madeHand === "top_pair" && (profile.goodKicker || profile.isOverpair)) {
    return pressure === "pot" && style.tight && profile.isScaryBoard;
  }
  if (pressure === "small") return style.tight && profile.tier === "weak";
  if (pressure === "medium") {
    return profile.tier === "weak" || (style.tight && profile.tier === "speculative");
  }
  if (pressure === "large" || pressure === "pot") {
    return profile.tier !== "playable" || (profile.tier === "playable" && !profile.hasDraw);
  }
  return profile.tier === "weak";
}

function facingBetDecision(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  style: AgentStyle,
  ctx: BetContext,
  opts: {
    callReason: string;
    foldReason: string;
    raiseReason?: string;
    allowRaise?: boolean;
  },
): AgentDecision {
  const { toCall, pressure } = ctx;

  if (
    opts.allowRaise &&
    opts.raiseReason &&
    (profile.isStrong || profile.tier === "premium") &&
    (pressure === "small" || pressure === "medium")
  ) {
    return sizedRaise(
      player,
      state,
      profile,
      style,
      "value",
      opts.raiseReason,
      0.84,
    );
  }

  if (shouldFoldWeak(profile, ctx, style)) {
    return fold(opts.foldReason);
  }

  if (profile.draws.hasEquityDraw && profile.street !== "river") {
    if (pressure === "large" || pressure === "pot") {
      if (profile.draws.flushDraw && profile.draws.openEndedStraight) {
        return call(toCall, `${drawLabel(profile.draws)} — calling with strong draw equity`, 0.66);
      }
      if (style.tight && profile.tier === "speculative") {
        return fold(`${drawLabel(profile.draws)} — folding to ${pressure} pressure`);
      }
    }
    return call(toCall, `${drawLabel(profile.draws)} with pot odds — continuing`, 0.68);
  }

  if (toCall <= ctx.pot * 0.35 || pressure === "small") {
    return call(toCall, opts.callReason, 0.72);
  }

  if (profile.isStrong || profile.madeHand === "top_pair") {
    return call(toCall, opts.callReason, 0.74);
  }

  return fold(opts.foldReason);
}

function pokerMasterPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  ctx: BetContext,
): AgentDecision {
  const style = agentStyle(player.id);
  const street = profile.street;

  if (profile.tier === "premium" || profile.isStrong) {
    if (canCheck) {
      const reason = isMonsterMadeHand(profile.madeHand)
        ? `Rivered ${profile.label} — value betting big`
        : `Strong made hand — raising for value${boardPhrase(profile)}`;
      return sizedRaise(player, state, profile, style, "value", reason, 0.88);
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: `${profile.label}${boardPhrase(profile)} — calling with showdown value`,
      foldReason: "Weak high-card hand facing pressure — folding",
      raiseReason: `Strong made hand — raising for value`,
      allowRaise: true,
    });
  }

  if (profile.madeHand === "top_pair") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        profile.goodKicker ? "value" : "thin",
        `Top pair${boardPhrase(profile)} — betting for value`,
        0.76,
      );
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: `Top pair with good kicker — continuing against ${ctx.pressure} pressure`,
      foldReason: `Top pair${boardPhrase(profile)} — folding to heavy pressure`,
      allowRaise: profile.goodKicker && ctx.pressure === "small",
      raiseReason: `Top pair${boardPhrase(profile)} — value-raising small`,
    });
  }

  if (profile.draws.hasEquityDraw && street !== "river") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "semi_bluff",
        `${drawLabel(profile.draws)} — semi-bluffing`,
        0.62,
      );
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: `${drawLabel(profile.draws)} with pot odds — continuing`,
      foldReason: `${drawLabel(profile.draws)} — folding to pressure`,
    });
  }

  if (canCheck) return check(`Medium hand — balanced pot control on the ${street}`);
  if (ctx.pressure === "small" && profile.tier === "playable") {
    return call(ctx.toCall, "Balanced range continues versus small pressure", 0.62);
  }
  return fold("Weak high-card hand facing pressure — folding");
}

function bluffBotPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  ctx: BetContext,
): AgentDecision {
  const style = agentStyle(player.id);
  const street = profile.street;
  const seed = bluffSeed(player, state);
  const bluffSpot = seed % 3 !== 0;

  if (profile.isStrong || profile.tier === "premium") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "value",
        `${profile.label}${boardPhrase(profile)} — BluffBot bets for value`,
        0.78,
      );
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: "BluffBot calls — keeping the pot contested",
      foldReason: "BluffBot gives up a dead spot",
      raiseReason: "BluffBot re-raises with a strong hand",
      allowRaise: true,
    });
  }

  if (profile.draws.hasEquityDraw && street !== "river") {
    if (canCheck && bluffSpot) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "semi_bluff",
        `${drawLabel(profile.draws)} — semi-bluffing with fold equity`,
        0.58,
      );
    }
    if (!canCheck) {
      return facingBetDecision(player, state, profile, style, ctx, {
        callReason: "BluffBot floats with equity",
        foldReason: "BluffBot gives up a dead spot",
        allowRaise: bluffSpot && ctx.pressure === "small",
        raiseReason: `${drawLabel(profile.draws)} — semi-bluff raise`,
      });
    }
  }

  if (canCheck) {
    if (bluffSpot || profile.isWeak) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "bluff",
        street === "river" && profile.isWeak
          ? "Missed draw on river — bluffing with blocker pressure"
          : `BluffBot fires a pressure bet on the ${street}`,
        0.52,
      );
    }
    return check("BluffBot checks — setting up a later bluff");
  }

  if (ctx.toCall <= ctx.pot * 0.45 || bluffSpot) {
    return call(ctx.toCall, "BluffBot calls wide — action over fold", 0.66);
  }
  return fold("BluffBot gives up a dead spot");
}

function riverMindPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  ctx: BetContext,
): AgentDecision {
  const style = agentStyle(player.id);
  const street = profile.street;

  if (profile.isStrong || profile.tier === "premium") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "value",
        `Tight value bet — ${profile.label}${boardPhrase(profile)}`,
        0.9,
      );
    }
    if (ctx.pressure === "pot" && profile.tier !== "premium") {
      return fold("Tight profile folds marginal strength to pot pressure");
    }
    return call(ctx.toCall, "Tight call with a strong hand", 0.84);
  }

  if (profile.madeHand === "top_pair" && profile.goodKicker) {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "thin",
        `Top pair on a dry ${street} — betting for value`,
        0.74,
      );
    }
    if (ctx.pressure === "large" || ctx.pressure === "pot") {
      return fold("Tight profile folds marginal pair to large bet");
    }
    return call(ctx.toCall, "Top pair — tight continue versus medium pressure", 0.7);
  }

  if (profile.draws.hasEquityDraw && street !== "river" && ctx.pressure !== "pot") {
    if (canCheck) return check("Tight check — draw with pot control");
    if (ctx.toCall <= ctx.pot * 0.28) {
      return call(ctx.toCall, "Tight draw peel with good price", 0.58);
    }
  }

  if (canCheck) return check(`Tight check with a weak hand on the ${street}`);
  if (ctx.pressure === "small" && profile.tier === "playable") {
    return call(ctx.toCall, "Tight continue with a playable hand", 0.62);
  }
  return fold("Tight profile folds weak hand to pressure");
}

function chipHunterPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  ctx: BetContext,
): AgentDecision {
  const style = agentStyle(player.id);
  const street = profile.street;

  if (profile.isStrong || profile.tier === "premium") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "value",
        profile.isScaryBoard
          ? `ChipHunter attacks a scary board with ${profile.label}`
          : `Two pair${boardPhrase(profile)} — raising larger for value`,
        0.86,
      );
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: "ChipHunter calls — keeping initiative",
      foldReason: "ChipHunter releases a hopeless hand",
      raiseReason: "ChipHunter re-raises to build the pot",
      allowRaise: true,
    });
  }

  if (profile.draws.hasEquityDraw && street !== "river") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        "semi_bluff",
        `${drawLabel(profile.draws)} — semi-bluffing with fold equity`,
        0.72,
      );
    }
    return facingBetDecision(player, state, profile, style, ctx, {
      callReason: "Draw equity — ChipHunter stays in",
      foldReason: "ChipHunter releases a medium draw to big pressure",
      allowRaise: ctx.pressure === "small",
      raiseReason: "ChipHunter semi-bluffs a strong draw",
    });
  }

  if (profile.madeHand === "top_pair" || profile.tier === "playable") {
    if (canCheck) {
      return sizedRaise(
        player,
        state,
        profile,
        style,
        street === "turn" ? "value" : "thin",
        `ChipHunter bets medium strength on the ${street}`,
        0.7,
      );
    }
    if (ctx.pressure !== "pot") {
      return call(ctx.toCall, "ChipHunter calls — aggressive wide defense", 0.68);
    }
  }

  if (canCheck) {
    return sizedRaise(
      player,
      state,
      profile,
      style,
      profile.isScaryBoard ? "bluff" : "semi_bluff",
      "ChipHunter opens with aggressive pressure",
      0.62,
    );
  }

  if (ctx.toCall <= ctx.pot * 0.4) {
    return call(ctx.toCall, "ChipHunter defends wide postflop", 0.64);
  }
  return fold("ChipHunter releases a hopeless hand");
}

export function getAgentBattlePostflopDecision(
  player: Player,
  state: GameState,
): AgentDecision {
  const toCall = amountToCall(player, state.currentBet);
  const canCheck = toCall === 0;
  const profile = evaluateAgentBattlePostflop(player, state);
  const ctx = betContext(state, toCall);

  switch (player.id) {
    case PokerMaster.id:
      return pokerMasterPostflop(player, state, profile, canCheck, ctx);
    case BluffBot.id:
      return bluffBotPostflop(player, state, profile, canCheck, ctx);
    case RiverMind.id:
      return riverMindPostflop(player, state, profile, canCheck, ctx);
    case ChipHunter.id:
      return chipHunterPostflop(player, state, profile, canCheck, ctx);
    default:
      return canCheck
        ? check("default postflop check")
        : toCall <= player.stack
          ? call(toCall, "default postflop call", 0.5)
          : fold("default postflop fold");
  }
}
