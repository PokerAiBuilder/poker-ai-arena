import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account — set TESTNET_DEPLOYER_PRIVATE_KEY");
  }

  console.log("Deploying TestStakeEscrow with:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance (wei):", balance.toString());

  const Escrow = await ethers.getContractFactory("TestStakeEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("TestStakeEscrow deployed to:", address);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Set NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS=${address}`);
  console.log("  2. Restart npm run dev");
  console.log("  3. Treasury direct lock remains fallback until escrow deposit is wired");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
