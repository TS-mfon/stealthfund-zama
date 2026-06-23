import { list, put } from "@vercel/blob";

const JSON_OPTIONS = {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
} as const;

export type StealthPortfolioEntry = {
  campaign: string;
  tx: string;
  createdAt: number;
  status: "confirmed";
};

export type StealthPortfolioRecord = {
  version: 1;
  chainId: number;
  wallet: string;
  updatedAt: number;
  entries: StealthPortfolioEntry[];
};

export function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing. Add Vercel Blob storage to this Vercel project and redeploy.");
  }
}

async function readJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function pathFor(chainId: number, wallet: string) {
  return `stealthfund/portfolio/${chainId}/${wallet.toLowerCase()}.json`;
}

export async function getStealthPortfolio(chainId: number, wallet: string): Promise<StealthPortfolioRecord> {
  assertBlobConfigured();
  const blobs = await list({ prefix: pathFor(chainId, wallet) });
  const existing = blobs.blobs[0] ? await readJson<StealthPortfolioRecord>(blobs.blobs[0].url) : null;
  return existing ?? { version: 1, chainId, wallet, updatedAt: Date.now(), entries: [] };
}

export async function appendStealthPortfolioEntry(chainId: number, wallet: string, entry: StealthPortfolioEntry) {
  assertBlobConfigured();
  const existing = await getStealthPortfolio(chainId, wallet);
  const withoutDuplicate = existing.entries.filter((item) => item.tx.toLowerCase() !== entry.tx.toLowerCase());
  const next = { ...existing, chainId, wallet, updatedAt: Date.now(), entries: [entry, ...withoutDuplicate].slice(0, 200) };
  await put(pathFor(chainId, wallet), JSON.stringify(next, null, 2), JSON_OPTIONS);
  return next;
}
