// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ISettlementAdapter } from "../interfaces/ISettlementAdapter.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SuperfluidSettlementAdapter
/// @notice Settlement adapter that uses Superfluid GDA streams for continuous payments.
///         Wraps ISuperToken and GDA pool operations. Flow rates are set via the GDA
///         distributeFlow pattern: the adapter acts as pool admin, providers are members.
///
///         In production this would call ISuperfluid host + GDA forwarder. For testnet
///         deployment without Superfluid dependency, it mocks the streaming behavior
///         with linear accrual tracking.
contract SuperfluidSettlementAdapter is ISettlementAdapter {
    using SafeERC20 for IERC20;

    // ──────────────────── Constants ────────────────────

    bytes32 public constant RAIL_ID = keccak256("SUPERFLUID");

    // ──────────────────── Storage ────────────────────

    IERC20 public immutable token;
    address public immutable pipeline;

    struct Stream {
        address provider;
        uint256 flowRate;
        uint256 startedAt;
        bool active;
    }

    struct EscrowEntry {
        address depositor;
        uint256 amount;
        bool released;
    }

    mapping(bytes32 streamId => Stream) internal _streams;
    mapping(bytes32 jobId => EscrowEntry) internal _escrows;
    uint256 internal _streamNonce;

    // ──────────────────── Errors ────────────────────

    error OnlyPipeline();
    error StreamNotActive();
    error EscrowNotFound();
    error EscrowAlreadyReleased();
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

        // Settle accrued amount before adjusting
        uint256 accrued = _accruedAmount(s);
        if (accrued > 0) {
            token.safeTransfer(s.provider, accrued);
        }

        s.flowRate = newFlowRate;
        s.startedAt = block.timestamp;

        if (newFlowRate == 0) {
            s.active = false;
        }

        emit StreamAdjusted(streamId, newFlowRate);
    }

    /// @inheritdoc ISettlementAdapter
    function settleCompletion(bytes32 jobId, address provider, uint256 amount, bytes calldata)
        external
        onlyPipeline
    {
        if (amount == 0) revert ZeroAmount();
        token.safeTransfer(provider, amount);
        emit CompletionSettled(jobId, provider, amount);
    }

    /// @inheritdoc ISettlementAdapter
    function escrow(bytes32 jobId, uint256 amount) external onlyPipeline {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        _escrows[jobId] = EscrowEntry({
            depositor: msg.sender,
            amount: amount,
            released: false
        });
        emit Escrowed(jobId, amount);
    }

    /// @inheritdoc ISettlementAdapter
    function releaseEscrow(bytes32 jobId, address recipient) external onlyPipeline {
        EscrowEntry storage e = _escrows[jobId];
        if (e.amount == 0) revert EscrowNotFound();
        if (e.released) revert EscrowAlreadyReleased();

        e.released = true;
        token.safeTransfer(recipient, e.amount);
        emit EscrowReleased(jobId, recipient, e.amount);
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc ISettlementAdapter
    function getStreamFlowRate(bytes32 streamId) external view override returns (uint256) {
        return _streams[streamId].flowRate;
    }

    /// @inheritdoc ISettlementAdapter
    function getEscrowedAmount(bytes32 jobId) external view override returns (uint256) {
        EscrowEntry storage e = _escrows[jobId];
        if (e.released) return 0;
        return e.amount;
    }

    // ──────────────────── Internal ────────────────────

    function _accruedAmount(Stream storage s) internal view returns (uint256) {
        if (!s.active || s.flowRate == 0) return 0;
        return s.flowRate * (block.timestamp - s.startedAt);
    }
}
