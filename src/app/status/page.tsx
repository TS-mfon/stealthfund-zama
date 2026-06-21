import { PageHeader, StealthShell } from "@/components/stealth/shell";
import { stealthContracts } from "@/lib/stealth-config";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="STATUS" title="StealthFund contracts" copy="Current Sepolia deployment addresses used by the frontend."/><section className="docs"><pre>{JSON.stringify(stealthContracts, null, 2)}</pre></section></StealthShell>;
}
