import { NextResponse } from "next/server";
import { getBankrStatus } from "@/lib/bankr/bankrClient";

export async function GET() {
  const status = getBankrStatus();

  return NextResponse.json({
    configured: status.configured,
    environment: status.environment,
    agentId: status.agentIdMasked,
    skillsUrl: status.skillsUrl,
    mode: status.mode,
    note: status.note,
  });
}
