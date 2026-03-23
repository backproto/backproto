// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ISettlementAdapter } from "../interfaces/ISettlementAdapter.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title LightningSettlementAdapter
/// @notice Settlement adapter for Lightning Network payments via HTLC preimage verification.
///         Job escrows use hash-time-locked contracts: the requester locks funds with a
///         payment hash, and the provider reveals the preimage to claim. If the preimage
///         is not revealed within the timeout, the requester reclaims funds.
contract LightningSettlementAdapter is ISettlementAdapter {
    using SafeERC20 for IERC20;

    // ──────────────────── Constants ────────────────────

    bytes32 public constant RAIL_ID = keccak256("LIGHTNING");

    /// @notice HTLC timeout duration in seconds (24 hours).
    uint256 public constant HTLC_TIMEOUT = 86_400;

    // ──────────────────── Storage ────────────────────

    IERC20 public immutable token;
    address public immutable pipeline;

    struct HTLC {
        address depositor;
        address provider;
        uint256 amount;
        bytes32 paymentHash;
        uint256 deadline;
        bool claimed;
        bool refunded;
    }

    struct Stream {
        address provider;
        uint256 flowRate;
        uint256 startedAt;
        bool active;
    }

    mapping(bytes32 jobId => HTLC) internal _htlcs;
    mapping(bytes32 streamId => Stream) internal _streams;
    uint256 internal _streamNonce;

    // ──────────────────── Errors ────────────────────

    error OnlyPipeline();
    error StreamNotActive();
    error InvalidPreimage();
    error HTLCExpired();
    error HTLCNotExpired();
    error HTLCAlreadyClaimed();
    error HTLCAlreadyRefunded();
    error EscrowNotFound();
    error ZeroFlowRate();
    error ZeroAmount();

    // ──────────────────── Modifiers ────────────────────

    modifier onlyPipeline() {
        if (msg.sender != pipeline) revert OnlyPipeline();
        _;
    }

    // ──────────────────── Constructor ────────────────────

    constructor(address token_, address pipeline_) {
        token = IERC20(token_);
        pipeline = pipeline_;
    }

    // ──────────────────── ISettlementAdapter ────────────────────

    /// @inheritdoc ISettlementAdapter
    function railId() external pure override returns (bytes32) {
        return RAIL_ID;
    }

    /// @inheritdoc ISettlementAdapter
    function initializeStream(address provider, uint256 flowRate)
        external
        onlyPipeline
        returns (bytes32 streamId)
    {
        if (flowRate == 0) revert ZeroFlowRate();

        streamId = keccak256(abi.encodePacked(provider, _streamNonce++));
        _streams[streamId] = Stream({
            provider: provider,
            flowRate: flowRate,
            startedAt: block.timestamp,
            active: true
        });

        emit StreamInitialized(streamId, provider, flowRate);
    }

    /// @inheritdoc ISettlementAdapter
    function adjustStream(bytes32 streamId, uint256 newFlowRate) external onlyPipeline {
        Stream storage s = _streams[streamId];
        if (!s.active) revert StreamNotActive();

        s.flowRate = newFlowRate;
        s.startedAt = block.timestamp;

        if (newFlowRate == 0) {
            s.active = false;
        }

        emit StreamAdjusted(streamId, newFlowRate);
    }

    /// @inheritdoc ISettlementAdapter
    function settleCompletion(bytes32 jobId, address provider, uint256 amount, bytes calldata proof)
        external
        onlyPipeline
    {
        HTLC storage h = _htlcs[jobId];
        if (h.amount == 0) revert EscrowNotFound();
        if (h.claimed) revert HTLCAlreadyClaimed();
        if (block.timestamp > h.deadline) revert HTLCExpired();

        // Verify preimage: sha256(proof) == paymentHash
        bytes32 computedHash = sha256(proof);
        if (computedHash != h.paymentHash) revert InvalidPreimage();

        h.claimed = true;
        token.safeTransfer(provider, amount);
        emit CompletionSettled(jobId, provider, amount);
    }

    /// @inheritdoc ISettlementAdapter
    function escrow(bytes32 jobId, uint256 amount) external onlyPipeline {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Payment hash is the jobId itself for simplicity.
        // In production, the requester would provide a separate payment hash.
        _htlcs[jobId] = HTLC({
            depositor: msg.sender,
            provider: address(0),
            amount: amount,
            paymentHash: jobId,
            deadline: block.timestamp + HTLC_TIMEOUT,
            claimed: false,
            refunded: false
        });

        emit Escrowed(jobId, amount);
    }

    /// @inheritdoc ISettlementAdapter
    function releaseEscrow(bytes32 jobId, address recipient) external onlyPipeline {
        HTLC storage h = _htlcs[jobId];
        if (h.amount == 0) revert EscrowNotFound();
        if (h.claimed) revert HTLCAlreadyClaimed();

        h.claimed = true;
        token.safeTransfer(recipient, h.amount);
        emit EscrowReleased(jobId, recipient, h.amount);
    }

    // ──────────────────── Lightning-specific ────────────────────

    /// @notice Refund expired HTLC back to depositor. Permissionless.
    function refundExpired(bytes32 jobId) external {
        HTLC storage h = _htlcs[jobId];
        if (h.amount == 0) revert EscrowNotFound();
        if (h.claimed) revert HTLCAlreadyClaimed();
        if (h.refunded) revert HTLCAlreadyRefunded();
        if (block.timestamp <= h.deadline) revert HTLCNotExpired();

        h.refunded = true;
        token.safeTransfer(h.depositor, h.amount);
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc ISettlementAdapter
    function getStreamFlowRate(bytes32 streamId) external view override returns (uint256) {
        return _streams[streamId].flowRate;
    }

    /// @inheritdoc ISettlementAdapter
    function getEscrowedAmount(bytes32 jobId) external view override returns (uint256) {
        HTLC storage h = _htlcs[jobId];
        if (h.claimed || h.refunded) return 0;
        return h.amount;
    }

    /// @notice Get HTLC details for a job.
    function getHTLC(bytes32 jobId) external view returns (
        address depositor,
        uint256 amount,
        bytes32 paymentHash,
        uint256 deadline,
        bool claimed,
        bool refunded
    ) {
        HTLC storage h = _htlcs[jobId];
        return (h.depositor, h.amount, h.paymentHash, h.deadline, h.claimed, h.refunded);
    }
}
