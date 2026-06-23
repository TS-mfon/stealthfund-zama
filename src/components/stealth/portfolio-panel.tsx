"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { EyeOff } from "lucide-react";

type Entry = { campaign: string; amount: string; raw: string; tx: string; createdAt: number };

export function PortfolioPanel() {
  const { address } = useAccount();
  const [balance, setBalance] = useState(0n);
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => {
    if (!address) return;
    const load = () => {
      setBalance(BigInt(localStorage.getItem(`stealthfund:cusd:${address.toLowerCase()}`) || "0"));
      setEntries(JSON.parse(localStorage.getItem(`stealthfund:portfolio:${address.toLowerCase()}`) || "[]"));
    };
    load();
    window.addEventListener("stealthfund:portfolio-updated", load);
    return () => window.removeEventListener("stealthfund:portfolio-updated", load);
  }, [address]);

  if (!address) return <section className="panel"><div className="empty"><EyeOff/><h3>Connect wallet</h3><p>Portfolio entries are stored locally after successful encrypted commitments.</p></div></section>;

  return <section className="panel"><div className="portfolioHead"><small>LOCAL PORTFOLIO</small><h2>{Number(balance) / 1_000_000} cUSD available</h2><p>StealthFund commitments are encrypted on-chain. This page shows your local wallet ledger from successful faucet and commit transactions in this browser.</p></div><div className="portfolioList">{entries.length === 0 && <div className="empty"><EyeOff/><h3>No local commitments yet</h3><p>Commit to a raise and it will appear here.</p></div>}{entries.map((entry) => <Link href={`/raises/${entry.campaign}`} key={`${entry.tx}-${entry.createdAt}`}><b>{entry.amount} cUSD</b><code>{entry.campaign}</code><span>{new Date(entry.createdAt).toLocaleString()}</span></Link>)}</div></section>;
}
