import { ethers, network } from "hardhat";

/**
 * Deploys the escrow and runs a SHORT live lifecycle on whatever network is
 * selected - use it against `npm run node` (localhost) to demo the dashboards
 * in LIVE mode (C1_RPC_URL=http://127.0.0.1:8545).
 *
 *   terminal 1:  npm run node
 *   terminal 2:  npm run seed:local
 *
 * Prints the address + deploy block to put in the web app's .env.local.
 * Uses Hardhat's well-known TEST accounts - never use those keys on a real network.
 */
const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
const ETH = (v: string) => ethers.parseEther(v);

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length < 6) throw new Error("Need at least 6 funded accounts (use the Hardhat node).");
  const [owner, admin, donor, s1, s2, s3] = signers;

  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
  const escrow = await Escrow.deploy(owner.address);
  const deployReceipt = await escrow.deploymentTransaction()!.wait();
  const address = await escrow.getAddress();

  await (await escrow.grantRole(await escrow.ADMIN_ROLE(), admin.address)).wait();
  await (await escrow.grantRole(await escrow.DONOR_ROLE(), donor.address)).wait();

  await (await escrow.connect(donor).createCampaign(hash("Live demo campaign"), { value: ETH("10") })).wait();
  const ref = (id: string) => hash(`${id}:demo-salt`);
  await (await escrow.connect(admin).awardScholarship(1, s1.address, ref("live-1"), hash("assess-1"), ETH("3"), 3)).wait();
  await (await escrow.connect(admin).awardScholarship(1, s2.address, ref("live-2"), hash("assess-2"), ETH("2"), 2)).wait();
  await (await escrow.connect(admin).awardScholarship(1, s3.address, ref("live-3"), hash("assess-3"), ETH("1"), 1)).wait();
  await (await escrow.connect(admin).verifyMilestone(1, hash("evidence-1-1"))).wait();
  await (await escrow.connect(admin).verifyMilestone(2, hash("evidence-2-1"))).wait();
  await (await escrow.connect(admin).verifyMilestone(3, hash("evidence-3-1"))).wait();

  console.log(`\nNetwork          : ${network.name}`);
  console.log(`Escrow address   : ${address}`);
  console.log(`Deploy block     : ${deployReceipt?.blockNumber}`);
  console.log("\nAdd to the web app .env.local:");
  console.log("  C1_RPC_URL=http://127.0.0.1:8545");
  console.log(`  C1_ESCROW_ADDRESS=${address}`);
  console.log(`  C1_DEPLOY_BLOCK=${deployReceipt?.blockNumber}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
