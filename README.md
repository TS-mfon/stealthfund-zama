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
- Factory: `0x7e339f3bCFb6699c697143023d51581B3Ac034fD`

This is testnet infrastructure. Participation units are not legal equity or securities. Deployment transactions are recorded in `deployments/sepolia.json`.
