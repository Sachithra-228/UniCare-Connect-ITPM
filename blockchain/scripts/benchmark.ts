import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Gas benchmark for every state-changing function (proposal metric: gas < 250,000
 * per disbursement). Runs on the in-process Hardhat network.
 *
 * NOTE: transaction *latency* (< 30 s) is a property of the public network and
 * MUST be measured on Sepolia - local automine timings are not reported here.
 */
const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
const ETH = (v: string) => ethers.parseEther(v);

async function gasOf(txPromise: Promise<any>) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return Number(receipt.gasUsed);
}

async function main() {
  const [owner, admin, donor] = await ethers.getSigners();
  // Fresh, never-used wallets are the realistic (and most expensive) case: the first payment to an
  // account that does not exist yet costs ~25,000 extra gas for account creation.
  const student = { address: ethers.Wallet.createRandom().address };
  const student2 = { address: ethers.Wallet.createRandom().address };
  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
  const escrow = await Escrow.deploy(owner.address);
  const deployGas = Number((await escrow.deploymentTransaction()!.wait())!.gasUsed);

  await escrow.grantRole(await escrow.ADMIN_ROLE(), admin.address);
  await escrow.grantRole(await escrow.DONOR_ROLE(), donor.address);

  const rows: Array<{ operation: string; gas: number }> = [{ operation: "deploy ScholarshipEscrow", gas: deployGas }];
  const measure = async (operation: string, tx: Promise<any>) => rows.push({ operation, gas: await gasOf(tx) });

  await measure("createCampaign", escrow.connect(donor).createCampaign(hash("campaign"), { value: ETH("50") }));
  await measure("topUpCampaign", escrow.connect(donor).topUpCampaign(1, { value: ETH("1") }));
  await measure(
    "awardScholarship (4 milestones)",
    escrow.connect(admin).awardScholarship(1, student.address, hash("student-1"), hash("assessment-1"), ETH("4"), 4)
  );
  const disbursements: number[] = [];
  for (let i = 0; i < 4; i++) {
    const g = await gasOf(escrow.connect(admin).verifyMilestone(1, hash(`evidence-${i}`)));
    disbursements.push(g);
    rows.push({ operation: `verifyMilestone #${i + 1} (verify + auto-disburse)`, gas: g });
  }
  await escrow
    .connect(admin)
    .awardScholarship(1, student2.address, hash("student-2"), hash("assessment-2"), ETH("2"), 2);
  await measure("revokeAward", escrow.connect(admin).revokeAward(2, hash("reason")));
  await measure("closeCampaign", escrow.connect(donor).closeCampaign(1));

  const maxDisbursement = Math.max(...disbursements);
  const target = 250_000;
  const summary = {
    generatedAt: new Date().toISOString(),
    network: "hardhat (in-process)",
    solc: "0.8.24, optimizer 200 runs",
    target: { metric: "gas per disbursement", limit: target },
    maxDisbursementGas: maxDisbursement,
    meetsTarget: maxDisbursement < target,
    latency: "not measured locally - must be measured on Sepolia (target < 30 s)",
    rows
  };

  console.table(rows);
  console.log(`\nMax gas per disbursement: ${maxDisbursement} (target < ${target}) -> ${summary.meetsTarget ? "PASS" : "FAIL"}`);

  const outDir = path.join(__dirname, "..", "..", "docs", "c1", "evidence");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "gas-report.json"), JSON.stringify(summary, null, 2));
  console.log("Wrote docs/c1/evidence/gas-report.json");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
