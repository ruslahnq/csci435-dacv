# Decentralized Academic Credential Verification (SBT-Verify)

### Moving beyond paper diplomas with Soulbound Tokens.

The current process for verifying academic credentials is slow, manual, and prone to fraud. **SBT-Verify** is a blockchain-based solution that replaces physical diplomas with **Soulbound Tokens (SBTs)**—non-transferable NFTs that allow employers to instantly verify a candidate's education without ever contacting the university.

---

## The Core Concept

Traditional diplomas rely on a centralized authority to vouch for an individual. This project decentralizes that trust.

By using the **ERC-5192** standard, we create digital credentials that are:

* **Immutable:** Cannot be forged or tampered with.
* **Soulbound:** Tied to a specific wallet address; they cannot be sold, traded, or transferred.
* **Instantly Verifiable:** Validated via smart contract in seconds.

---

## The Ecosystem Flow: The Trust Triangle

The system operates through three primary actors:

1. **The Issuer (The University):** * Establishes a verified Decentralized Identifier (DID).
* Mints the SBT directly to the student's wallet upon graduation.
* Hosts encrypted metadata (GPA, Degree Type) on IPFS.


2. **The Holder (The Student):** * Maintains a non-custodial wallet (e.g., MetaMask).
* Owns their academic data permanently.
* Provides proof of ownership to potential employers via their wallet address.


3. **The Verifier (The Employer):**
* Queries the blockchain to check if the student's wallet contains the required SBT.
* Confirms the SBT was minted by the University's official contract address.
* Receives instant "Pass/Fail" verification.



---

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Blockchain** | Ethereum / Polygon / Layer 2 |
| **Smart Contract Standard** | ERC-5192 (Minimal Soulbound) |
| **Decentralized Storage** | IPFS (via Pinata or Web3.Storage) |
| **Development Framework** | Hardhat or Foundry |
| **Frontend** | React.js / Next.js with Ethers.js |

---

## Key Considerations & Caveats

> [!IMPORTANT]
> Developing on-chain identity requires balancing transparency with security.

* **Privacy:** To comply with GDPR and student privacy, sensitive data (like specific grades) should be stored off-chain or protected using **Zero-Knowledge Proofs (ZKPs)**.
* **Revocation:** While the blockchain is "permanent," the smart contract includes a `burn` function that only the University (Issuer) can trigger in case a degree is rescinded.
* **Identity Linkage:** The system assumes the wallet belongs to the student. Future iterations will look at linking wallets to government-issued IDs.

---

## Development Roadmap for the MVP

1. **Phase 1:** Develop and deploy the Soulbound Smart Contract (ERC-5192).
2. **Phase 2:** Build the **Issuer Dashboard** for university administrators to mint tokens in bulk.
3. **Phase 3:** Integrate **IPFS** for decentralized metadata storage.
4. **Phase 4:** Build the **Verification Portal** for employers to scan and validate student wallets.

---

