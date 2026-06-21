// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract MockConfidentialUSD is ZamaEthereumConfig, AccessControl, Pausable {
    string public constant name = "Stealth Test USD";
    string public constant symbol = "cUSD";
    uint8 public constant decimals = 6;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint64 public constant DEFAULT_FAUCET_AMOUNT = 1_000e6;
    uint64 public constant MAX_FAUCET_AMOUNT = 1_000e6;
    uint64 public constant FAUCET_COOLDOWN = 1 days;

    mapping(address => euint64) private _balances;
    mapping(address => uint64) public lastFaucetAt;
    mapping(address => mapping(address => bool)) public isOperator;

    error FaucetCoolingDown();
    error InvalidFaucetAmount();
    error InvalidRecipient();
    error NotOperator();

    event FaucetMint(address indexed account, uint64 amount);
    event ConfidentialTransfer(address indexed operator, address indexed from, address indexed to);
    event OperatorSet(address indexed holder, address indexed operator, bool approved);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function faucet() external whenNotPaused {
        faucet(DEFAULT_FAUCET_AMOUNT);
    }

    function faucet(uint64 amount) public whenNotPaused {
        if (amount == 0 || amount > MAX_FAUCET_AMOUNT) revert InvalidFaucetAmount();
        if (lastFaucetAt[msg.sender] != 0 && block.timestamp < lastFaucetAt[msg.sender] + FAUCET_COOLDOWN) revert FaucetCoolingDown();
        lastFaucetAt[msg.sender] = uint64(block.timestamp);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        emit FaucetMint(msg.sender, amount);
    }

    function setOperator(address operator, bool approved) external {
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
    }

    function confidentialTransfer(address to, externalEuint64 encryptedAmount, bytes calldata proof) external whenNotPaused returns (euint64) {
        return _transfer(msg.sender, msg.sender, to, FHE.fromExternal(encryptedAmount, proof));
    }

    function confidentialTransferFrom(address from, address to, euint64 amount) external whenNotPaused returns (euint64) {
        if (msg.sender != from && !isOperator[from][msg.sender]) revert NotOperator();
        return _transfer(msg.sender, from, to, amount);
    }

    function _transfer(address operator, address from, address to, euint64 amount) internal returns (euint64 transferable) {
        if (to == address(0)) revert InvalidRecipient();
        ebool sufficient = FHE.le(amount, _balances[from]);
        transferable = FHE.select(sufficient, amount, FHE.asEuint64(0));
        _balances[from] = FHE.sub(_balances[from], transferable);
        _balances[to] = FHE.add(_balances[to], transferable);
        FHE.allowThis(_balances[from]);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[from], from);
        FHE.allow(_balances[to], to);
        FHE.allowTransient(transferable, msg.sender);
        emit ConfidentialTransfer(operator, from, to);
    }

    function accessMyBalance() external returns (euint64) {
        FHE.allow(_balances[msg.sender], msg.sender);
        return _balances[msg.sender];
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
