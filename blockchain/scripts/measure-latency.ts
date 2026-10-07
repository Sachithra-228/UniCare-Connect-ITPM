import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Measures end-to-end transaction latency (submit -> 1 confirmation) for the real
 * scholarship workflow. Proposal metric: latency < 30 s (NFR06).
 *
 *   npm run latency:sepolia     (needs blockchain/.env, a funded TESTNET wallet and
 *                               a deployment in deployments/sepolia.json)
 *
 * Uses ONE funded wallet for every role (owner/admin/donor) and fresh random
 * beneficiary addresses, so only a few thousandths of test ETH are spent.
 * On the in-process Hardhat network the numbers are meaningless (instant mining) -
 * the output file says so.
 */
const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

function percentile(sorted: number[], p: number) {
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

async function main() {
  const [signer] = await ethers.getSigners();
  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");

  let address = process.env.ESCROW_ADDRESS;
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!address && fs.existsSync(deploymentFile)) address = JSON.parse(fs.readFileSync(deploymentFile, "utf-8")).address;
  if (!address) {
    if (network.name !== "hardhat") throw new Error(`No deployment found. Run deploy first (deployments/${network.name}.json).`);
    const fresh = await Escrow.deploy(signer.address);
    await fresh.waitForDeployment();
    address = await fresh.getAddress();
  }
  const escrow = Escrow.attach(address).connect(signer) as typeof Escrow extends never ? never : any;

  const ADMIN = await escrow.ADMIN_ROLE();
  const DONOR = await escrow.DONOR_ROLE();
  const samples: Array<{ operation: string; seconds: number; gasUsed: number; txHash: string }> = [];

  async function timed(operation: string, send: () => Promise<any>) {
    const t0 = performance.now();
    const tx = await send();
    const receipt = await tx.wait(1);
    const seconds = (performance.now() - t0) / 1000;
    samples.push({ operation, seconds: Number(seconds.toFixed(2)), gasUsed: Number(receipt.gasUsed), txHash: receipt.hash });
    console.log(`${operation.padEnd(28)} ${seconds.toFixed(2).padStart(7)} s   gas ${receipt.gasUsed}`);
  }

  if (!(await escrow.hasRole(ADMIN, signer.address))) await timed("grantRole ADMIN", () => escrow.grantRole(ADMIN, signer.address));
  if (!(await escrow.hasRole(DONOR, signer.address))) await timed("grantRole DONOR", () => escrow.grantRole(DONOR, signer.address));

  const total = ethers.parseEther("0.0012");
  await timed("createCampaign", () => escrow.createCampaign(hash(`latency-run-${Date.now()}`), { value: total }));
  const campaignId = await escrow.campaignCount();

  const beneficiary = ethers.Wallet.createRandom().address;
  const milestones = 12;
  await timed("awardScholarship (12 ms)", () =>
    escrow.awardScholarship(campaignId, beneficiary, hash(`student-${Date.now()}`), hash("assessment"), total, milestones)
  );
  const awardId = await escrow.awardCount();
  for (let i = 1; i <= milestones; i++) {
    await timed(`verifyMilestone ${i}/${milestones}`, () => escrow.verifyMilestone(awardId, hash(`evidence-${i}`)));
  }

  const key = samples.filter((s) => !s.operation.startsWith("grantRole")).map((s) => s.seconds).sort((a, b) => a - b);
  const stats = {
    n: key.length,
    mean: Number((key.reduce((a, b) => a + b, 0) / key.length).toFixed(2)),
    median: percentile(key, 50),
    p95: percentile(key, 95),
    max: key[key.length - 1]
  };
  const representative = network.name !== "hardhat";
  const report = {
    generatedAt: new Date().toISOString(),
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contract: address,
    representative,
    note: representative
      ? "Real network measurement (submit -> 1 confirmation)."
      : "NOT REPRESENTATIVE: in-process Hardhat network mines instantly. Run against Sepolia.",
    target: { metric: "transaction latency", limitSeconds: 30 },
    stats,
    meetsTarget: representative ? stats.p95 < 30 : null,
    samples
  };

  console.log("\nlatency (s):", stats);
  const outDir = path.join(__dirname, "..", "..", "docs", "c1", "evidence");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `latency-${network.name}.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`Wrote ${path.relative(path.join(__dirname, "..", ".."), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
