import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Runs a realistic scholarship lifecycle on the in-process chain (2 donors,
 * 6 awards, partial / complete / revoked progress) and exports the resulting
 * event log as `src/lib/c1/demo-ledger.json`.
 *
 * Every transaction hash, block number and gas figure in that file comes from a
 * genuine EVM execution of the real contract. It is used by the dashboards in
 * demo mode (no RPC configured) and is clearly labelled as a LOCAL SIMULATION,
 * never as a public-network record.
 *
 * The same event decoder is used by the live Sepolia reader in the web app, so
 * demo and live data share one schema.
 */
const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
const ETH = (v: string) => ethers.parseEther(v);
const DAY = 24 * 60 * 60;

// 2026-09-01T09:00:00Z - start of the pilot (matches the proposal timeline)
const START = Math.floor(Date.UTC(2026, 8, 1, 9, 0, 0) / 1000);

let clock = START + 60; // must be after the genesis block (initialDate = START)
async function advance(days: number) {
  clock += Math.round(days * DAY);
  await ethers.provider.send("evm_setNextBlockTimestamp", [clock]);
}

async function main() {
  if (network.name !== "hardhat") {
    throw new Error("simulate-lifecycle must run on the in-process 'hardhat' network.");
  }
  const [owner, admin, donorA, donorB, s1, s2, s3, s4, s5, s6] = await ethers.getSigners();
  await ethers.provider.send("evm_setNextBlockTimestamp", [clock]);

  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
  const escrow = await Escrow.deploy(owner.address);
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  await advance(0.01);
  await escrow.grantRole(await escrow.ADMIN_ROLE(), admin.address);
  await escrow.grantRole(await escrow.DONOR_ROLE(), donorA.address);
  await escrow.grantRole(await escrow.DONOR_ROLE(), donorB.address);

  // Campaigns -----------------------------------------------------------
  await advance(1);
  await escrow.connect(donorA).createCampaign(hash("Alumni Association Bursary 2026"), { value: ETH("12") });
  await advance(2);
  await escrow.connect(donorB).createCampaign(hash("CSR Tech Scholars Fund 2026"), { value: ETH("20") });
  await advance(3);
  await escrow.connect(donorA).topUpCampaign(1, { value: ETH("3") });

  // Awards (pseudonymous refs: keccak256(demoStudentId + salt)) ----------
  const ref = (id: string) => hash(`${id}:demo-salt`);
  const assess = (id: string, vi: number) => hash(JSON.stringify({ id, vulnerabilityIndex: vi, model: "xgb-v1-synthetic" }));

  await advance(2);
  await escrow.connect(admin).awardScholarship(1, s1.address, ref("demo-student-001"), assess("demo-student-001", 91), ETH("4"), 4);
  await advance(0.1);
  await escrow.connect(admin).awardScholarship(1, s2.address, ref("demo-student-002"), assess("demo-student-002", 84), ETH("3"), 3);
  await advance(0.1);
  await escrow.connect(admin).awardScholarship(1, s3.address, ref("demo-student-003"), assess("demo-student-003", 77), ETH("2"), 2);
  await advance(1);
  await escrow.connect(admin).awardScholarship(2, s4.address, ref("demo-student-004"), assess("demo-student-004", 88), ETH("6"), 3);
  await advance(0.1);
  await escrow.connect(admin).awardScholarship(2, s5.address, ref("demo-student-005"), assess("demo-student-005", 72), ETH("5"), 5);
  await advance(0.1);
  await escrow.connect(admin).awardScholarship(2, s6.address, ref("demo-student-006"), assess("demo-student-006", 69), ETH("4"), 2);

  // Milestone verification (e.g. semester GPA / enrolment evidence) ------
  const ev = (label: string) => hash(`evidence:${label}`);
  await advance(7);
  await escrow.connect(admin).verifyMilestone(1, ev("a1-m1"));
  await escrow.connect(admin).verifyMilestone(2, ev("a2-m1"));
  await escrow.connect(admin).verifyMilestone(3, ev("a3-m1"));
  await escrow.connect(admin).verifyMilestone(4, ev("a4-m1"));
  await escrow.connect(admin).verifyMilestone(5, ev("a5-m1"));
  await advance(10);
  await escrow.connect(admin).verifyMilestone(1, ev("a1-m2"));
  await escrow.connect(admin).verifyMilestone(3, ev("a3-m2")); // award 3 completes (2/2)
  await escrow.connect(admin).verifyMilestone(4, ev("a4-m2"));
  await advance(4);
  await escrow.connect(admin).revokeAward(2, hash("reason:withdrew-from-programme"));
  await advance(4);
  await escrow.connect(admin).verifyMilestone(1, ev("a1-m3"));
  await escrow.connect(admin).verifyMilestone(4, ev("a4-m3")); // award 4 completes (3/3)
  await escrow.connect(admin).verifyMilestone(5, ev("a5-m2"));
  await escrow.connect(admin).verifyMilestone(6, ev("a6-m1"));

  // Export decoded event log -----------------------------------------
  const iface = escrow.interface;
  const logs = await ethers.provider.getLogs({ address, fromBlock: 0, toBlock: "latest" });
  const blockCache = new Map<number, number>();
  const events: Array<Record<string, unknown>> = [];

  for (const log of logs) {
    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    if (!parsed || parsed.name === "RoleGranted") continue;
    let ts = blockCache.get(log.blockNumber);
    if (ts === undefined) {
      ts = (await ethers.provider.getBlock(log.blockNumber))!.timestamp;
      blockCache.set(log.blockNumber, ts);
    }
    const receipt = await ethers.provider.getTransactionReceipt(log.transactionHash);
    const args: Record<string, string> = {};
    parsed.fragment.inputs.forEach((input, i) => {
      args[input.name] = String(parsed.args[i]);
    });
    events.push({
      id: `${log.transactionHash}:${log.index}`,
      type: parsed.name,
      blockNumber: log.blockNumber,
      timestamp: ts,
      txHash: log.transactionHash,
      logIndex: log.index,
      gasUsed: Number(receipt!.gasUsed),
      args
    });
  }

  const ledger = {
    meta: {
      network: "hardhat-local-simulation",
      chainId: 31337,
      contractAddress: address,
      contract: "ScholarshipEscrow",
      note:
        "LOCAL SIMULATION. Genuine EVM execution of the real contract; not a public-network record. " +
        "Regenerate with `npm run simulate` in /blockchain. Student refs are pseudonymous demo values.",
      simulatedFrom: new Date(START * 1000).toISOString(),
      eventCount: events.length
    },
    events
  };

  const out = path.join(__dirname, "..", "..", "src", "lib", "c1", "demo-ledger.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(ledger, null, 2));
  console.log(`Exported ${events.length} events -> src/lib/c1/demo-ledger.json`);
  console.log(`Totals: funded=${ethers.formatEther(await escrow.totalFunded())} ETH, disbursed=${ethers.formatEther(await escrow.totalDisbursed())} ETH`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
