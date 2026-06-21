# StealthFund

Confidential startup capital formation using Zama FHEVM on Ethereum Sepolia.

Live application: https://stealthfund-zama.vercel.app

## What StealthFund does

StealthFund lets founders deploy revenue-participation campaigns and lets investors commit confidential cUSD without publishing investment values.

Implemented protocol functions include:

- exact-amount test cUSD faucet
- confidential cUSD balances/transfers
- campaign factory deployment
- campaign activation
- encrypted investor commits
- encrypted campaign aggregate
- private weighted governance
- FHE finalization outcome request/proof
- successful founder withdrawal
- failed-campaign investor refunds
- confidential revenue distributor

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and protocol explanation |
| `/raises` | Browse real Sepolia campaigns |
| `/raises/create` | Founder campaign creation |
| `/raises/[address]` | Checksum-safe campaign page and encrypted commit |
| `/faucet` | Mint exactly 1,000 test cUSD |
| `/portfolio` | Wallet-authorized private position guidance |
| `/docs` | In-app usage documentation |
| `/status` | Current deployment addresses |
| `/api/status` | Live contract-bytecode health |

## Contracts

- `MockConfidentialUSD` — test confidential funding token with 1,000 cUSD maximum faucet amount and cooldown.
- `StealthFundFactory` — creates campaign and revenue distributor contracts.
- `StealthCampaign` — encrypted commitments, total, settlement, refunds, and private voting.
- `ConfidentialRevenueDistributor` — encrypted revenue-share distribution.

Addresses are versioned in `deployments/sepolia.json`.

## Investor flow

1. Connect an Ethereum Sepolia wallet.
2. Open `/faucet` and mint exactly 1,000 cUSD.
3. Open `/raises` and select a live campaign.
4. Enter the cUSD amount.
5. The app verifies campaign bytecode and active state.
6. The wallet approves the campaign as confidential cUSD operator.
7. The Zama relayer encrypts the raw 6-decimal amount locally.
8. The app submits only the encrypted handle and proof to `commit`.
9. The campaign pulls encrypted cUSD into escrow and updates encrypted individual/aggregate commitments.

## Founder flow

1. Open `/raises/create`.
2. Set name, threshold, and future deadline.
3. Submit the factory transaction.
4. Open the campaign address returned from `CampaignCreated`.
5. Activate the campaign before the window opens.
6. After the deadline, request and finalize the encrypted threshold outcome.
7. Withdraw proceeds if successful; investors refund if failed.

## Amount correctness

cUSD uses 6 decimals:

```text
1,000 cUSD = 1,000,000,000 raw units
```

The corrected contract constants are:

```solidity
DEFAULT_FAUCET_AMOUNT = 1_000e6;
MAX_FAUCET_AMOUNT = 1_000e6;
```

The UI and tests use the same conversion, eliminating the previous 10x mismatch.

## Address safety

Every deployment-derived or route-derived address is validated with viem and normalized through `getAddress` before being passed to the wallet, RPC, or Zama SDK. Malformed or checksum-invalid campaign routes render a readable error and never invoke encryption.

## Privacy model

Public:

- founder/investor wallet addresses
- campaign/token contract addresses
- transaction existence and campaign lifecycle state
- investor count
- final success/failure outcome

Encrypted/private:

- cUSD balances
- individual commitments
- total amount raised
- vote weights
- revenue allocations

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Environment:

```env
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CUSD_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_LIVE_CAMPAIGN_ADDRESS=0x...
```

## Testing

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
forge test --root contracts -vv
```

Local Foundry cannot execute Zama precompiles. It tests factory/state/configuration/limits; encrypted execution is verified on Sepolia.

Fixtures are under `fixtures/stealthfund/`:

- `sample-campaign.json`
- `test-commitments.csv`

## Error handling

The UI explicitly handles wallet rejection, wrong network, malformed/checksum-invalid addresses, missing bytecode, inactive campaign, faucet cooldown/limit, insufficient gas, transaction revert, and Zama encryption/proof failure.

## Deployment

Contracts must be redeployed together when cUSD changes because the factory stores the funding token immutably.

```bash
forge create ... MockConfidentialUSD
forge create ... StealthFundFactory --constructor-args <new-cusd>
cast send <factory> createCampaign(...)
cast send <campaign> activate()
```

Frontend deployment:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod --yes --archive=tgz
```

## Security and legal notes

- Founder-only pause and lifecycle actions are enforced on-chain.
- Commit/refund/withdraw paths use reentrancy protection.
- Encrypted values depend on Zama ACL and proof verification.
- This testnet product models revenue-participation units, not legally issued equity or securities.
- No production funds should be used before an independent audit.

