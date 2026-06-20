# StealthFund

Confidential capital formation on Ethereum Sepolia using Zama FHE. Commitments, participation balances, campaign aggregates, and vote weights are encrypted; only explicit outcomes are made public.

## Contracts

- `MockConfidentialUSD`: encrypted test token, rate-limited faucet, operators, and user-only balance access.
- `StealthFundFactory`: deterministic campaign creation and founder discovery.
- `StealthCampaign`: encrypted commitments, confidential refunds, founder aggregate access, threshold finalization, and private weighted voting.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test:contracts
pnpm build
pnpm dev
```

## Sepolia

- cUSD: `0x42eB87cb7d1bb5A83cE15b4f2a34e1722Bd43f4b`
- Factory: `0xBF5163D30a914d907BE2fB9973940668e404127e`
- Live Cipher Labs campaign: `0x836Ea41903aC2aee56c0A7AFc403D83c951bDdA6`
- Revenue distributor: `0x4736e30099712EfdEc0671664d42a3518D0b983D`

This is testnet infrastructure. Participation units are not legal equity or securities. Deployment transactions are recorded in `deployments/sepolia.json`.
