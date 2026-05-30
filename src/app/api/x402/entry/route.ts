import { NextResponse } from "next/server";
import {
  getEntryFeeConfig,
  payEntryFee,
  type X402PaymentMode,
} from "@/lib/bankr/x402Client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    config: getEntryFeeConfig(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      mode?: X402PaymentMode;
    };

    const mode: X402PaymentMode = body.mode === "real" ? "real" : "mock";
    const result = await payEntryFee(mode);

    if (process.env.NODE_ENV === "development") {
      console.log("[api/x402/entry]", {
        mode,
        success: result.success,
        receiptId: result.receiptId,
      });
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 501,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Entry fee payment failed";
    console.error("[api/x402/entry] error:", message);
    return NextResponse.json(
      {
        success: false,
        mode: "mock" as const,
        amount: getEntryFeeConfig().amount,
        currency: "USDC" as const,
        network: getEntryFeeConfig().network,
        paidAt: new Date().toISOString(),
        error: message,
      },
      { status: 500 },
    );
  }
}
