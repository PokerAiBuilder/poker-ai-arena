import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@/lib/onchain/chains";
import {
  getEscrowContractAddress,
  TEST_STAKE_ESCROW_ABI,
  type EscrowOnChainSession,
  mapEscrowSession,
} from "@/lib/onchain/escrowAbi";

export type EscrowServerConfig = {
  configured: boolean;
  escrowAddress: Address | null;
  rpcUrl: string | null;
  hasDeployerKey: boolean;
};

export function getEscrowServerConfig(): EscrowServerConfig {
  const escrowAddress = getEscrowContractAddress();
  const rpcUrl =
    process.env.BASE_SEPOLIA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_RPC_URL?.trim() ||
    baseSepolia.rpcUrls.default.http[0] ||
    null;
  const deployerKey = process.env.TESTNET_DEPLOYER_PRIVATE_KEY?.trim();

  return {
    configured: Boolean(escrowAddress && rpcUrl && deployerKey),
    escrowAddress,
    rpcUrl,
    hasDeployerKey: Boolean(deployerKey),
  };
}

function getServerRpcUrl(): string {
  const { rpcUrl } = getEscrowServerConfig();
  if (!rpcUrl) {
    throw new Error("Base Sepolia RPC URL is not configured.");
  }
  return rpcUrl;
}

function getServerEscrowAddress(): Address {
  const address = getEscrowContractAddress();
  if (!address) {
    throw new Error("Testnet escrow address is not configured.");
  }
  return address;
}

function getDeployerAccount() {
  const raw = process.env.TESTNET_DEPLOYER_PRIVATE_KEY?.trim();
  if (!raw) {
    throw new Error("TESTNET_DEPLOYER_PRIVATE_KEY is not configured.");
  }
  const privateKey = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
  return privateKeyToAccount(privateKey);
}

export function createEscrowPublicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(getServerRpcUrl()),
  });
}

export async function readEscrowSessionServer(
  sessionId: string | bigint,
): Promise<EscrowOnChainSession | null> {
  const escrowAddress = getEscrowContractAddress();
  if (!escrowAddress) return null;

  const id = BigInt(sessionId);
  if (id <= BigInt(0)) return null;

  try {
    const client = createEscrowPublicClient();
    const session = await client.readContract({
      address: escrowAddress,
      abi: TEST_STAKE_ESCROW_ABI,
      functionName: "getSession",
      args: [id],
    });
    return mapEscrowSession(session as Parameters<typeof mapEscrowSession>[0]);
  } catch {
    return null;
  }
}

export async function readEscrowContractBalanceServer(): Promise<bigint> {
  const escrowAddress = getServerEscrowAddress();
  const client = createEscrowPublicClient();
  return client.getBalance({ address: escrowAddress });
}

export type ServerResolveEscrowResult = {
  txHash: Hash | null;
  sessionId: string;
  payoutAmountWei: string;
  resultHash: `0x${string}`;
  status: "resolved";
  alreadyResolved: boolean;
};

export async function resolveEscrowSessionServer(
  sessionId: bigint,
  resultHash: `0x${string}`,
  payoutAmountWei: bigint,
): Promise<ServerResolveEscrowResult> {
  const escrowAddress = getServerEscrowAddress();
  const account = getDeployerAccount();
  const publicClient = createEscrowPublicClient();

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(getServerRpcUrl()),
  });

  const hash = await walletClient.writeContract({
    address: escrowAddress,
    abi: TEST_STAKE_ESCROW_ABI,
    functionName: "resolveSession",
    args: [sessionId, resultHash, payoutAmountWei],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Escrow resolve transaction failed on Base Sepolia.");
  }

  return {
    txHash: hash,
    sessionId: sessionId.toString(),
    payoutAmountWei: payoutAmountWei.toString(),
    resultHash,
    status: "resolved",
    alreadyResolved: false,
  };
}
