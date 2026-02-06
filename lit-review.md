## Goal of our project
### Decentralizing Academic Credential Verification

The current credentialing system is identified as being slow, costly, and vulnerable to academic fraud such as fake degrees or falsified resumes. To validate the credentials of a person employer, for example, should contact the issuier (for example an universityr) to vauch for the person who is the graduate of the university. This system is highly centralized and requires a lot of human-involved work on the universties side. We want to solve the problem by decentralizing the system and managing everything on the blockchain. Everything now will be automatically managed in the chain itself and employer can verify the certificate of a person on its own without needing to contact the university.

>Of course, I assume everyone here knows how the blockchain works and I will not cover the basics.

### Implementing Non-Transferability via `ERC-5192`
A core requirement of our project is that degrees must be unique to the student and not tradable. The sources provide the technical standard for this: `ERC-5192`.

- This standard extends the typical NFT (ERC-721) by adding a locked function.
- It allows our system to programmatically prevent a student from selling or transferring their diploma to another wallet. This "soulbinding" ensures the token remains permanently bound to the recipient’s address

## Some literature review we did  
https://doi.org/10.48550/arXiv.2508.05334

For a verification system to work at scale, it requires more than just a token; it needs a governance framework. The ShikkhaChain source offers a blueprint for a national-scale system.
- Our project can adopt a layered architecture—separating the user interface (React/MetaMask), the storage (IPFS), and the core logic (Ethereum Smart Contracts).
- Key Feature: Revocation. A critical project component is the ability for a university to revoke a degree if fraud is discovered. ShikkhaChain demonstrates how on-chain revocation tracking provides transparency while maintaining decentralization.
- Storage Efficiency: Instead of bloating the blockchain, we can use IPFS for off-chain storage of metadata (for example name, degree type, etc.), storing only the Content Identifier (CID) on-chain to ensure the record remains tamper-proof and scalable

---

https://dx.doi.org/10.2139/ssrn.4105763  

This paper discusses a thing called **social identity** or Soul.  
The crucial technology is SBT tokens: SBTs act as a persistent, non-transferable record of a student's commitments and affiliations.

Some important concepts from the paper:
- Security Innovation: Community Recovery. One major risk in decentralized systems is a student losing access to their wallet. The sources propose community recovery, where a "qualified majority" of the student's network (for example, the university, former employers, or peers) can collectively consent to regenerate the student's keys.
- Privacy Control: The concept of "programmable privacy" allows students to use Zero-Knowledge Proofs to prove they have a degree to an employer without necessarily revealing their entire academic transcript or other private SBTs held in their "Soul"

---

https://doi.org/10.48550/arXiv.2006.12665  

This source describes advantages we provide for the key actors, namely: studetns, universities, and employers (or just any verifiers).

- Students achieve document portability and permanence: their records exist as long as the blockchain exists.
- Universities can protect their brand integrity because no one can falsely claim to have a degree from their institution. They also reduce administrative overhead by automating verification queries.
- Employers gain instant, trust-less access to legitimate credentials, removing the need for third-party "credential evaluators" who are often expensive and inconsistent

https://www.blockcerts.org/  
There is a similar project already existing in the world.
I will discuss some of the differences:
- Non-Transferability: while BlockCerts is an open standard for verifying digital records via hashes, our project uses SBTs under the ERC-5192 standard, which programmatically prevents tokens from being transferred or sold once issued
- Community recovery: another major limitation of standard blockchain wallets is the risk of losing private keys. Our project can implement community recovery, allowing a student to regenerate their keys through the collective consent of their social and academic network
- Scalable Off-Chain Storage: unlike early BlockCerts models that focused on on-chain hashes, our project can utilize IPFS to store rich metadata (like the degree's details) off-chain, linking it to the blockchain via a Content Identifier (CID) to ensure both scalability and tamper-resistance
---
