import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const ETH = (v: string) => ethers.parseEther(v);
const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

async function deployFixture() {
  const [owner, admin, donor, otherDonor, student, student2, stranger] = await ethers.getSigners();
  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
  const escrow = await Escrow.deploy(owner.address);
  await escrow.waitForDeployment();

  const ADMIN_ROLE = await escrow.ADMIN_ROLE();
  const DONOR_ROLE = await escrow.DONOR_ROLE();
  await escrow.grantRole(ADMIN_ROLE, admin.address);
  await escrow.grantRole(DONOR_ROLE, donor.address);
  await escrow.grantRole(DONOR_ROLE, otherDonor.address);

  return { escrow, owner, admin, donor, otherDonor, student, student2, stranger, ADMIN_ROLE, DONOR_ROLE };
}

async function campaignFixture() {
  const base = await deployFixture();
  await base.escrow.connect(base.donor).createCampaign(hash("Mahapola-style bursary"), { value: ETH("10") });
  return base; // campaign #1 holds 10 ETH
}

async function awardFixture() {
  const base = await campaignFixture();
  await base.escrow
    .connect(base.admin)
    .awardScholarship(1, base.student.address, hash("student-1"), hash("assessment-1"), ETH("4"), 4);
  return base; // award #1: 4 ETH over 4 milestones
}

