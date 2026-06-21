export const tokenAbi = [
  { type: "function", name: "faucet", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "faucet", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint64" }], outputs: [] },
  { type: "function", name: "setOperator", stateMutability: "nonpayable", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [] },
  { type: "function", name: "lastFaucetAt", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint64" }] },
] as const;

export const campaignAbi = [
  { type: "function", name: "commit", stateMutability: "nonpayable", inputs: [{ name: "encryptedAmount", type: "bytes32" }, { name: "proof", type: "bytes" }], outputs: [] },
  { type: "function", name: "state", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "startAt", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "endAt", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
] as const;

export const factoryAbi = [
  { type: "function", name: "createCampaign", stateMutability: "nonpayable", inputs: [
    { name: "metadataHash", type: "bytes32" },
    { name: "termsHash", type: "bytes32" },
    { name: "startAt", type: "uint64" },
    { name: "endAt", type: "uint64" },
    { name: "threshold", type: "uint64" },
    { name: "salt", type: "bytes32" },
  ], outputs: [{ name: "campaign", type: "address" }] },
  { type: "event", name: "CampaignCreated", inputs: [
    { indexed: true, name: "campaign", type: "address" },
    { indexed: true, name: "founder", type: "address" },
    { indexed: true, name: "revenueDistributor", type: "address" },
    { indexed: false, name: "metadataHash", type: "bytes32" },
  ] },
] as const;

