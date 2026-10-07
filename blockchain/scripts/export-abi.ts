import { artifacts } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/** Writes the compiled ABI to the web app so it can decode contract events. Run: npm run abi */
async function main() {
  const artifact = await artifacts.readArtifact("ScholarshipEscrow");
  const out = path.join(__dirname, "..", "..", "src", "lib", "c1", "abi", "ScholarshipEscrow.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(artifact.abi, null, 2));
  console.log(`Wrote ${path.relative(path.join(__dirname, "..", ".."), out)} (${artifact.abi.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
