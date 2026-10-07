import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

/**
 * Hardhat configuration for the UniCare Connect C1 smart contracts.
 *
 * Secrets (RPC URL, deployer key) are read ONLY from environment variables /
 * a local, git-ignored `.env` file. Never commit them. See `.env.example`.
 */
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    // SIMULATE_START lets "npm run simulate" replay the pilot from a fixed date.
    hardhat: process.env.SIMULATE_START ? { initialDate: process.env.SIMULATE_START } : {},
    localhost: { url: "http://127.0.0.1:8545" },
    ...(SEPOLIA_RPC_URL && DEPLOYER_PRIVATE_KEY
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [DEPLOYER_PRIVATE_KEY],
            chainId: 11155111
          }
        }
      : {})
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    noColors: true
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? ""
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
