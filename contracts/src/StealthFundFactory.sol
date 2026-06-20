// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {StealthCampaign} from "./StealthCampaign.sol";

contract StealthFundFactory {
    address public immutable fundingToken;
    mapping(address => address[]) private _founderCampaigns;
    mapping(address => bool) public isCampaign;
    event CampaignCreated(address indexed campaign, address indexed founder, bytes32 metadataHash);

    constructor(address fundingToken_) { fundingToken = fundingToken_; }
    function createCampaign(bytes32 metadataHash, bytes32 termsHash, uint64 startAt, uint64 endAt, uint64 threshold, bytes32 salt) external returns (address campaign) {
        campaign = address(new StealthCampaign{salt: keccak256(abi.encode(msg.sender, salt))}(msg.sender, fundingToken, metadataHash, termsHash, startAt, endAt, threshold));
        _founderCampaigns[msg.sender].push(campaign); isCampaign[campaign] = true; emit CampaignCreated(campaign, msg.sender, metadataHash);
    }
    function campaignsOf(address founder) external view returns (address[] memory) { return _founderCampaigns[founder]; }
}
