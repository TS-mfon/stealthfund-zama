// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRevenueToken {
    function confidentialTransferFrom(address from, address to, euint64 amount) external returns (euint64 transferred);
}

contract ConfidentialRevenueDistributor is ZamaEthereumConfig, EIP712, Pausable, ReentrancyGuard {
    struct Epoch { bytes32 manifestHash; uint64 opensAt; uint64 closesAt; bool exists; }
    bytes32 private constant CLAIM_TYPEHASH = keccak256("Claim(bytes32 epochId,address recipient,bytes32 encryptedAmount,uint256 nonce,uint64 expiry)");
    address public immutable founder;
    address public immutable token;
    uint256 public epochNonce;
    mapping(bytes32 => Epoch) public epochs;
    mapping(bytes32 => bool) public consumedClaims;

    error OnlyFounder(); error InvalidWindow(); error EpochUnavailable(); error InvalidAuthorization(); error AuthorizationExpired();
    event EpochCreated(bytes32 indexed epochId, bytes32 manifestHash, uint64 opensAt, uint64 closesAt);
    event EpochFunded(bytes32 indexed epochId); event RevenueClaimed(bytes32 indexed epochId, address indexed recipient, uint256 nonce);

    modifier onlyFounder(){ if(msg.sender!=founder) revert OnlyFounder(); _; }
    constructor(address founder_, address token_) EIP712("StealthFund Revenue", "1") { founder=founder_; token=token_; }

    function createEpoch(bytes32 manifestHash, uint64 opensAt, uint64 closesAt) external onlyFounder returns(bytes32 epochId){
        if(closesAt<=opensAt) revert InvalidWindow(); epochId=keccak256(abi.encode(address(this),epochNonce++,manifestHash)); epochs[epochId]=Epoch(manifestHash,opensAt,closesAt,true); emit EpochCreated(epochId,manifestHash,opensAt,closesAt);
    }

    function fundEpoch(bytes32 epochId, externalEuint64 encryptedAmount, bytes calldata proof) external onlyFounder whenNotPaused {
        if(!epochs[epochId].exists) revert EpochUnavailable(); euint64 amount=FHE.fromExternal(encryptedAmount,proof); FHE.allowTransient(amount,token); IRevenueToken(token).confidentialTransferFrom(founder,address(this),amount); emit EpochFunded(epochId);
    }

    function claim(bytes32 epochId, externalEuint64 encryptedAmount, bytes calldata proof, uint256 nonce, uint64 expiry, bytes calldata signature) external whenNotPaused nonReentrant {
        Epoch memory epoch=epochs[epochId]; if(!epoch.exists||block.timestamp<epoch.opensAt||block.timestamp>epoch.closesAt) revert EpochUnavailable(); if(block.timestamp>expiry) revert AuthorizationExpired();
        bytes32 handle=externalEuint64.unwrap(encryptedAmount); bytes32 claimHash=keccak256(abi.encode(CLAIM_TYPEHASH,epochId,msg.sender,handle,nonce,expiry)); if(consumedClaims[claimHash]) revert InvalidAuthorization();
        if(ECDSA.recover(_hashTypedDataV4(claimHash),signature)!=founder) revert InvalidAuthorization(); consumedClaims[claimHash]=true;
        euint64 amount=FHE.fromExternal(encryptedAmount,proof); FHE.allowTransient(amount,token); IRevenueToken(token).confidentialTransferFrom(address(this),msg.sender,amount); emit RevenueClaimed(epochId,msg.sender,nonce);
    }

    function pause() external onlyFounder { _pause(); } function unpause() external onlyFounder { _unpause(); }
}
