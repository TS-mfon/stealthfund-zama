"use client";
import { useState } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ArrowUpRight } from "lucide-react";
import { tokenAbi } from "@/lib/stealth-abis";
import { DEFAULT_FAUCET_AMOUNT, humanError, parseCusd, stealthContracts } from "@/lib/stealth-config";

export function FaucetPanel() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState(DEFAULT_FAUCET_AMOUNT);
  const [status, setStatus] = useState("Mint exactly 1,000 test cUSD per cooldown window.");
  const [busy, setBusy] = useState(false);

  async function faucet() {
    if (!address || !walletClient || !publicClient) return setStatus("Connect wallet first.");
    if (chainId !== sepolia.id) {
      await switchChain({ chainId: sepolia.id });
      return;
    }
    setBusy(true);
    try {
      const raw = parseCusd(amount);
      if (raw > parseCusd(DEFAULT_FAUCET_AMOUNT)) throw new Error("InvalidFaucetAmount");
      const code = await publicClient.getBytecode({ address: stealthContracts.cUSD });
      if (!code) throw new Error("cUSD contract has no Sepolia bytecode.");
      setStatus(`Minting ${amount} cUSD privately…`);
      const hash = await walletClient.writeContract({ address: stealthContracts.cUSD, abi: tokenAbi, functionName: "faucet", args: [BigInt(raw)], account: address, chain: sepolia });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Mint confirmed: ${amount} cUSD. Tx ${hash.slice(0, 10)}…`);
    } catch (error) {
      setStatus(humanError(error));
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel"><small>TEST CURRENCY</small><h1>Mint cUSD</h1><div className="raiseform"><label>Amount<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></label><div className="wide hiddenrow"><span>Status</span><b>{status}</b></div><button disabled={!address || busy} onClick={faucet}>{busy ? "Minting…" : `Mint ${amount} cUSD`} <ArrowUpRight size={16}/></button></div></section>;
}

