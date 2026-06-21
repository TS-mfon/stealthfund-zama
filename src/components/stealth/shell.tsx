import Link from "next/link";
import { Lock } from "lucide-react";
import { WalletButton } from "./wallet-button";

const links = [["Raises", "/raises"], ["Create", "/raises/create"], ["Portfolio", "/portfolio"], ["Faucet", "/faucet"], ["Docs", "/docs"]] as const;

export function StealthShell({ children }: { children: React.ReactNode }) {
  return <main><nav><Link className="logo" href="/"><span><Lock size={15}/></span>STEALTHFUND</Link><div className="links">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<WalletButton /></div></nav>{children}<footer><Link className="logo" href="/">STEALTHFUND</Link><span>Ethereum Sepolia · Zama FHE</span><p>Testnet software. Participation units are not legal equity or securities.</p></footer></main>;
}

export function PageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <section className="subhero"><small>{eyebrow}</small><h1>{title}</h1><p>{copy}</p></section>;
}
