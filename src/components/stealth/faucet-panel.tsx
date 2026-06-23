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
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function faucet() {
    if (!address || !walletClient || !publicClient) return setStatus("Connect wallet first.");
    if (chainId !== sepolia.id) {
      await switchChain({ chainId: sepolia.id });
      return;
    }
    setBusy(true);
    setSuccess("");
    try {
      const raw = parseCusd(amount);
      if (raw > parseCusd(DEFAULT_FAUCET_AMOUNT)) throw new Error("InvalidFaucetAmount");
      const code = await publicClient.getBytecode({ address: stealthContracts.cUSD });
      if (!code) throw new Error("cUSD contract has no Sepolia bytecode.");
      const [lastFaucetAt, cooldown] = await Promise.all([
        publicClient.readContract({ address: stealthContracts.cUSD, abi: tokenAbi, functionName: "lastFaucetAt", args: [address] }),
        publicClient.readContract({ address: stealthContracts.cUSD, abi: tokenAbi, functionName: "FAUCET_COOLDOWN" }),
      ]);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const nextAllowed = BigInt(lastFaucetAt) + BigInt(cooldown);
      if (BigInt(lastFaucetAt) > 0n && now < nextAllowed) {
        const minutes = Number((nextAllowed - now + 59n) / 60n);
        throw new Error(`Faucet cooldown active. Try again in about ${minutes} minute(s).`);
      }
      setStatus(`Minting ${amount} cUSD privately…`);
      const hash = await walletClient.writeContract({ address: stealthContracts.cUSD, abi: tokenAbi, functionName: "faucet", args: [BigInt(raw)], account: address, chain: sepolia });
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccess(`Success: ${amount} cUSD minted. Tx ${hash.slice(0, 10)}…`);
      setStatus("Mint succeeded. cUSD balances are confidential, so the UI does not mirror them in browser storage.");
    } catch (error) {
      setSuccess("");
      setStatus(humanError(error));
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel"><small>TEST CURRENCY</small><h1>Mint cUSD</h1><p className="panelIntro">Mint exactly 1,000 encrypted test cUSD. The contract cooldown is 10 minutes per wallet.</p><div className="raiseform"><label>Amount<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></label><div className="wide hiddenrow"><span>Status</span><b>{status}</b></div>{success && <div className="wide successBox">{success}</div>}<button disabled={!address || busy} onClick={faucet}>{busy ? "Minting…" : `Mint ${amount} cUSD`} <ArrowUpRight size={16}/></button></div></section>;
}
