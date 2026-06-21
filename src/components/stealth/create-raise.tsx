"use client";
import { useState } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ArrowUpRight } from "lucide-react";
import { keccak256, parseEventLogs, stringToHex } from "viem";
import { factoryAbi } from "@/lib/stealth-abis";
import { humanError, parseCusd, stealthContracts } from "@/lib/stealth-config";

export function CreateRaise() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [threshold, setThreshold] = useState("50000");
  const [status, setStatus] = useState("Ready to create a private raise.");
  const [created, setCreated] = useState("");
  const [busy, setBusy] = useState(false);

  async function createRaise() {
    if (!address || !walletClient || !publicClient) return setStatus("Connect founder wallet first.");
    if (chainId !== sepolia.id) {
      await switchChain({ chainId: sepolia.id });
      return;
    }
    setBusy(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const end = Math.floor(new Date(deadline).getTime() / 1000);
      if (!Number.isFinite(end) || end <= now) throw new Error("Deadline must be in the future.");
      const rawThreshold = parseCusd(threshold);
      const code = await publicClient.getBytecode({ address: stealthContracts.factory });
      if (!code) throw new Error("Factory contract has no Sepolia bytecode.");
      setStatus("Creating campaign through StealthFund factory…");
      const hash = await walletClient.writeContract({ address: stealthContracts.factory, abi: factoryAbi, functionName: "createCampaign", args: [keccak256(stringToHex(name)), keccak256(stringToHex(`${name}:revenue-share-v1`)), BigInt(now), BigInt(end), BigInt(rawThreshold), keccak256(stringToHex(`${name}:${address}:${Date.now()}`))], account: address, chain: sepolia });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const [event] = parseEventLogs({ abi: factoryAbi, eventName: "CampaignCreated", logs: receipt.logs });
      const campaign = event?.args.campaign;
      setCreated(campaign ?? "");
      setStatus(`Campaign created${campaign ? ` at ${campaign}` : ""}. Tx ${hash.slice(0, 10)}…`);
    } catch (error) {
      setStatus(humanError(error));
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel"><small>FOUNDER CONSOLE</small><h1>Structure a private raise.</h1><div className="raiseform"><label>Campaign name<input placeholder="Company or protocol" value={name} onChange={(e) => setName(e.target.value)}/></label><label>Funding threshold<input value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="decimal"/></label><label>Commitment deadline<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}/></label><label>Instrument<input value="Revenue-share testnet unit" readOnly/></label><label className="wide">Public thesis<textarea placeholder="Describe the opportunity without exposing investor data."/></label><div className="wide hiddenrow"><span>Status</span><b>{status}</b></div>{created && <a className="wide" href={`/raises/${created}`}>Open campaign {created}</a>}<button disabled={!address || !name || !deadline || busy} onClick={createRaise}>{busy ? "Creating…" : "Create Sepolia campaign"} <ArrowUpRight size={16}/></button></div></section>;
}
