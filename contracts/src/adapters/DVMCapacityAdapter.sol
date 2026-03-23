// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICapacityAdapter } from "../interfaces/ICapacityAdapter.sol";
import { IStakeManager } from "../interfaces/IStakeManager.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title DVMCapacityAdapter
/// @notice Bridges NIP-90 DVM capacity signals to the BPE CapacityRegistry format.
///         DVM operators report throughput (jobs/min), latency (ms), and error rate.
///         These are normalized into a single capacity value using the same weighted
///         formula as OpenClawCapacityAdapter: throughput 50%, latency 30%, error 20%.
///         EWMA smoothing prevents capacity gaming.
contract DVMCapacityAdapter is ICapacityAdapter, EIP712 {
    using ECDSA for bytes32;

    // ──────────────────── Constants ────────────────────

    uint256 public constant BPS = 10_000;
    uint256 public constant EWMA_ALPHA_BPS = 3000; // alpha=0.3

    uint256 public constant THROUGHPUT_WEIGHT = 5000;
    uint256 public constant LATENCY_WEIGHT = 3000;
    uint256 public constant ERROR_RATE_WEIGHT = 2000;

    /// @notice Max latency for normalization (60 seconds for DVM jobs).
    uint256 public constant MAX_LATENCY_MS = 60_000;

    bytes32 public constant DOMAIN_ID = keccak256("NOSTR_DVM");

    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "DVMAttestation(bytes32 dvmId,uint256 kind,uint256 throughput,uint256 latencyMs,uint256 errorRateBps,uint256 timestamp)"
    );

    // ──────────────────── Storage ────────────────────

    IStakeManager public immutable stakeManager;

    struct DVMCapacity {
        uint256 throughput;
        uint256 latencyMs;
        uint256 errorRateBps;
    }

    struct DVMInfo {
        address operator;
        uint256 kind; // NIP-90 kind (5000-5999)
        uint256 smoothedCapacity;
        uint256 lastUpdated;
        bool active;
    }

    mapping(bytes32 dvmId => DVMInfo) internal _dvms;
    mapping(uint256 kind => bytes32[]) internal _kindDVMs;
    mapping(bytes32 dvmId => uint256) internal _dvmIndex;

    // ──────────────────── Events ────────────────────

    event DVMRegistered(bytes32 indexed dvmId, address indexed operator, uint256 kind);
    event DVMDeregistered(bytes32 indexed dvmId);
    event DVMCapacityUpdated(bytes32 indexed dvmId, uint256 raw, uint256 smoothed);

    // ──────────────────── Errors ────────────────────

    error DVMAlreadyRegistered();
    error DVMNotRegistered();
    error NotDVMOperator();
    error InsufficientStake();
    error InvalidKind();

    // ──────────────────── Constructor ────────────────────

    constructor(address stakeManager_) EIP712("Pura-DVMCapacityAdapter", "1") {
        stakeManager = IStakeManager(stakeManager_);
    }

    // ──────────────────── ICapacityAdapter ────────────────────

    /// @inheritdoc ICapacityAdapter
    function domainId() external pure override returns (bytes32) {
        return DOMAIN_ID;
    }

    /// @inheritdoc ICapacityAdapter
    function domainDescription() external pure override returns (string memory) {
        return "NIP-90 DVM: throughput (50%), latency (30%), error rate (20%)";
    }

    /// @inheritdoc ICapacityAdapter
    function normalizeCapacity(bytes calldata rawSignal) external pure override returns (uint256) {
        DVMCapacity memory cap = abi.decode(rawSignal, (DVMCapacity));
        return _normalize(cap);
    }

    /// @inheritdoc ICapacityAdapter
    function verifyAttestation(bytes calldata attestation)
        external
        view
        override
        returns (bool valid, address sink, uint256 capacity)
    {
        (
            bytes32 dvmId,
            uint256 kind,
            uint256 throughput,
            uint256 latencyMs,
            uint256 errorRateBps,
            uint256 timestamp,
            bytes memory signature
        ) = abi.decode(attestation, (bytes32, uint256, uint256, uint256, uint256, uint256, bytes));

        bytes32 structHash = keccak256(
            abi.encode(ATTESTATION_TYPEHASH, dvmId, kind, throughput, latencyMs, errorRateBps, timestamp)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        DVMInfo storage dvm = _dvms[dvmId];
        if (!dvm.active || signer != dvm.operator) {
            return (false, address(0), 0);
        }

        DVMCapacity memory cap = DVMCapacity(throughput, latencyMs, errorRateBps);
        return (true, dvm.operator, _normalize(cap));
    }

    // ──────────────────── DVM Management ────────────────────

    /// @notice Register a NIP-90 DVM with initial capacity.
    /// @param dvmId Unique identifier (e.g., hash of DVM pubkey + kind).
    /// @param kind NIP-90 kind number (5000-5999).
    /// @param initialCapacity Initial capacity metrics.
    function registerDVM(bytes32 dvmId, uint256 kind, DVMCapacity calldata initialCapacity) external {
        if (kind < 5000 || kind > 5999) revert InvalidKind();
        if (_dvms[dvmId].active) revert DVMAlreadyRegistered();

        uint256 sinkStake = stakeManager.getStake(msg.sender);
        if (sinkStake < stakeManager.minSinkStake()) revert InsufficientStake();

        uint256 normalized = _normalize(initialCapacity);
        uint256 cap = stakeManager.getCapacityCap(msg.sender);
        if (normalized > cap) normalized = cap;

        _dvms[dvmId] = DVMInfo({
            operator: msg.sender,
            kind: kind,
            smoothedCapacity: normalized,
            lastUpdated: block.timestamp,
            active: true
        });

        _dvmIndex[dvmId] = _kindDVMs[kind].length;
        _kindDVMs[kind].push(dvmId);

        emit DVMRegistered(dvmId, msg.sender, kind);
        emit DVMCapacityUpdated(dvmId, normalized, normalized);
    }

    /// @notice Deregister a DVM.
    function deregisterDVM(bytes32 dvmId) external {
        DVMInfo storage dvm = _dvms[dvmId];
        if (!dvm.active) revert DVMNotRegistered();
        if (dvm.operator != msg.sender) revert NotDVMOperator();

        dvm.active = false;

        // Swap-and-pop from kind array
        uint256 kind = dvm.kind;
        bytes32[] storage dvms = _kindDVMs[kind];
        uint256 idx = _dvmIndex[dvmId];
        uint256 lastIdx = dvms.length - 1;

        if (idx != lastIdx) {
            bytes32 lastDvmId = dvms[lastIdx];
            dvms[idx] = lastDvmId;
            _dvmIndex[lastDvmId] = idx;
        }
        dvms.pop();
        delete _dvmIndex[dvmId];

        emit DVMDeregistered(dvmId);
    }

    /// @notice Update DVM capacity metrics.
    function updateCapacity(bytes32 dvmId, DVMCapacity calldata capacity) external {
        DVMInfo storage dvm = _dvms[dvmId];
        if (!dvm.active) revert DVMNotRegistered();
        if (dvm.operator != msg.sender) revert NotDVMOperator();

        uint256 raw = _normalize(capacity);

        uint256 cap = stakeManager.getCapacityCap(msg.sender);
        if (raw > cap) raw = cap;

        // EWMA smoothing
        uint256 smoothed = (EWMA_ALPHA_BPS * raw + (BPS - EWMA_ALPHA_BPS) * dvm.smoothedCapacity) / BPS;

        dvm.smoothedCapacity = smoothed;
        dvm.lastUpdated = block.timestamp;

        emit DVMCapacityUpdated(dvmId, raw, smoothed);
    }

    // ──────────────────── Reads ────────────────────

    function getDVM(bytes32 dvmId) external view returns (DVMInfo memory) {
        return _dvms[dvmId];
    }

    function getSmoothedCapacity(bytes32 dvmId) external view returns (uint256) {
        return _dvms[dvmId].smoothedCapacity;
    }

    function getDVMsForKind(uint256 kind) external view returns (bytes32[] memory) {
        return _kindDVMs[kind];
    }

    // ──────────────────── Internal ────────────────────

    function _normalize(DVMCapacity memory cap) internal pure returns (uint256) {
        uint256 latencyComponent;
        if (cap.latencyMs >= MAX_LATENCY_MS) {
            latencyComponent = 0;
        } else {
            latencyComponent = ((MAX_LATENCY_MS - cap.latencyMs) * LATENCY_WEIGHT) / MAX_LATENCY_MS;
        }

        uint256 errorComponent;
        if (cap.errorRateBps >= BPS) {
            errorComponent = 0;
        } else {
            errorComponent = ((BPS - cap.errorRateBps) * ERROR_RATE_WEIGHT) / BPS;
        }

        uint256 qualityBps = latencyComponent + errorComponent;
        if (cap.throughput == 0) return 0;

        return (cap.throughput * qualityBps) / BPS;
    }
}
