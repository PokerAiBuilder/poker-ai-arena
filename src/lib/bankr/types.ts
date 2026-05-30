export type BankrEnvironment = "development" | "production";

export type BankrClientConfig = {
  apiKey?: string;
  agentId?: string;
  skillsUrl?: string;
  environment: BankrEnvironment;
};

export type BankrSkillCallRequest = {
  skill: string;
  action: string;
  params: Record<string, unknown>;
};

export type BankrSkillCallResult = {
  success: boolean;
  skill: string;
  action: string;
  data?: unknown;
  error?: string;
  mock?: boolean;
};

export type BankrStatusResponse = {
  configured: boolean;
  environment: BankrEnvironment;
  agentId: string | null;
  agentIdMasked: string | null;
  skillsUrl: "configured" | "missing";
  mode: "mock" | "configured";
  note: string;
};

export type BankrAgentProfile = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  walletRequired: boolean;
  x402Required: boolean;
};
