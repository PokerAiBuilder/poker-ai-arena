// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TestStakeEscrow
 * @notice Base Sepolia testnet-only escrow for test ETH stake deposits.
 * @dev Admin-only session resolution in v1.2.0-a scaffold.
 *      Signature-based result proof (resolveSession with signature) comes next.
 *      Do not deploy on mainnet. Not for real-money gambling.
 */
contract TestStakeEscrow is Ownable, Pausable, ReentrancyGuard {
    enum SessionStatus {
        Active,
        Resolved,
        Claimed,
        Refunded
    }

    struct Session {
        address player;
        uint256 stakeAmount;
        uint256 chipAmount;
        SessionStatus status;
        uint256 createdAt;
        uint256 payoutAmount;
        bytes32 resultHash;
    }

    uint256 public nextSessionId = 1;
    uint256 public refundTimeout = 7 days;

    mapping(uint256 => Session) private _sessions;

    event StakeDeposited(
        uint256 indexed sessionId,
        address indexed player,
        uint256 amount,
        uint256 chips
    );

    event SessionResolved(
        uint256 indexed sessionId,
        address indexed player,
        bytes32 result,
        uint256 payout
    );

    event PayoutClaimed(
        uint256 indexed sessionId,
        address indexed player,
        uint256 amount
    );

    event Refunded(uint256 indexed sessionId, address indexed player, uint256 amount);

    error InvalidChipAmount();
    error InvalidStakeAmount();
    error SessionNotFound();
    error SessionNotActive();
    error SessionNotResolved();
    error NothingToClaim();
    error Unauthorized();
    error RefundNotAllowed();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Deposit native test ETH and open a game session.
     * @param chipAmount Off-chain chip mapping (1000 chips = $1.00 test balance).
     * @return sessionId New escrow session identifier.
     */
    function depositStake(
        uint256 chipAmount
    ) external payable whenNotPaused nonReentrant returns (uint256 sessionId) {
        if (chipAmount == 0) revert InvalidChipAmount();
        if (msg.value == 0) revert InvalidStakeAmount();

        sessionId = nextSessionId++;
        _sessions[sessionId] = Session({
            player: msg.sender,
            stakeAmount: msg.value,
            chipAmount: chipAmount,
            status: SessionStatus.Active,
            createdAt: block.timestamp,
            payoutAmount: 0,
            resultHash: bytes32(0)
        });

        emit StakeDeposited(sessionId, msg.sender, msg.value, chipAmount);
    }

    function getSession(
        uint256 sessionId
    ) external view returns (Session memory) {
        if (sessionId == 0 || sessionId >= nextSessionId) revert SessionNotFound();
        return _sessions[sessionId];
    }

    /**
     * @notice Testnet admin resolve — placeholder until signature-based result proof.
     * @param result Opaque result hash (future signed game outcome).
     * @param payoutAmount ETH payout available to claim (0 on total loss).
     */
    function resolveSession(
        uint256 sessionId,
        bytes32 result,
        uint256 payoutAmount
    ) external onlyOwner {
        Session storage session = _sessions[sessionId];
        if (session.player == address(0)) revert SessionNotFound();
        if (session.status != SessionStatus.Active) revert SessionNotActive();

        session.status = SessionStatus.Resolved;
        session.payoutAmount = payoutAmount;
        session.resultHash = result;

        emit SessionResolved(sessionId, session.player, result, payoutAmount);
    }

    /**
     * @notice Player claims resolved payout.
     * @dev Unresolved losing sessions remain admin-settled off-chain in this scaffold.
     */
    function claimPayout(uint256 sessionId) external nonReentrant {
        Session storage session = _sessions[sessionId];
        if (session.player != msg.sender) revert Unauthorized();
        if (session.status != SessionStatus.Resolved) revert SessionNotResolved();
        if (session.payoutAmount == 0) revert NothingToClaim();

        uint256 amount = session.payoutAmount;
        session.payoutAmount = 0;
        session.status = SessionStatus.Claimed;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit PayoutClaimed(sessionId, msg.sender, amount);
    }

    /**
     * @notice Refund active stake — owner anytime, player after refundTimeout.
     */
    function emergencyRefund(uint256 sessionId) external nonReentrant {
        Session storage session = _sessions[sessionId];
        if (session.player == address(0)) revert SessionNotFound();
        if (session.status != SessionStatus.Active) revert SessionNotActive();

        bool isOwnerCaller = msg.sender == owner();
        bool isTimedOutPlayer = msg.sender == session.player &&
            block.timestamp >= session.createdAt + refundTimeout;
        if (!isOwnerCaller && !isTimedOutPlayer) revert RefundNotAllowed();

        address player = session.player;
        uint256 amount = session.stakeAmount;

        session.stakeAmount = 0;
        session.status = SessionStatus.Refunded;

        (bool ok, ) = payable(player).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Refunded(sessionId, player, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setRefundTimeout(uint256 timeout) external onlyOwner {
        refundTimeout = timeout;
    }

    receive() external payable {
        revert("Use depositStake");
    }
}
