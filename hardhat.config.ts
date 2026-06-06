import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const deployerKey = process.env.TESTNET_DEPLOYER_PRIVATE_KEY;
const baseSepoliaRpc =
  process.env.BASE_SEPOLIA_RPC_URL ??
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ??
  "https://sepolia.base.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache/hardhat",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: baseSepoliaRpc,
      chainId: 84532,
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
};

export default config;
