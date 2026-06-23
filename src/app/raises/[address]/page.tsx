import { CommitPanel } from "@/components/stealth/commit-panel";
import { PageHeader, StealthShell } from "@/components/stealth/shell";
import { normalizeAddress } from "@/lib/stealth-config";

export default async function Page({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  let campaign = address;
  let error = "";
  try { campaign = normalizeAddress(address, "campaign"); } catch (cause) { error = cause instanceof Error ? cause.message : "Invalid campaign address."; }
  return <StealthShell><PageHeader eyebrow="CAMPAIGN" title="Private commitment" copy="Approve cUSD, encrypt the amount with Zama in the browser, and commit to the campaign contract."/><section className="detail"><div><small>CAMPAIGN ADDRESS</small><h2>{error ? "Invalid campaign" : `${campaign.slice(0, 10)}…${campaign.slice(-6)}`}</h2><p>{error || "The campaign address is checksummed before it is passed to viem or the Zama SDK."}</p></div>{!error && <CommitPanel campaignAddress={campaign}/>}</section></StealthShell>;
}
