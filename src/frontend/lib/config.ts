// SBT-Verify Configuration

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const SEPOLIA_CHAIN_ID = 11155111;

export const NETWORKS: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Mumbai",
};

export const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

// Contract address - to be updated when deployed
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// Contract ABI (minimal for display purposes)
export const CONTRACT_ABI = [
  {
    inputs: [{ name: "to", type: "address" }],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "revoke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const DEGREE_OPTIONS = [
  { value: "bachelor_science", label: "Bachelor of Science" },
  { value: "bachelor_arts", label: "Bachelor of Arts" },
  { value: "master_science", label: "Master of Science" },
  { value: "master_arts", label: "Master of Arts" },
  { value: "doctor_philosophy", label: "Doctor of Philosophy" },
  { value: "associate", label: "Associate Degree" },
] as const;
