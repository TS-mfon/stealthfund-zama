import { getAddress, isAddress, parseUnits, type Address } from "viem";
import deployment from "../../deployments/sepolia.json";

export const STEALTH_CHAIN_ID = 11155111;
export const CUSD_DECIMALS = 6;
export const DEFAULT_FAUCET_AMOUNT = "1000";

export const stealthContracts = {
  cUSD: getAddress(deployment.mockConfidentialUSD),
  factory: getAddress(deployment.factory),
  liveCampaign: getAddress(deployment.liveCampaign),
  liveRevenueDistributor: getAddress(deployment.liveRevenueDistributor),
};

export function normalizeAddress(value: string, label = "address"): Address {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) throw new Error(`${label} is invalid or has a bad checksum.`);
  return getAddress(trimmed);
}

export function parseCusd(value: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(value.trim())) throw new Error("Amount must be positive with up to 6 decimals.");
  const parsed = parseUnits(value, CUSD_DECIMALS);
  if (parsed <= 0n || parsed > 2n ** 64n - 1n) throw new Error("Amount must fit Zama euint64.");
  return parsed;
}

export function humanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/user rejected|User rejected|rejected/i.test(message)) return "Wallet request rejected. No transaction submitted.";
  if (/Address .* invalid|checksum|hex value of 20 bytes/i.test(message)) return "Invalid contract address. The app now normalizes addresses; refresh and retry.";
  if (/insufficient funds/i.test(message)) return "Insufficient Sepolia ETH for gas.";
  if (/FaucetCoolingDown/i.test(message)) return "Faucet cooldown is active for this wallet. Try again later.";
  if (/InvalidFaucetAmount/i.test(message)) return "Faucet amount must be between 1 and 1,000 cUSD.";
  if (/relayer|encrypt|FHE|proof/i.test(message)) return `Zama encryption failed: ${message}`;
  if (/execution reverted/i.test(message)) return "Transaction reverted. Check campaign state, cUSD balance, operator approval, and deadline.";
  return message || "Unexpected error.";
}

