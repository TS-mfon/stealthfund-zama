"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { EyeOff } from "lucide-react";

type Entry = { campaign: string; tx: string; createdAt: number; status: "confirmed" };

export function PortfolioPanel() {
  const { address } = useAccount();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState("Connect wallet to load your portfolio.");
  useEffect(() => {
    if (!address) return;
    let ignore = false;
    async function load() {
      try {
        const response = await fetch(`/api/portfolio?wallet=${address}`, { cache: "no-store" });
        const body = await response.json() as { ok?: boolean; data?: { entries: Entry[] }; error?: string };
        if (!response.ok || !body.ok) throw new Error(body.error || "Could not load portfolio.");
        if (!ignore) {
          setEntries(body.data?.entries ?? []);
          setStatus((body.data?.entries ?? []).length ? "Global portfolio entries loaded." : "No confirmed commitments found for this wallet.");
        }
      } catch (error) {
        if (!ignore) setStatus(error instanceof Error ? error.message : "Could not load portfolio.");
      }
    }
    void load();
    return () => { ignore = true; };
  }, [address]);

  if (!address) return <section className="panel"><div className="empty"><EyeOff/><h3>Connect wallet</h3><p>Portfolio entries are stored in shared Vercel Blob storage after successful encrypted commitments.</p></div></section>;

  return <section className="panel"><div className="portfolioHead"><small>GLOBAL PORTFOLIO</small><h2>Encrypted commitments</h2><p>StealthFund commitments are encrypted on-chain. This page shows confirmed participation records across devices without revealing plaintext amounts.</p><p className="fineprint">{status}</p></div><div className="portfolioList">{entries.length === 0 && <div className="empty"><EyeOff/><h3>No confirmed commitments yet</h3><p>Commit to a raise and the confirmed transaction will appear here globally.</p></div>}{entries.map((entry) => <Link href={`/raises/${entry.campaign}`} key={`${entry.tx}-${entry.createdAt}`}><b>Private commitment</b><code>{entry.campaign}</code><span>{new Date(entry.createdAt).toLocaleString()}</span><small>{entry.tx.slice(0, 10)}…</small></Link>)}</div></section>;
}
