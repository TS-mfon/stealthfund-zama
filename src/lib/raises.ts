import { stealthContracts } from "./stealth-config";

export const featuredRaises = [
  {
    name: "Cipher Labs",
    tag: "LIVE SEPOLIA CAMPAIGN",
    href: `/raises/${stealthContracts.liveCampaign}`,
    color: "lime",
    thesis: "Privacy-preserving developer analytics for teams that need usage insight without exposing wallet-level behavior.",
    stage: "Seed",
    instrument: "Revenue-share unit",
    deadline: "Live testnet",
  },
  {
    name: "NOVA PAY",
    tag: "OPEN CONCEPT",
    href: `/raises/${stealthContracts.liveCampaign}`,
    color: "blue",
    thesis: "Confidential stablecoin payroll for global teams. Employees receive private payments and founders keep public treasury operations clean.",
    stage: "Pre-seed",
    instrument: "SAFE-style note",
    deadline: "Demo pool",
  },
  {
    name: "VAULT SIGNAL",
    tag: "OPEN CONCEPT",
    href: `/raises/${stealthContracts.liveCampaign}`,
    color: "amber",
    thesis: "Encrypted investor reporting for token treasuries, letting backers verify milestones without leaking sensitive runway data.",
    stage: "Community",
    instrument: "Milestone financing",
    deadline: "Demo pool",
  },
  {
    name: "ORBIT HEALTH",
    tag: "OPEN CONCEPT",
    href: `/raises/${stealthContracts.liveCampaign}`,
    color: "violet",
    thesis: "Private grant funding for health-data protocols where contributors cannot expose identities or compensation.",
    stage: "Grant",
    instrument: "Grant stream",
    deadline: "Demo pool",
  },
];
