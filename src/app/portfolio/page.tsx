import { EyeOff } from "lucide-react";
import { PageHeader, StealthShell } from "@/components/stealth/shell";

export default function Page() {
  return <StealthShell><PageHeader eyebrow="INVESTOR VAULT" title="Your private positions" copy="Connect the wallet that owns the encrypted commitment handles."/><section className="panel"><div className="empty"><EyeOff/><h3>Wallet-authorized disclosure</h3><p>Commitments are not publicly indexable as plaintext. Use each campaign page to access your encrypted position through Zama ACL permissions.</p></div></section></StealthShell>;
}
