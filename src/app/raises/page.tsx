import Link from "next/link";
import { ArrowUpRight, EyeOff } from "lucide-react";
import { PageHeader, StealthShell } from "@/components/stealth/shell";
import { stealthContracts } from "@/lib/stealth-config";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="LIVE OPPORTUNITIES" title="Confidential raises" copy="Browse real Sepolia campaigns. Funding totals and individual commitments remain encrypted."/><section className="market"><div className="cards"><article className="selected"><div className="visual lime"><span>01</span><EyeOff/></div><div className="content"><small>LIVE SEPOLIA CAMPAIGN</small><h3>CIPHER LABS</h3><p>Reference private raise deployed through the current StealthFund factory.</p><div className="terms"><span><b>LIVE</b> Sepolia</span><span><b>FHE</b> commitments</span><span><b>cUSD</b> escrow</span></div><Link href={`/raises/${stealthContracts.liveCampaign}`}>Review and commit <ArrowUpRight size={16}/></Link></div></article><article><div className="visual blue"><span>02</span><EyeOff/></div><div className="content"><small>CREATE YOUR OWN</small><h3>NEW RAISE</h3><p>Founders can deploy a campaign with custom deadline and encrypted funding threshold.</p><Link href="/raises/create">Start a raise <ArrowUpRight size={16}/></Link></div></article></div></section></StealthShell>;
}
