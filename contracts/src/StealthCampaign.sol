// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint64, externalEbool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IConfidentialUSD {
    function confidentialTransferFrom(address from, address to, euint64 amount) external returns (euint64 transferred);
}

contract StealthCampaign is ZamaEthereumConfig, Pausable, ReentrancyGuard {
    enum State { Draft, Active, FinalizationPending, Successful, Failed, Cancelled }
    struct Proposal { bytes32 evidenceHash; uint64 opensAt; uint64 closesAt; bool finalizationRequested; bool finalized; bool approved; euint64 forWeight; euint64 againstWeight; ebool outcomeHandle; }

    address public immutable founder;
    address public immutable fundingToken;
    bytes32 public immutable metadataHash;
    bytes32 public immutable termsHash;
    uint64 public immutable startAt;
    uint64 public immutable endAt;
    uint64 public immutable threshold;
    uint64 public investorCount;
    State public state;
    euint64 private _totalCommitted;
    ebool private _finalizationHandle;
    bool public proceedsWithdrawn;
    mapping(address => euint64) private _commitments;
    mapping(address => bool) public hasCommitted;
    mapping(address => bool) public refunded;
    mapping(bytes32 => Proposal) private _proposals;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;

    error OnlyFounder(); error WrongState(); error OutsideWindow(); error AlreadyRefunded(); error AlreadyVoted(); error InvalidWindow();
    event CampaignActivated(); event Committed(address indexed investor); event FinalizationRequested(bytes32 indexed handle); event CampaignFinalized(bool successful);
    event Refunded(address indexed investor); event ProceedsWithdrawn(); event ProposalCreated(bytes32 indexed proposalId, bytes32 evidenceHash); event VoteCast(bytes32 indexed proposalId, address indexed voter); event ProposalOutcomeRequested(bytes32 indexed proposalId, bytes32 handle); event ProposalFinalized(bytes32 indexed proposalId, bool approved);

    modifier onlyFounder() { if (msg.sender != founder) revert OnlyFounder(); _; }

    constructor(address founder_, address token_, bytes32 metadataHash_, bytes32 termsHash_, uint64 startAt_, uint64 endAt_, uint64 threshold_) {
        if (endAt_ <= startAt_) revert InvalidWindow();
        founder = founder_; fundingToken = token_; metadataHash = metadataHash_; termsHash = termsHash_; startAt = startAt_; endAt = endAt_; threshold = threshold_; state = State.Draft;
    }

    function activate() external onlyFounder { if (state != State.Draft) revert WrongState(); state = State.Active; emit CampaignActivated(); }

    function commit(externalEuint64 encryptedAmount, bytes calldata proof) external whenNotPaused nonReentrant {
        if (state != State.Active) revert WrongState();
        if (block.timestamp < startAt || block.timestamp > endAt) revert OutsideWindow();
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        FHE.allowTransient(amount, fundingToken);
        euint64 transferred = IConfidentialUSD(fundingToken).confidentialTransferFrom(msg.sender, address(this), amount);
        _commitments[msg.sender] = FHE.add(_commitments[msg.sender], transferred);
        _totalCommitted = FHE.add(_totalCommitted, transferred);
        FHE.allowThis(_commitments[msg.sender]); FHE.allow(_commitments[msg.sender], msg.sender); FHE.allowThis(_totalCommitted);
        if (!hasCommitted[msg.sender]) { hasCommitted[msg.sender] = true; investorCount++; }
        emit Committed(msg.sender);
    }

    function accessMyCommitment() external returns (euint64) { FHE.allow(_commitments[msg.sender], msg.sender); return _commitments[msg.sender]; }
    function accessFounderAggregate() external onlyFounder returns (euint64) { FHE.allow(_totalCommitted, founder); return _totalCommitted; }

    function requestFinalization() external {
        if (state != State.Active || block.timestamp <= endAt) revert WrongState();
        state = State.FinalizationPending;
        _finalizationHandle = FHE.ge(_totalCommitted, threshold);
        FHE.makePubliclyDecryptable(_finalizationHandle);
        emit FinalizationRequested(ebool.unwrap(_finalizationHandle));
    }

    function finalizeCampaign(bool successful, bytes calldata decryptionProof) external {
        if (state != State.FinalizationPending) revert WrongState();
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(_finalizationHandle);
        FHE.checkSignatures(handles, abi.encode(successful), decryptionProof);
        state = successful ? State.Successful : State.Failed;
        emit CampaignFinalized(successful);
    }

    function withdrawProceeds() external onlyFounder nonReentrant {
        if (state != State.Successful || proceedsWithdrawn) revert WrongState();
        proceedsWithdrawn = true;
        FHE.allowTransient(_totalCommitted, fundingToken);
        IConfidentialUSD(fundingToken).confidentialTransferFrom(address(this), founder, _totalCommitted);
        emit ProceedsWithdrawn();
    }

    function refund() external nonReentrant {
        if (state != State.Failed) revert WrongState(); if (refunded[msg.sender]) revert AlreadyRefunded(); refunded[msg.sender] = true;
        FHE.allowTransient(_commitments[msg.sender], fundingToken);
        IConfidentialUSD(fundingToken).confidentialTransferFrom(address(this), msg.sender, _commitments[msg.sender]); emit Refunded(msg.sender);
    }

    function createProposal(bytes32 evidenceHash, uint64 opensAt, uint64 closesAt) external onlyFounder returns (bytes32 proposalId) {
        if (state != State.Successful || closesAt <= opensAt) revert WrongState();
        proposalId = keccak256(abi.encode(address(this), evidenceHash, opensAt, closesAt));
        _proposals[proposalId].evidenceHash = evidenceHash; _proposals[proposalId].opensAt = opensAt; _proposals[proposalId].closesAt = closesAt;
        emit ProposalCreated(proposalId, evidenceHash);
    }

    function castVote(bytes32 proposalId, externalEbool encryptedChoice, bytes calldata proof) external {
        Proposal storage p = _proposals[proposalId]; if (block.timestamp < p.opensAt || block.timestamp > p.closesAt) revert OutsideWindow(); if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        ebool choice = FHE.fromExternal(encryptedChoice, proof); euint64 weight = _commitments[msg.sender];
        p.forWeight = FHE.add(p.forWeight, FHE.select(choice, weight, FHE.asEuint64(0)));
        p.againstWeight = FHE.add(p.againstWeight, FHE.select(choice, FHE.asEuint64(0), weight));
        FHE.allowThis(p.forWeight); FHE.allowThis(p.againstWeight); hasVoted[proposalId][msg.sender] = true; emit VoteCast(proposalId, msg.sender);
    }

    function requestProposalOutcome(bytes32 proposalId) external {
        Proposal storage p = _proposals[proposalId];
        if (block.timestamp <= p.closesAt || p.finalized || p.finalizationRequested) revert WrongState();
        p.finalizationRequested = true;
        p.outcomeHandle = FHE.gt(p.forWeight, p.againstWeight);
        FHE.makePubliclyDecryptable(p.outcomeHandle);
        emit ProposalOutcomeRequested(proposalId, FHE.toBytes32(p.outcomeHandle));
    }

    function finalizeProposal(bytes32 proposalId, bool approved, bytes calldata decryptionProof) external {
        Proposal storage p = _proposals[proposalId];
        if (!p.finalizationRequested || p.finalized) revert WrongState();
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(p.outcomeHandle);
        FHE.checkSignatures(handles, abi.encode(approved), decryptionProof);
        p.finalized = true; p.approved = approved;
        emit ProposalFinalized(proposalId, approved);
    }

    function pause() external onlyFounder { _pause(); }
    function unpause() external onlyFounder { _unpause(); }
}
