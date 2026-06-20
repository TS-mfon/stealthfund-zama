import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import deployment from "../../../../deployments/sepolia.json";

export const dynamic = "force-dynamic";
export async function GET(){
  const client=createPublicClient({chain:sepolia,transport:http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL||"https://ethereum-sepolia-rpc.publicnode.com")});
  const [tokenCode,factoryCode,latest]=await Promise.all([client.getBytecode({address:deployment.mockConfidentialUSD as `0x${string}`}),client.getBytecode({address:deployment.factory as `0x${string}`}),client.getBlockNumber()]);
  const logs=await client.getLogs({address:deployment.factory as `0x${string}`,event:parseAbiItem("event CampaignCreated(address indexed campaign,address indexed founder,address indexed revenueDistributor,bytes32 metadataHash)"),fromBlock:11000000n,toBlock:"latest"});
  return NextResponse.json({service:"stealthfund",chainId:sepolia.id,latestBlock:latest.toString(),contracts:{cUSD:{address:deployment.mockConfidentialUSD,deployed:Boolean(tokenCode)},factory:{address:deployment.factory,deployed:Boolean(factoryCode)}},campaigns:logs.map(log=>({campaign:log.args.campaign,founder:log.args.founder,revenueDistributor:log.args.revenueDistributor,metadataHash:log.args.metadataHash,transactionHash:log.transactionHash})),checkedAt:new Date().toISOString()});
}
