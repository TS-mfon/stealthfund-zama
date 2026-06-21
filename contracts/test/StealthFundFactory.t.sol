// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {StealthFundFactory} from "../src/StealthFundFactory.sol";
import {StealthCampaign} from "../src/StealthCampaign.sol";
import {MockConfidentialUSD} from "../src/MockConfidentialUSD.sol";

contract StealthFundFactoryTest {
    function testCreateAndActivateCampaign() public {
        StealthFundFactory factory = new StealthFundFactory(address(0xC0FFEE));
        address created = factory.createCampaign(keccak256("meta"), keccak256("terms"), 100, 200, 1_000_000, keccak256("salt"));
        require(factory.isCampaign(created), "factory did not register campaign");
        StealthCampaign campaign = StealthCampaign(created);
        require(campaign.founder() == address(this), "wrong founder");
        require(uint8(campaign.state()) == uint8(StealthCampaign.State.Draft), "wrong initial state");
        campaign.activate();
        require(uint8(campaign.state()) == uint8(StealthCampaign.State.Active), "not activated");
    }

    function testRejectsInvalidWindow() public {
        StealthFundFactory factory = new StealthFundFactory(address(0xC0FFEE));
        try factory.createCampaign(bytes32(0), bytes32(0), 200, 100, 1, bytes32(uint256(1))) {
            revert("invalid window accepted");
        } catch {}
    }

    function testFaucetMintsExactlyOneThousandCusd() public {
        MockConfidentialUSD token = new MockConfidentialUSD(address(this));
        require(token.DEFAULT_FAUCET_AMOUNT() == 1_000e6, "wrong default faucet amount");
        require(token.MAX_FAUCET_AMOUNT() == 1_000e6, "wrong max faucet amount");
    }

    function testRejectsOversizedFaucetAmount() public {
        MockConfidentialUSD token = new MockConfidentialUSD(address(this));
        try token.faucet(1_001e6) {
            revert("oversized faucet accepted");
        } catch {}
    }
}