describe("ScholarshipEscrow", () => {
  describe("deployment & roles", () => {
    it("grants the default admin both governance and ADMIN roles", async () => {
      const { escrow, owner, ADMIN_ROLE } = await loadFixture(deployFixture);
      expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await escrow.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("rejects a zero default admin", async () => {
      const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
      await expect(Escrow.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(Escrow, "ZeroAddress");
    });

    it("only DEFAULT_ADMIN can grant roles", async () => {
      const { escrow, stranger, donor, DONOR_ROLE } = await loadFixture(deployFixture);
      await expect(escrow.connect(stranger).grantRole(DONOR_ROLE, donor.address)).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("campaigns (donor side)", () => {
    it("lets a DONOR create a funded campaign and records it", async () => {
      const { escrow, donor } = await loadFixture(deployFixture);
      await expect(escrow.connect(donor).createCampaign(hash("c1"), { value: ETH("5") }))
        .to.emit(escrow, "CampaignCreated")
        .withArgs(1, donor.address, hash("c1"), ETH("5"));
      const c = await escrow.getCampaign(1);
      expect(c.donor).to.equal(donor.address);
      expect(c.funded).to.equal(ETH("5"));
      expect(await escrow.totalFunded()).to.equal(ETH("5"));
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(ETH("5"));
    });

    it("rejects campaigns from non-donors and zero deposits", async () => {
      const { escrow, stranger, donor } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(stranger).createCampaign(hash("x"), { value: ETH("1") })
      ).to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
      await expect(escrow.connect(donor).createCampaign(hash("x"), { value: 0 })).to.be.revertedWithCustomError(
        escrow,
        "ZeroAmount"
      );
    });

    it("lets only the owning donor top up an open campaign", async () => {
      const { escrow, donor, otherDonor } = await loadFixture(campaignFixture);
      await expect(escrow.connect(donor).topUpCampaign(1, { value: ETH("2") }))
        .to.emit(escrow, "CampaignToppedUp")
        .withArgs(1, donor.address, ETH("2"));
      expect((await escrow.getCampaign(1)).funded).to.equal(ETH("12"));
      await expect(escrow.connect(otherDonor).topUpCampaign(1, { value: ETH("1") })).to.be.revertedWithCustomError(
        escrow,
        "NotCampaignDonor"
      );
    });

    it("refunds only unallocated funds when closing", async () => {
      const { escrow, admin, donor, student } = await loadFixture(campaignFixture);
      await escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("4"), 2);
      await expect(escrow.connect(donor).closeCampaign(1)).to.changeEtherBalance(donor, ETH("6"));
      const c = await escrow.getCampaign(1);
      expect(c.closed).to.equal(true);
      expect(c.allocated).to.equal(ETH("4"));
      await expect(escrow.connect(donor).closeCampaign(1)).to.be.revertedWithCustomError(escrow, "CampaignIsClosed");
    });

    it("blocks new awards and top-ups on a closed campaign", async () => {
      const { escrow, admin, donor, student } = await loadFixture(campaignFixture);
      await escrow.connect(donor).closeCampaign(1);
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("1"), 1)
      ).to.be.revertedWithCustomError(escrow, "CampaignIsClosed");
      await expect(escrow.connect(donor).topUpCampaign(1, { value: 1 })).to.be.revertedWithCustomError(
        escrow,
        "CampaignIsClosed"
      );
    });
  });

  describe("awards (admin side)", () => {
    it("creates an award, reserving funds and emitting the audit event", async () => {
      const { escrow, admin, student } = await loadFixture(campaignFixture);
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s1"), hash("a1"), ETH("4"), 4)
      )
        .to.emit(escrow, "ScholarshipAwarded")
        .withArgs(1, 1, hash("s1"), student.address, ETH("4"), 4, hash("a1"));
      expect(await escrow.availableFunds(1)).to.equal(ETH("6"));
      const a = await escrow.getAward(1);
      expect(a.status).to.equal(1); // Active
      expect(a.studentRef).to.equal(hash("s1"));
    });

    it("enforces role, balance, milestone-count and duplicate rules", async () => {
      const { escrow, admin, donor, student, student2 } = await loadFixture(campaignFixture);
      await expect(
        escrow.connect(donor).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("1"), 1)
      ).to.be.revertedWithCustomError(escrow, "AccessControlUnauthorizedAccount");
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("11"), 1)
      ).to.be.revertedWithCustomError(escrow, "InsufficientCampaignFunds");
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("1"), 0)
      ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneCount");
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("1"), 13)
      ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneCount");
      await expect(
        escrow.connect(admin).awardScholarship(1, ethers.ZeroAddress, hash("s"), hash("a"), ETH("1"), 1)
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
      await expect(
        escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), 0, 1)
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
      await expect(
        escrow.connect(admin).awardScholarship(99, student.address, hash("s"), hash("a"), ETH("1"), 1)
      ).to.be.revertedWithCustomError(escrow, "UnknownCampaign");

      await escrow.connect(admin).awardScholarship(1, student.address, hash("s"), hash("a"), ETH("1"), 1);
      await expect(
        escrow.connect(admin).awardScholarship(1, student2.address, hash("s"), hash("a"), ETH("1"), 1)
      ).to.be.revertedWithCustomError(escrow, "DuplicateAward");
    });

    it("never lets allocations exceed the campaign's funds", async () => {
      const { escrow, admin, student, student2 } = await loadFixture(campaignFixture);
      await escrow.connect(admin).awardScholarship(1, student.address, hash("s1"), hash("a"), ETH("7"), 1);
      await expect(
        escrow.connect(admin).awardScholarship(1, student2.address, hash("s2"), hash("a"), ETH("4"), 1)
      ).to.be.revertedWithCustomError(escrow, "InsufficientCampaignFunds");
    });
  });

  describe("milestone-based disbursement", () => {
    it("releases exactly one tranche per verified milestone, in order", async () => {
      const { escrow, admin, student } = await loadFixture(awardFixture);
      await expect(escrow.connect(admin).verifyMilestone(1, hash("gpa-sem1"))).to.changeEtherBalance(
        student,
        ETH("1")
      );
      let a = await escrow.getAward(1);
      expect(a.milestonesVerified).to.equal(1);
      expect(a.released).to.equal(ETH("1"));

      await escrow.connect(admin).verifyMilestone(1, hash("gpa-sem2"));
      a = await escrow.getAward(1);
      expect(a.milestonesVerified).to.equal(2);
      expect(a.status).to.equal(1); // still Active
    });

    it("emits MilestoneVerified and FundsDisbursed for the audit ledger", async () => {
      const { escrow, admin, student } = await loadFixture(awardFixture);
      await expect(escrow.connect(admin).verifyMilestone(1, hash("ev")))
        .to.emit(escrow, "MilestoneVerified")
        .withArgs(1, 0, hash("ev"), admin.address)
        .and.to.emit(escrow, "FundsDisbursed")
        .withArgs(1, 0, student.address, ETH("1"));
    });

    it("completes the award after the final milestone and pays out the full amount", async () => {
      const { escrow, admin, student } = await loadFixture(awardFixture);
      for (let i = 0; i < 4; i++) await escrow.connect(admin).verifyMilestone(1, hash(`m${i}`));
      const a = await escrow.getAward(1);
      expect(a.status).to.equal(2); // Completed
      expect(a.released).to.equal(ETH("4"));
      expect(await escrow.totalDisbursed()).to.equal(ETH("4"));
      expect((await escrow.getCampaign(1)).allocated).to.equal(0);
      await expect(escrow.connect(admin).verifyMilestone(1, hash("extra"))).to.be.revertedWithCustomError(
        escrow,
        "AwardNotActive"
      );
      expect(student.address).to.not.equal(ethers.ZeroAddress);
    });

    it("only an ADMIN can verify milestones", async () => {
      const { escrow, donor, student, stranger } = await loadFixture(awardFixture);
      await expect(escrow.connect(donor).verifyMilestone(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
      await expect(escrow.connect(student).verifyMilestone(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
      await expect(escrow.connect(stranger).verifyMilestone(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("rejects unknown awards", async () => {
      const { escrow, admin } = await loadFixture(awardFixture);
      await expect(escrow.connect(admin).verifyMilestone(42, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "UnknownAward"
      );
    });

    it("invariant: tranches always sum to the total (rounding goes to the last tranche)", async () => {
      const { escrow, admin, student } = await loadFixture(campaignFixture);
      let awardId = 0;
      for (let count = 1; count <= 12; count++) {
        const total = 1_000_000_000_000_000_007n + BigInt(count); // deliberately not divisible
        // top up so we never run out of campaign funds across iterations
        await escrow.connect((await ethers.getSigners())[2]).topUpCampaign(1, { value: total });
        await escrow
          .connect(admin)
          .awardScholarship(1, student.address, hash(`s${count}`), hash("a"), total, count);
        awardId++;
        let sum = 0n;
        for (let i = 0; i < count; i++) sum += await escrow.trancheAmount(awardId, i);
        expect(sum).to.equal(total);
      }
    });
  });

  describe("revocation", () => {
    it("returns unreleased funds to the open campaign pool", async () => {
      const { escrow, admin } = await loadFixture(awardFixture);
      await escrow.connect(admin).verifyMilestone(1, hash("m0"));
      await expect(escrow.connect(admin).revokeAward(1, hash("dropped-out")))
        .to.emit(escrow, "AwardRevoked")
        .withArgs(1, ETH("3"), hash("dropped-out"));
      expect((await escrow.getAward(1)).status).to.equal(3); // Revoked
      expect(await escrow.availableFunds(1)).to.equal(ETH("9")); // 10 - 1 released
      await expect(escrow.connect(admin).verifyMilestone(1, hash("m1"))).to.be.revertedWithCustomError(
        escrow,
        "AwardNotActive"
      );
    });

    it("credits the donor's pull balance when the campaign is already closed", async () => {
      const { escrow, admin, donor } = await loadFixture(awardFixture);
      await escrow.connect(donor).closeCampaign(1);
      await escrow.connect(admin).revokeAward(1, hash("r"));
      expect(await escrow.pendingWithdrawals(donor.address)).to.equal(ETH("4"));
      await expect(escrow.connect(donor).withdrawPending()).to.changeEtherBalance(donor, ETH("4"));
      // contract must hold no stray funds
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
    });

    it("is restricted to ADMIN and active awards", async () => {
      const { escrow, donor, admin } = await loadFixture(awardFixture);
      await expect(escrow.connect(donor).revokeAward(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
      await escrow.connect(admin).revokeAward(1, hash("x"));
      await expect(escrow.connect(admin).revokeAward(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "AwardNotActive"
      );
    });
  });

  describe("emergency pause", () => {
    it("pauses state-changing flows and resumes", async () => {
      const { escrow, owner, admin, donor } = await loadFixture(awardFixture);
      await escrow.connect(owner).pause();
      await expect(escrow.connect(admin).verifyMilestone(1, hash("x"))).to.be.revertedWithCustomError(
        escrow,
        "EnforcedPause"
      );
      await expect(escrow.connect(donor).createCampaign(hash("x"), { value: 1 })).to.be.revertedWithCustomError(
        escrow,
        "EnforcedPause"
      );
      await escrow.connect(owner).unpause();
      await expect(escrow.connect(admin).verifyMilestone(1, hash("x"))).to.not.be.reverted;
    });

    it("only DEFAULT_ADMIN can pause", async () => {
      const { escrow, admin } = await loadFixture(deployFixture);
      await expect(escrow.connect(admin).pause()).to.be.revertedWithCustomError(
        escrow,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("adversarial beneficiaries", () => {
    it("queues the tranche for pull-withdrawal if the beneficiary rejects ETH", async () => {
      const { escrow, admin, donor } = await loadFixture(campaignFixture);
      const Rejecting = await ethers.getContractFactory("RejectingBeneficiary");
      const rejecting = await Rejecting.deploy();
      const addr = await rejecting.getAddress();
      await escrow.connect(admin).awardScholarship(1, addr, hash("s"), hash("a"), ETH("2"), 2);

      await expect(escrow.connect(admin).verifyMilestone(1, hash("m0")))
        .to.emit(escrow, "DisbursementQueued")
        .withArgs(1, addr, ETH("1"));
      expect(await escrow.pendingWithdrawals(addr)).to.equal(ETH("1"));
      // the admin workflow is NOT blocked
      await expect(escrow.connect(admin).verifyMilestone(1, hash("m1"))).to.not.be.reverted;
      expect(await escrow.pendingWithdrawals(addr)).to.equal(ETH("2"));

      await rejecting.setAccept(true);
      await expect(rejecting.pull(await escrow.getAddress())).to.changeEtherBalance(addr, ETH("2"));
      expect(await escrow.pendingWithdrawals(addr)).to.equal(0);
      expect(donor.address).to.not.equal(addr);
    });

    it("withdrawPending reverts when there is nothing to withdraw", async () => {
      const { escrow, stranger } = await loadFixture(deployFixture);
      await expect(escrow.connect(stranger).withdrawPending()).to.be.revertedWithCustomError(
        escrow,
        "NothingToWithdraw"
      );
    });

    it("blocks reentrancy even if the beneficiary itself holds ADMIN_ROLE", async () => {
      const { escrow, admin, ADMIN_ROLE, owner } = await loadFixture(campaignFixture);
      const Reentrant = await ethers.getContractFactory("ReentrantBeneficiary");
      const attacker = await Reentrant.deploy(await escrow.getAddress());
      const attackerAddr = await attacker.getAddress();
      // Worst case: grant the attacker ADMIN so ONLY the reentrancy guard stands in its way.
      await escrow.connect(owner).grantRole(ADMIN_ROLE, attackerAddr);
      await escrow.connect(admin).awardScholarship(1, attackerAddr, hash("s"), hash("a"), ETH("2"), 2);
      await attacker.setAward(1);

      await escrow.connect(admin).verifyMilestone(1, hash("m0"));
      expect(await attacker.attempts()).to.equal(1);
      expect(await attacker.reentrancyBlocked()).to.equal(true);
      // exactly one tranche released - no double spend
      expect((await escrow.getAward(1)).released).to.equal(ETH("1"));
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(ETH("9"));
    });
  });

  describe("accounting invariant", () => {
    it("contract balance always equals funded - disbursed + pending", async () => {
      const { escrow, admin, donor, student, student2 } = await loadFixture(campaignFixture);
      await escrow.connect(admin).awardScholarship(1, student.address, hash("s1"), hash("a"), ETH("3"), 3);
      await escrow.connect(admin).awardScholarship(1, student2.address, hash("s2"), hash("a"), ETH("2"), 2);
      await escrow.connect(admin).verifyMilestone(1, hash("m"));
      await escrow.connect(admin).verifyMilestone(2, hash("m"));
      await escrow.connect(admin).revokeAward(2, hash("r"));
      await escrow.connect(donor).closeCampaign(1);

      const balance = await ethers.provider.getBalance(await escrow.getAddress());
      const c = await escrow.getCampaign(1);
      expect(balance).to.equal(c.funded - c.disbursed + (await escrow.pendingWithdrawals(donor.address)));
      expect(c.allocated + c.disbursed).to.be.lte(c.funded + c.disbursed);
    });
  });
});
