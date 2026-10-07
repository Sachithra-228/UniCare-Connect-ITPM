// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ScholarshipEscrow} from "../ScholarshipEscrow.sol";

/// @dev TEST ONLY. A beneficiary that rejects incoming ETH (exercises the pull fallback).
contract RejectingBeneficiary {
    bool public acceptEth;

    function setAccept(bool value) external {
        acceptEth = value;
    }

    function pull(ScholarshipEscrow escrow) external {
        escrow.withdrawPending();
    }

    receive() external payable {
        require(acceptEth, "rejecting");
    }
}

/// @dev TEST ONLY. A beneficiary that tries to re-enter the escrow when it receives ETH.
contract ReentrantBeneficiary {
    ScholarshipEscrow public immutable escrow;
    uint256 public awardId;
    uint256 public attempts;
    bool public reentrancyBlocked;

    constructor(ScholarshipEscrow _escrow) {
        escrow = _escrow;
    }

    function setAward(uint256 id) external {
        awardId = id;
    }

    receive() external payable {
        attempts++;
        // The beneficiary is not an ADMIN, so this must fail either on the role
        // check or on the reentrancy guard; both prove re-entry is impossible.
        try escrow.verifyMilestone(awardId, bytes32(0)) {
            reentrancyBlocked = false;
        } catch {
            reentrancyBlocked = true;
        }
    }
}
