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
  const [pitch, setPitch] = useState("");
  const [whyNow, setWhyNow] = useState("");
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
      const metadata = JSON.stringify({ name, pitch, whyNow, threshold, deadline });
      const hash = await walletClient.writeContract({ address: stealthContracts.factory, abi: factoryAbi, functionName: "createCampaign", args: [keccak256(stringToHex(metadata)), keccak256(stringToHex(`${name}:revenue-share-v1`)), BigInt(now), BigInt(end), BigInt(rawThreshold), keccak256(stringToHex(`${name}:${address}:${Date.now()}`))], account: address, chain: sepolia });
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

  return <section className="panel founderPanel"><small>FOUNDER CONSOLE</small><h1>Pitch a private raise.</h1><p className="panelIntro">Give investors enough context to care while keeping commitment amounts, cap-table exposure, and campaign totals encrypted.</p><div className="raiseform upgraded"><label>Protocol / company name<input placeholder="Company or protocol" value={name} onChange={(e) => setName(e.target.value)}/></label><label>Funding threshold in cUSD<input value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="decimal"/></label><label>Commitment deadline<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}/></label><label>Instrument<input value="Revenue-share testnet unit" readOnly/></label><label className="wide">What does your protocol do?<textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Explain the product, user, market, and why confidential funding matters."/></label><label className="wide">Why does it deserve funding now?<textarea value={whyNow} onChange={(e) => setWhyNow(e.target.value)} placeholder="Mention traction, milestones, technical edge, and the next unlock this round enables."/></label><div className="wide pitchPreview"><small>LIVE PREVIEW</small><h3>{name || "Your protocol"}</h3><p>{pitch || "Your protocol pitch will preview here."}</p><p>{whyNow || "Your funding rationale will preview here."}</p></div><div className="wide hiddenrow"><span>Status</span><b>{status}</b></div>{created && <a className="wide openCampaign" href={`/raises/${created}`}>Open campaign {created}</a>}<button disabled={!address || !name || !deadline || !pitch || busy} onClick={createRaise}>{busy ? "Creating…" : "Create Sepolia campaign"} <ArrowUpRight size={16}/></button></div></section>;
}
