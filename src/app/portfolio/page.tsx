import { PortfolioPanel } from "@/components/stealth/portfolio-panel";
import { PageHeader, StealthShell } from "@/components/stealth/shell";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="INVESTOR VAULT" title="Your private positions" copy="Connect the wallet that owns the encrypted commitment handles."/><PortfolioPanel /></StealthShell>;
}
