import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import deployment from "../../../../deployments/sepolia.json";

export const dynamic = "force-dynamic";
export async function GET(){
  const client=createPublicClient({chain:sepolia,transport:http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL||"https://ethereum-sepolia-rpc.publicnode.com")});
  const [tokenCode,factoryCode,campaignCode,revenueDistributorCode,latest]=await Promise.all([
    client.getBytecode({address:deployment.mockConfidentialUSD as `0x${string}`}),
    client.getBytecode({address:deployment.factory as `0x${string}`}),
    client.getBytecode({address:deployment.liveCampaign as `0x${string}`}),
    client.getBytecode({address:deployment.liveRevenueDistributor as `0x${string}`}),
    client.getBlockNumber()
  ]);
  return NextResponse.json({
    service:"stealthfund",
    chainId:sepolia.id,
    latestBlock:latest.toString(),
    privacy:"commitments-shares-and-revenue-claims-encrypted",
    contracts:{
      cUSD:{address:deployment.mockConfidentialUSD,deployed:Boolean(tokenCode)},
      factory:{address:deployment.factory,deployed:Boolean(factoryCode)},
      liveCampaign:{address:deployment.liveCampaign,deployed:Boolean(campaignCode)},
      liveRevenueDistributor:{address:deployment.liveRevenueDistributor,deployed:Boolean(revenueDistributorCode)}
    },
    transactions:deployment.transactions,
    checkedAt:new Date().toISOString()
  });
}
