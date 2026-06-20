// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {StealthCampaign} from "./StealthCampaign.sol";
import {ConfidentialRevenueDistributor} from "./ConfidentialRevenueDistributor.sol";

contract StealthFundFactory {
    address public immutable fundingToken;
    mapping(address => address[]) private _founderCampaigns;
    mapping(address => bool) public isCampaign;
    mapping(address => address) public revenueDistributorOf;
    event CampaignCreated(address indexed campaign, address indexed founder, address indexed revenueDistributor, bytes32 metadataHash);

    constructor(address fundingToken_) { fundingToken = fundingToken_; }
    function createCampaign(bytes32 metadataHash, bytes32 termsHash, uint64 startAt, uint64 endAt, uint64 threshold, bytes32 salt) external returns (address campaign) {
        campaign = address(new StealthCampaign{salt: keccak256(abi.encode(msg.sender, salt))}(msg.sender, fundingToken, metadataHash, termsHash, startAt, endAt, threshold));
        address distributor = address(new ConfidentialRevenueDistributor{salt: keccak256(abi.encode(campaign, salt))}(msg.sender, fundingToken));
        _founderCampaigns[msg.sender].push(campaign); isCampaign[campaign] = true; revenueDistributorOf[campaign] = distributor; emit CampaignCreated(campaign, msg.sender, distributor, metadataHash);
    }
    function campaignsOf(address founder) external view returns (address[] memory) { return _founderCampaigns[founder]; }
}
