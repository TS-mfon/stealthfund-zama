"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { RelayerWeb, SepoliaConfig } from "@zama-fhe/sdk";
import { toHex } from "viem";
import { campaignAbi, tokenAbi } from "@/lib/stealth-abis";
import { humanError, normalizeAddress, parseCusd, stealthContracts } from "@/lib/stealth-config";

export function CommitPanel({ campaignAddress = stealthContracts.liveCampaign }: { campaignAddress?: string }) {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Ready to encrypt a private commitment.");
  const [success, setSuccess] = useState("");
  const [localBalance, setLocalBalance] = useState<bigint>(0n);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!address) return;
    const load = () => setLocalBalance(BigInt(localStorage.getItem(`stealthfund:cusd:${address.toLowerCase()}`) || "0"));
    load();
    window.addEventListener("stealthfund:portfolio-updated", load);
    return () => window.removeEventListener("stealthfund:portfolio-updated", load);
  }, [address]);

  async function commit() {
    if (!address || !walletClient || !publicClient) return setStatus("Connect wallet first.");
    if (chainId !== sepolia.id) {
      await switchChain({ chainId: sepolia.id });
      return;
    }
    let relayer: RelayerWeb | undefined;
    setBusy(true);
    setSuccess("");
    try {
      const campaign = normalizeAddress(campaignAddress, "campaign");
      const raw = parseCusd(amount);
      if (localBalance > 0n && raw > localBalance) throw new Error(`Local cUSD balance is below this commitment. Faucet or reduce amount. Local balance: ${Number(localBalance) / 1_000_000} cUSD.`);
      const code = await publicClient.getBytecode({ address: campaign });
      if (!code) throw new Error("Campaign contract has no Sepolia bytecode.");
      const state = await publicClient.readContract({ address: campaign, abi: campaignAbi, functionName: "state" });
      if (Number(state) !== 1) throw new Error("Campaign is not active.");
      setStatus("Approving campaign as cUSD operator…");
      let hash = await walletClient.writeContract({ address: stealthContracts.cUSD, abi: tokenAbi, functionName: "setOperator", args: [campaign, true], account: address, chain: sepolia });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("Encrypting amount locally with Zama FHE…");
      relayer = new RelayerWeb({ transports: { [SepoliaConfig.chainId]: SepoliaConfig }, getChainId: async () => SepoliaConfig.chainId });
      const encrypted = await relayer.encrypt({ values: [{ value: raw, type: "euint64" }], contractAddress: campaign, userAddress: address });
      setStatus("Submitting encrypted commitment…");
      hash = await walletClient.writeContract({ address: campaign, abi: campaignAbi, functionName: "commit", args: [toHex(encrypted.handles[0]), toHex(encrypted.inputProof)], account: address, chain: sepolia });
      await publicClient.waitForTransactionReceipt({ hash });
      const balanceKey = `stealthfund:cusd:${address.toLowerCase()}`;
      const nextBalance = localBalance > raw ? localBalance - raw : 0n;
      localStorage.setItem(balanceKey, nextBalance.toString());
      const portfolioKey = `stealthfund:portfolio:${address.toLowerCase()}`;
      const entries = JSON.parse(localStorage.getItem(portfolioKey) || "[]");
      localStorage.setItem(portfolioKey, JSON.stringify([{ campaign, amount, raw: raw.toString(), tx: hash, createdAt: Date.now() }, ...entries]));
      window.dispatchEvent(new Event("stealthfund:portfolio-updated"));
      setSuccess(`Success: committed ${amount} cUSD privately. Tx ${hash.slice(0, 10)}…`);
      setStatus("Commit confirmed and saved to your portfolio.");
      setAmount("");
    } catch (error) {
      setStatus(humanError(error));
    } finally {
      relayer?.terminate();
      setBusy(false);
    }
  }

  return <div className="commit upgradedCommit"><div className="commithead"><ShieldCheck/><span>CONFIDENTIAL COMMITMENT</span></div><div className="balancePill">Local cUSD balance: <b>{Number(localBalance) / 1_000_000}</b></div><div className="amountCard"><small>Amount committed</small><label><input placeholder="0.00" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/><b>cUSD</b></label><p>Only the encrypted handle/proof is submitted. Observers do not see this amount.</p></div><div className="quickAmounts"><button onClick={() => setAmount("50")} type="button">50</button><button onClick={() => setAmount("100")} type="button">100</button><button onClick={() => setAmount("250")} type="button">250</button><button onClick={() => setAmount("500")} type="button">500</button></div><div className="hiddenrow"><span>Campaign</span><b>{normalizeAddress(campaignAddress).slice(0, 10)}…</b></div><div className="hiddenrow"><span>Status</span><b>{status}</b></div>{success && <div className="successBox">{success}</div>}<button disabled={!address || !amount || busy} onClick={commit}>{busy ? "Processing…" : "Encrypt & commit"} <ArrowUpRight size={16}/></button><small>New here? Claim faucet cUSD first, then return to commit privately.</small></div>;
}
