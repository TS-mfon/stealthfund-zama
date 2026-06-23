import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { z } from "zod";
import { appendStealthPortfolioEntry, getStealthPortfolio } from "@/lib/blob-store";
import { STEALTH_CHAIN_ID } from "@/lib/stealth-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const entrySchema = z.object({
  chainId: z.number().int().default(STEALTH_CHAIN_ID),
  wallet: z.string(),
  campaign: z.string(),
  tx: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  createdAt: z.number().int().positive().optional(),
});

function fail(error: unknown, status = 500) {
  return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const chainId = Number(searchParams.get("chainId") ?? STEALTH_CHAIN_ID);
    if (!wallet || !isAddress(wallet)) return fail("wallet query param must be a valid address.", 400);
    const data = await getStealthPortfolio(chainId, getAddress(wallet));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = entrySchema.parse(await request.json());
    if (!isAddress(input.wallet)) return fail("wallet address is invalid.", 400);
    if (!isAddress(input.campaign)) return fail("campaign address is invalid.", 400);
    const entry = {
      campaign: getAddress(input.campaign),
      tx: input.tx,
      createdAt: input.createdAt ?? Date.now(),
      status: "confirmed" as const,
    };
    const data = await appendStealthPortfolioEntry(input.chainId, getAddress(input.wallet), entry);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return fail(error, error instanceof z.ZodError ? 400 : 500);
  }
}
