export type X402Network = "base" | "base-sepolia";

export type X402PaymentMode = "mock" | "real";

export type X402PaymentRequest = {
  amount: string;
  currency: "USDC";
  network: X402Network;
  receiverAddress: string;
  description: string;
};

export type X402PaymentResult = {
  success: boolean;
  mode: X402PaymentMode;
  txHash?: string;
  receiptId?: string;
  amount: string;
  currency: "USDC";
  network: X402Network;
  paidAt: string;
  error?: string;
};

const DEFAULT_RECEIVER = "0x0000000000000000000000000000000000000000";

function resolveNetwork(): X402Network {
  return Number(process.env.NEXT_PUBLIC_CHAIN_ID) === 8453
    ? "base"
    : "base-sepolia";
}

export function getNetworkLabel(network: X402Network): string {
  return network === "base" ? "Base Mainnet" : "Base Sepolia";
}

export function getEntryFeeConfig(): X402PaymentRequest {
  const amount = process.env.X402_ENTRY_FEE_USDC?.trim() || "0.01";
  const receiverAddress =
    process.env.X402_RECEIVER_ADDRESS?.trim() || DEFAULT_RECEIVER;

  return {
    amount,
    currency: "USDC",
    network: resolveNetwork(),
    receiverAddress,
    description: "Poker AI Arena session entry fee (demo access)",
  };
}

function generateMockTxHash(): string {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `0xmock${suffix}${Date.now().toString(16).slice(0, 8)}`;
}

function generateReceiptId(): string {
  return `mock_rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function payEntryFeeMock(
  request: X402PaymentRequest,
): Promise<X402PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    success: true,
    mode: "mock",
    txHash: generateMockTxHash(),
    receiptId: generateReceiptId(),
    amount: request.amount,
    currency: "USDC",
    network: request.network,
    paidAt: new Date().toISOString(),
  };
}

export async function payEntryFeeReal(
  request: X402PaymentRequest,
): Promise<X402PaymentResult> {
  // TODO(Stage 5+): Call x402 facilitator at process.env.X402_FACILITATOR_URL
  // TODO: Build payment payload, verify wallet signature, confirm USDC transfer
  // TODO: Return on-chain txHash from facilitator response

  // TODO(Stage 6+): Optionally delegate to Bankr payments skill via requestPaymentSkill()
  // when Bankr credentials and official x402 skill docs are available.

  void process.env.X402_FACILITATOR_URL;

  return {
    success: false,
    mode: "real",
    amount: request.amount,
    currency: "USDC",
    network: request.network,
    paidAt: new Date().toISOString(),
    error:
      "Real x402 payment is not implemented yet. Use mock mode in development.",
  };
}

export async function payEntryFee(
  mode?: X402PaymentMode,
): Promise<X402PaymentResult> {
  const request = getEntryFeeConfig();
  const paymentMode =
    mode ?? (process.env.NODE_ENV === "development" ? "mock" : "real");

  if (paymentMode === "mock") {
    return payEntryFeeMock(request);
  }

  return payEntryFeeReal(request);
}

/** @deprecated Use payEntryFee() — kept for Bankr layer compatibility. */
export class X402Client {
  getEntryFee(): string {
    return getEntryFeeConfig().amount;
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.X402_FACILITATOR_URL && process.env.X402_RECEIVER_ADDRESS,
    );
  }

  async payEntryFee(_payerAddress: string): Promise<X402PaymentResult> {
    return payEntryFee(this.isConfigured() ? "real" : "mock");
  }
}

export function createX402Client(): X402Client {
  return new X402Client();
}
