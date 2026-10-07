// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ScholarshipEscrow
 * @notice UniCare Connect (IT4010 J26-IT-345) - Component C1.
 *
 * Transparent, milestone-based scholarship escrow:
 *   1. A DONOR opens a campaign and deposits funds into escrow.
 *   2. A university ADMIN (welfare officer) awards part of a campaign to a
 *      student. The award is split into equal milestone tranches.
 *   3. When the admin verifies a milestone (e.g. semester GPA / enrolment
 *      evidence) the matching tranche is released to the beneficiary
 *      automatically - no manual transfer step.
 *   4. Every state change emits an event. The event log IS the audit ledger
 *      that the donor/admin dashboards read from.
 *
 * Privacy (NFR02 / NFR04): no personally identifiable information is ever
 * stored on-chain. Students are referenced by `studentRef`
 * (keccak256(studentId, secretSalt) computed off-chain) and the AI
 * vulnerability assessment is committed to as an `assessmentHash`.
 *
 * Security: AccessControl (least privilege), ReentrancyGuard, Pausable,
 * checks-effects-interactions, and a pull-payment fallback so a beneficiary
 * that rejects ETH can never block the admin workflow.
 */
contract ScholarshipEscrow is AccessControl, ReentrancyGuard, Pausable {
    /// @dev University welfare officers who may award and verify milestones.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @dev Donors / NGOs / alumni who may fund campaigns.
    bytes32 public constant DONOR_ROLE = keccak256("DONOR_ROLE");

    uint8 public constant MAX_MILESTONES = 12;

    enum AwardStatus {
        None,
        Active,
        Completed,
        Revoked
    }

    struct Campaign {
        address donor;
        bool closed;
        bytes32 metadataHash; // hash of off-chain title / eligibility criteria
        uint256 funded; // total ever deposited (net of refunds)
        uint256 allocated; // committed to awards (not yet released or returned)
        uint256 disbursed; // total released to beneficiaries
    }

    struct Award {
        uint256 campaignId;
        address beneficiary;
        uint8 milestoneCount;
        uint8 milestonesVerified;
        AwardStatus status;
        bytes32 studentRef; // pseudonymous reference, never raw PII
        bytes32 assessmentHash; // commitment to the off-chain AI assessment record
        uint256 totalAmount;
        uint256 released;
    }

    uint256 public campaignCount;
    uint256 public awardCount;
    uint256 public totalFunded;
    uint256 public totalDisbursed;

    mapping(uint256 => Campaign) private _campaigns;
    mapping(uint256 => Award) private _awards;
    /// @dev campaignId => studentRef => already awarded (prevents duplicate awards)
    mapping(uint256 => mapping(bytes32 => bool)) private _studentAwarded;
    /// @dev funds that could not be pushed to a beneficiary (pull fallback)
    mapping(address => uint256) public pendingWithdrawals;

    // ---------------------------------------------------------------- events
    event CampaignCreated(uint256 indexed campaignId, address indexed donor, bytes32 metadataHash, uint256 amount);
    event CampaignToppedUp(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event CampaignClosed(uint256 indexed campaignId, address indexed donor, uint256 refunded);
    event ScholarshipAwarded(
        uint256 indexed awardId,
        uint256 indexed campaignId,
        bytes32 indexed studentRef,
        address beneficiary,
        uint256 totalAmount,
        uint8 milestoneCount,
        bytes32 assessmentHash
    );
    event MilestoneVerified(uint256 indexed awardId, uint8 indexed milestoneIndex, bytes32 evidenceHash, address verifier);
    event FundsDisbursed(uint256 indexed awardId, uint8 indexed milestoneIndex, address indexed beneficiary, uint256 amount);
    event DisbursementQueued(uint256 indexed awardId, address indexed beneficiary, uint256 amount);
    event AwardCompleted(uint256 indexed awardId);
    event AwardRevoked(uint256 indexed awardId, uint256 returnedToCampaign, bytes32 reasonHash);
    event PendingWithdrawn(address indexed beneficiary, uint256 amount);

    // ---------------------------------------------------------------- errors
    error ZeroAmount();
    error ZeroAddress();
    error UnknownCampaign(uint256 campaignId);
    error UnknownAward(uint256 awardId);
    error NotCampaignDonor(uint256 campaignId);
    error CampaignIsClosed(uint256 campaignId);
    error InsufficientCampaignFunds(uint256 available, uint256 requested);
    error InvalidMilestoneCount(uint8 count);
    error DuplicateAward(uint256 campaignId, bytes32 studentRef);
    error AwardNotActive(uint256 awardId);
    error NothingToWithdraw();
    error TransferFailed();

    constructor(address defaultAdmin) {
        if (defaultAdmin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
    }

    // ------------------------------------------------------------- donor side

    /// @notice Open a funded scholarship campaign (FR02).
    function createCampaign(bytes32 metadataHash)
        external
        payable
        onlyRole(DONOR_ROLE)
        whenNotPaused
        returns (uint256 campaignId)
    {
        if (msg.value == 0) revert ZeroAmount();
        campaignId = ++campaignCount;
        Campaign storage c = _campaigns[campaignId];
        c.donor = msg.sender;
        c.metadataHash = metadataHash;
        c.funded = msg.value;
        totalFunded += msg.value;
        emit CampaignCreated(campaignId, msg.sender, metadataHash, msg.value);
    }

    /// @notice Add more funds to an open campaign.
    function topUpCampaign(uint256 campaignId) external payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        Campaign storage c = _requireCampaign(campaignId);
        if (c.donor != msg.sender) revert NotCampaignDonor(campaignId);
        if (c.closed) revert CampaignIsClosed(campaignId);
        c.funded += msg.value;
        totalFunded += msg.value;
        emit CampaignToppedUp(campaignId, msg.sender, msg.value);
    }

    /// @notice Close a campaign and refund every wei not committed to an award.
    function closeCampaign(uint256 campaignId) external nonReentrant {
        Campaign storage c = _requireCampaign(campaignId);
        if (c.donor != msg.sender) revert NotCampaignDonor(campaignId);
        if (c.closed) revert CampaignIsClosed(campaignId);

        uint256 refund = c.funded - c.allocated - c.disbursed;
        c.closed = true;
        c.funded -= refund;
        totalFunded -= refund;
        emit CampaignClosed(campaignId, msg.sender, refund);

        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert TransferFailed();
        }
    }

    // ------------------------------------------------------------- admin side

    /// @notice Award part of a campaign to a student, split into milestones (FR06).
    function awardScholarship(
        uint256 campaignId,
        address beneficiary,
        bytes32 studentRef,
        bytes32 assessmentHash,
        uint256 totalAmount,
        uint8 milestoneCount
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (uint256 awardId) {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (totalAmount == 0) revert ZeroAmount();
        if (milestoneCount == 0 || milestoneCount > MAX_MILESTONES) revert InvalidMilestoneCount(milestoneCount);

        Campaign storage c = _requireCampaign(campaignId);
        if (c.closed) revert CampaignIsClosed(campaignId);
        if (_studentAwarded[campaignId][studentRef]) revert DuplicateAward(campaignId, studentRef);

        uint256 available = c.funded - c.allocated - c.disbursed;
        if (totalAmount > available) revert InsufficientCampaignFunds(available, totalAmount);

        _studentAwarded[campaignId][studentRef] = true;
        c.allocated += totalAmount;

        awardId = ++awardCount;
        _awards[awardId] = Award({
            campaignId: campaignId,
            beneficiary: beneficiary,
            milestoneCount: milestoneCount,
            milestonesVerified: 0,
            status: AwardStatus.Active,
            studentRef: studentRef,
            assessmentHash: assessmentHash,
            totalAmount: totalAmount,
            released: 0
        });

        emit ScholarshipAwarded(awardId, campaignId, studentRef, beneficiary, totalAmount, milestoneCount, assessmentHash);
    }

    /**
     * @notice Verify the next milestone and release its tranche (FR06 + FR07).
     * @dev Milestones are verified strictly in order, so each tranche can be
     *      released exactly once. State is updated before the external call.
     */
    function verifyMilestone(uint256 awardId, bytes32 evidenceHash)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
        nonReentrant
    {
        Award storage a = _requireAward(awardId);
        if (a.status != AwardStatus.Active) revert AwardNotActive(awardId);

        uint8 index = a.milestonesVerified;
        uint256 amount = trancheAmount(awardId, index);

        // effects
        a.milestonesVerified = index + 1;
        a.released += amount;
        Campaign storage c = _campaigns[a.campaignId];
        c.allocated -= amount;
        c.disbursed += amount;
        totalDisbursed += amount;

        emit MilestoneVerified(awardId, index, evidenceHash, msg.sender);

        bool completed = a.milestonesVerified == a.milestoneCount;
        if (completed) {
            a.status = AwardStatus.Completed;
            emit AwardCompleted(awardId);
        }

        // interaction (push with pull fallback)
        (bool ok, ) = payable(a.beneficiary).call{value: amount}("");
        if (ok) {
            emit FundsDisbursed(awardId, index, a.beneficiary, amount);
        } else {
            pendingWithdrawals[a.beneficiary] += amount;
            emit DisbursementQueued(awardId, a.beneficiary, amount);
        }
    }

    /// @notice Cancel an active award; unreleased funds return to the campaign pool.
    function revokeAward(uint256 awardId, bytes32 reasonHash) external onlyRole(ADMIN_ROLE) whenNotPaused {
        Award storage a = _requireAward(awardId);
        if (a.status != AwardStatus.Active) revert AwardNotActive(awardId);

        uint256 remaining = a.totalAmount - a.released;
        a.status = AwardStatus.Revoked;
        Campaign storage c = _campaigns[a.campaignId];
        c.allocated -= remaining;
        if (c.closed) {
            // Campaign already closed: the donor can no longer reclaim funds via
            // closeCampaign, so credit the returned amount to their pull balance.
            c.funded -= remaining;
            totalFunded -= remaining;
            pendingWithdrawals[c.donor] += remaining;
        }
        // The student stays flagged as awarded so the same pair cannot be re-awarded silently.
        emit AwardRevoked(awardId, remaining, reasonHash);
    }

    // ------------------------------------------------------------- beneficiary

    /// @notice Pull any tranche whose automatic push failed.
    function withdrawPending() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender] = 0;
        emit PendingWithdrawn(msg.sender, amount);
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ------------------------------------------------------------ governance

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ----------------------------------------------------------------- views

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return _requireCampaign(campaignId);
    }

    function getAward(uint256 awardId) external view returns (Award memory) {
        return _requireAward(awardId);
    }

    /// @notice Funds in a campaign that are neither committed nor released.
    function availableFunds(uint256 campaignId) external view returns (uint256) {
        Campaign storage c = _requireCampaign(campaignId);
        return c.funded - c.allocated - c.disbursed;
    }

    /**
     * @notice Amount released when milestone `index` is verified.
     * @dev Equal tranches; the final tranche absorbs any rounding remainder so
     *      the tranches always sum to exactly `totalAmount`.
     */
    function trancheAmount(uint256 awardId, uint8 index) public view returns (uint256) {
        Award storage a = _requireAward(awardId);
        uint256 base = a.totalAmount / a.milestoneCount;
        if (index + 1 == a.milestoneCount) {
            return a.totalAmount - base * (a.milestoneCount - 1);
        }
        return base;
    }

    // -------------------------------------------------------------- internals

    function _requireCampaign(uint256 campaignId) internal view returns (Campaign storage c) {
        c = _campaigns[campaignId];
        if (c.donor == address(0)) revert UnknownCampaign(campaignId);
    }

    function _requireAward(uint256 awardId) internal view returns (Award storage a) {
        a = _awards[awardId];
        if (a.status == AwardStatus.None) revert UnknownAward(awardId);
    }
}
