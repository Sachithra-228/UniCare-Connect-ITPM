import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Grants ADMIN_ROLE (welfare officers) and DONOR_ROLE (donors / NGOs) on a deployed escrow.
 * Must be run by the DEFAULT_ADMIN (the deployer).
 *
 *   ADMIN_ADDRESSES=0xabc...,0xdef...  DONOR_ADDRESSES=0x123...  npm run roles:sepolia
 */
async function main() {
  const file = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const address = process.env.ESCROW_ADDRESS ?? (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")).address : undefined);
  if (!address) throw new Error(`No deployment found for ${network.name}. Deploy first or set ESCROW_ADDRESS.`);

  const list = (v?: string) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const admins = list(process.env.ADMIN_ADDRESSES);
  const donors = list(process.env.DONOR_ADDRESSES);
  if (admins.length + donors.length === 0) throw new Error("Set ADMIN_ADDRESSES and/or DONOR_ADDRESSES (comma separated).");
  for (const a of [...admins, ...donors]) if (!ethers.isAddress(a)) throw new Error(`Not a valid address: ${a}`);

  const [signer] = await ethers.getSigners();
  const escrow = (await ethers.getContractFactory("ScholarshipEscrow")).attach(address).connect(signer) as any;
  const ADMIN = await escrow.ADMIN_ROLE();
  const DONOR = await escrow.DONOR_ROLE();

  for (const a of admins) {
    await (await escrow.grantRole(ADMIN, a)).wait();
    console.log(`ADMIN_ROLE -> ${a}`);
  }
  for (const a of donors) {
    await (await escrow.grantRole(DONOR, a)).wait();
    console.log(`DONOR_ROLE -> ${a}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
