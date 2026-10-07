import demoLedger from "@/lib/c1/demo-ledger.json";
import {
  canonicalLedgerString,
  formatEth,
  shortHash,
  summarizeLedger,
  type LedgerEvent,
  type LedgerFile
} from "@/lib/c1/ledger";

const ledger = demoLedger as unknown as LedgerFile;
const ETH = 10n ** 18n;

describe("C1 ledger summary (derived purely from contract events)", () => {
  const summary = summarizeLedger(ledger.events);

  it("reproduces the contract's own totals (funded 35 ETH, disbursed 16 ETH)", () => {
    // These two figures are what ScholarshipEscrow.totalFunded()/totalDisbursed()
    // returned at the end of `npm run simulate` in /blockchain.
    expect(BigInt(summary.totals.funded)).toBe(35n * ETH);
    expect(BigInt(summary.totals.disbursed)).toBe(16n * ETH);
  });

  it("conserves money: funded = disbursed + committed + available", () => {
    const { funded, disbursed, committed, available } = summary.totals;
    expect(BigInt(funded)).toBe(BigInt(disbursed) + BigInt(committed) + BigInt(available));
  });

  it("counts campaigns and awards by status", () => {
    expect(summary.totals.campaigns).toBe(2);
    expect(summary.totals.awards).toBe(6);
    expect(summary.totals.completedAwards).toBe(2);
    expect(summary.totals.revokedAwards).toBe(1);
    expect(summary.totals.activeAwards).toBe(3);
    expect(summary.totals.uniqueStudents).toBe(6);
    expect(summary.totals.disbursementCount).toBe(12);
  });

  it("never releases more than an award's total, and completed awards are fully paid", () => {
    for (const award of summary.awards) {
      expect(BigInt(award.released)).toBeLessThanOrEqual(BigInt(award.totalAmount));
      if (award.status === "completed") {
        expect(award.released).toBe(award.totalAmount);
        expect(award.milestonesVerified).toBe(award.milestoneCount);
      }
    }
  });

  it("returns a revoked award's unreleased balance to its campaign", () => {
    const revoked = summary.awards.find((a) => a.status === "revoked");
    expect(revoked).toBeDefined();
    // award 2: 3 ETH over 3 milestones, 1 released before revocation
    expect(revoked!.released).toBe((1n * ETH).toString());
    const campaign = summary.campaigns.find((c) => c.id === revoked!.campaignId)!;
    expect(BigInt(campaign.allocated)).toBeGreaterThanOrEqual(0n);
  });

  it("contains no personal data - only hashes and addresses", () => {
    for (const e of ledger.events) {
      for (const [key, value] of Object.entries(e.args)) {
        if (/ref|hash/i.test(key)) expect(value).toMatch(/^0x[0-9a-f]{64}$/);
      }
    }
  });

  it("is independent of input order", () => {
    const shuffled = [...ledger.events].reverse();
    expect(summarizeLedger(shuffled)).toEqual(summary);
  });
});

describe("C1 ledger integrity fingerprint", () => {
  it("is deterministic", () => {
    expect(canonicalLedgerString(ledger.events)).toBe(canonicalLedgerString([...ledger.events].reverse()));
  });

  it("changes if any recorded amount is tampered with", () => {
    const tampered: LedgerEvent[] = ledger.events.map((e) =>
      e.type === "FundsDisbursed" && e.args.awardId === "1" && e.args.milestoneIndex === "0"
        ? { ...e, args: { ...e.args, amount: "1" } }
        : e
    );
    expect(canonicalLedgerString(tampered)).not.toBe(canonicalLedgerString(ledger.events));
  });

  it("changes if an event is silently removed", () => {
    expect(canonicalLedgerString(ledger.events.slice(1))).not.toBe(canonicalLedgerString(ledger.events));
  });
});

describe("formatting helpers", () => {
  it("formats wei as trimmed ETH", () => {
    expect(formatEth(0n)).toBe("0");
    expect(formatEth((12n * ETH).toString())).toBe("12");
    expect(formatEth((ETH * 3n) / 2n)).toBe("1.5");
    expect(formatEth("1")).toBe("0");
    expect(formatEth((ETH / 8n).toString(), 4)).toBe("0.125");
  });
  it("shortens long hashes", () => {
    const h = "0x" + "ab".repeat(32);
    expect(shortHash(h)).toBe("0xababab…abab");
    expect(shortHash("0x12")).toBe("0x12");
  });
});
