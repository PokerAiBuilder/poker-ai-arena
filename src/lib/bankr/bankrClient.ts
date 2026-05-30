import type {
  BankrClientConfig,
  BankrEnvironment,
  BankrSkillCallRequest,
  BankrSkillCallResult,
  BankrStatusResponse,
} from "@/lib/bankr/types";

function resolveEnvironment(): BankrEnvironment {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function getBankrConfig(): BankrClientConfig {
  return {
    apiKey: process.env.BANKR_API_KEY?.trim() || undefined,
    agentId: process.env.BANKR_AGENT_ID?.trim() || undefined,
    skillsUrl: process.env.BANKR_SKILLS_URL?.trim() || undefined,
    environment: resolveEnvironment(),
  };
}

export function isBankrConfigured(): boolean {
  const config = getBankrConfig();
  return Boolean(config.apiKey && config.agentId && config.skillsUrl);
}

export function maskAgentId(agentId?: string): string | null {
  if (!agentId) return null;
  if (agentId.length <= 6) return `${agentId.slice(0, 2)}***`;
  return `${agentId.slice(0, 4)}…${agentId.slice(-2)}`;
}

export function getBankrStatus(): BankrStatusResponse {
  const config = getBankrConfig();
  const configured = isBankrConfigured();

  return {
    configured,
    environment: config.environment,
    agentId: configured ? (config.agentId ?? null) : null,
    agentIdMasked: maskAgentId(config.agentId),
    skillsUrl: config.skillsUrl ? "configured" : "missing",
    mode: configured ? "configured" : "mock",
    note: configured
      ? "Bankr credentials detected. Real skill calls require verified Bankr API documentation."
      : "Bankr is not configured. Mock skill responses are returned for demo.",
  };
}

export async function callBankrSkill(
  request: BankrSkillCallRequest,
): Promise<BankrSkillCallResult> {
  if (!isBankrConfigured()) {
    return {
      success: true,
      mock: true,
      skill: request.skill,
      action: request.action,
      data: {
        message: "Bankr is not configured. Mock skill response returned.",
        params: request.params,
      },
    };
  }

  const config = getBankrConfig();

  // TODO(Stage 6+): Replace with real Bankr Skills HTTP call once official API is confirmed.
  // TODO: POST to `${config.skillsUrl}` with Authorization header (never log apiKey).
  // TODO: Map request.skill + request.action to documented Bankr skill endpoints.
  // TODO: Handle rate limits, auth errors, and structured skill payloads.

  void config.apiKey;
  void config.skillsUrl;

  return {
    success: false,
    mock: false,
    skill: request.skill,
    action: request.action,
    error:
      "Bankr credentials are set but real skill calls are not implemented yet. See README Bankr section.",
  };
}

/** @deprecated Use getBankrConfig() / callBankrSkill() */
export function createBankrClient() {
  return {
    isConfigured: isBankrConfigured,
    getConfig: getBankrConfig,
    callSkill: callBankrSkill,
  };
}
