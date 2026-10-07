import { ethers, network, artifacts } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Deploys ScholarshipEscrow and writes `deployments/<network>.json`
 * (address, deployer, tx hash, block) so the web app can be configured with
 * C1_ESCROW_ADDRESS. For Sepolia, set SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
 * in blockchain/.env first (testnet wallet only).
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Network   : ${network.name}`);
  console.log(`Deployer  : ${deployer.address}`);
  console.log(`Balance   : ${ethers.formatEther(balance)} ETH`);

  const Escrow = await ethers.getContractFactory("ScholarshipEscrow");
  const escrow = await Escrow.deploy(deployer.address);
  const receipt = await escrow.deploymentTransaction()?.wait();
  const address = await escrow.getAddress();

  console.log(`Escrow    : ${address}`);
  console.log(`Gas used  : ${receipt?.gasUsed.toString()}`);

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const artifact = await artifacts.readArtifact("ScholarshipEscrow");
  const record = {
    contract: "ScholarshipEscrow",
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address,
    deployer: deployer.address,
    txHash: receipt?.hash,
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed.toString(),
    deployedAt: new Date().toISOString(),
    abiFile: "../src/lib/c1/abi/ScholarshipEscrow.json"
  };
  fs.writeFileSync(path.join(outDir, `${network.name}.json`), JSON.stringify(record, null, 2));

  // Keep the web app's ABI in sync with the compiled contract.
  const abiDir = path.join(__dirname, "..", "..", "src", "lib", "c1", "abi");
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(path.join(abiDir, "ScholarshipEscrow.json"), JSON.stringify(artifact.abi, null, 2));
  console.log(`Wrote deployments/${network.name}.json and src/lib/c1/abi/ScholarshipEscrow.json`);
  console.log("\nNext: set C1_RPC_URL, C1_ESCROW_ADDRESS (and C1_CHAIN_ID) in the web app's .env.local");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
