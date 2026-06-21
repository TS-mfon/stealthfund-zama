"use client";
import { useState } from "react";
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
  const [busy, setBusy] = useState(false);

  async function commit() {
    if (!address || !walletClient || !publicClient) return setStatus("Connect wallet first.");
    if (chainId !== sepolia.id) {
      await switchChain({ chainId: sepolia.id });
      return;
    }
    let relayer: RelayerWeb | undefined;
    setBusy(true);
    try {
      const campaign = normalizeAddress(campaignAddress, "campaign");
      const raw = parseCusd(amount);
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
      setStatus(`Commit confirmed. Tx ${hash.slice(0, 10)}…`);
      setAmount("");
    } catch (error) {
      setStatus(humanError(error));
    } finally {
      relayer?.terminate();
      setBusy(false);
    }
  }

  return <div className="commit"><div className="commithead"><ShieldCheck/><span>CONFIDENTIAL COMMITMENT</span></div><label>Amount in cUSD<div><input placeholder="0.00" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}/><b>cUSD</b></div></label><div className="hiddenrow"><span>Campaign</span><b>{normalizeAddress(campaignAddress).slice(0, 10)}…</b></div><div className="hiddenrow"><span>Status</span><b>{status}</b></div><button disabled={!address || !amount || busy} onClick={commit}>{busy ? "Processing…" : "Encrypt & commit"} <ArrowUpRight size={16}/></button><small>Encryption is generated locally through Zama. Plaintext amount is never sent to the contract.</small></div>;
}

