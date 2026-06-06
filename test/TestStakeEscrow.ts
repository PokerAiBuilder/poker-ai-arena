import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

describe("TestStakeEscrow", function () {
  async function deployEscrow() {
    const Escrow = await ethers.getContractFactory("TestStakeEscrow");
    return Escrow.deploy();
  }

  it("depositStake creates session and emits StakeDeposited", async function () {
    const [owner, player] = await ethers.getSigners();
    const escrow = await deployEscrow();
    const stake = ethers.parseEther("0.001");

    await expect(
      escrow.connect(player).depositStake(1000, { value: stake }),
    )
      .to.emit(escrow, "StakeDeposited")
      .withArgs(1n, player.address, stake, 1000n);

    const session = await escrow.getSession(1);
    expect(session.player).to.equal(player.address);
    expect(session.stakeAmount).to.equal(stake);
    expect(session.chipAmount).to.equal(1000n);
    expect(session.status).to.equal(0); // Active
    expect(await escrow.nextSessionId()).to.equal(2n);
    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(
      stake,
    );
    expect(owner.address).to.not.equal(player.address);
  });

  it("claimPayout only after resolve", async function () {
    const [, player] = await ethers.getSigners();
    const escrow = await deployEscrow();
    const stake = ethers.parseEther("0.001");
    const payout = ethers.parseEther("0.0008");

    await escrow.connect(player).depositStake(1000, { value: stake });

    await expect(escrow.connect(player).claimPayout(1)).to.be.revertedWithCustomError(
      escrow,
      "SessionNotResolved",
    );

    await escrow.resolveSession(1, ethers.id("win"), payout);

    await expect(escrow.connect(player).claimPayout(1))
      .to.emit(escrow, "PayoutClaimed")
      .withArgs(1n, player.address, payout);

    const session = await escrow.getSession(1);
    expect(session.status).to.equal(2); // Claimed
    expect(session.payoutAmount).to.equal(0n);
  });

  it("emergencyRefund by owner on active session", async function () {
    const [owner, player] = await ethers.getSigners();
    const escrow = await deployEscrow();
    const stake = ethers.parseEther("0.001");

    await escrow.connect(player).depositStake(500, { value: stake });

    const playerBefore = await ethers.provider.getBalance(player.address);
    const tx = await escrow.connect(owner).emergencyRefund(1);
    const receipt = await tx.wait();
    const gas = receipt!.gasUsed * receipt!.gasPrice;

    await expect(tx)
      .to.emit(escrow, "Refunded")
      .withArgs(1n, player.address, stake);

    const session = await escrow.getSession(1);
    expect(session.status).to.equal(3); // Refunded

    const playerAfter = await ethers.provider.getBalance(player.address);
    expect(playerAfter + gas).to.be.closeTo(playerBefore + stake, ethers.parseEther("0.0001"));
  });

  it("player emergencyRefund after timeout", async function () {
    const [, player] = await ethers.getSigners();
    const escrow = await deployEscrow();
    const stake = ethers.parseEther("0.0005");

    await escrow.connect(player).depositStake(250, { value: stake });

    await expect(escrow.connect(player).emergencyRefund(1)).to.be.revertedWithCustomError(
      escrow,
      "RefundNotAllowed",
    );

    await time.increase(7 * 24 * 60 * 60 + 1);

    await expect(escrow.connect(player).emergencyRefund(1))
      .to.emit(escrow, "Refunded")
      .withArgs(1n, player.address, stake);
  });
});
