import { CreateRaise } from "@/components/stealth/create-raise";
import { PageHeader, StealthShell } from "@/components/stealth/shell";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="FOUNDER" title="Create a confidential raise" copy="Deploy a new Sepolia campaign and revenue distributor through the StealthFund factory."/><CreateRaise /></StealthShell>;
}
