import { FaucetPanel } from "@/components/stealth/faucet-panel";
import { PageHeader, StealthShell } from "@/components/stealth/shell";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="TESTNET" title="Mint test cUSD" copy="Mint exactly 1,000 confidential USD for Sepolia testing. The contract enforces the amount and cooldown."/><FaucetPanel /></StealthShell>;
}
