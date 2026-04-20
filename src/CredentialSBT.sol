// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IVerifier {
    function verifyProof(
        uint[2]    calldata _pA,
        uint[2][2] calldata _pB,
        uint[2]    calldata _pC,
        uint[]     calldata _pubSignals
    ) external view returns (bool);
}

contract CredentialSBT is ERC721, Ownable {

    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool) {
        require(_credentials[tokenId].exists, "Token does not exist");
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    uint256 private _tokenIdCounter;

    struct Credential {
        string  metadataUri;
        bytes32 metadataHash;
        uint256 issueDate;
        bool    exists;
        bool    isRevoked;
    }

    mapping(uint256 => Credential) private _credentials;
    mapping(address => uint256[]) private _studentTokens;

    string public institutionName;

    event CredentialIssued(address indexed student, uint256 indexed tokenId, string metadataUri, bytes32 metadataHash, uint256 issueDate);
    event CredentialRevoked(address indexed student, uint256 indexed tokenId, uint256 revokedAt);

    IVerifier public gpaVerifier;
    IVerifier public degreeVerifier;
    IVerifier public existenceVerifier;

    event VerifiersSet(address gpa, address degree, address existence);

    event GpaProofVerified(address indexed student, uint256 indexed tokenId, uint256 threshold, bool result);
    event DegreeProofVerified(address indexed student, uint256 indexed tokenId, bool result);
    event ExistenceProofVerified(address indexed student, bool result);

    constructor(string memory _institutionName) ERC721("Academic Credential", "CRED") Ownable(msg.sender) {
        institutionName = _institutionName;
        _tokenIdCounter = 1;
    }

    function setVerifiers(
        address _gpaVerifier,
        address _degreeVerifier,
        address _existenceVerifier
    ) external onlyOwner {
        require(_gpaVerifier != address(0), "Invalid GPA verifier");
        require(_degreeVerifier != address(0), "Invalid degree verifier");
        require(_existenceVerifier != address(0), "Invalid existence verifier");

        gpaVerifier       = IVerifier(_gpaVerifier);
        degreeVerifier    = IVerifier(_degreeVerifier);
        existenceVerifier = IVerifier(_existenceVerifier);

        emit VerifiersSet(_gpaVerifier, _degreeVerifier, _existenceVerifier);
    }

    function issueCredential(
        address student,
        string  memory metadataUri,
        bytes32 metadataHash
    ) external onlyOwner returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(metadataUri).length > 0, "Metadata URI cannot be empty");
        require(metadataHash != bytes32(0), "Metadata hash cannot be empty");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(student, tokenId);

        _credentials[tokenId] = Credential(metadataUri, metadataHash, block.timestamp, true, false);
        _studentTokens[student].push(tokenId);

        emit CredentialIssued(student, tokenId, metadataUri, metadataHash, block.timestamp);
        emit Locked(tokenId);

        return tokenId;
    }

    function revokeCredential(uint256 tokenId) external onlyOwner {
        require(_credentials[tokenId].exists, "Credential does not exist");
        require(!_credentials[tokenId].isRevoked, "Credential already revoked");

        address student = ownerOf(tokenId);
        _credentials[tokenId].isRevoked = true;
        _burn(tokenId);

        emit CredentialRevoked(student, tokenId, block.timestamp);
    }

    function verifyCredential(address student, uint256 tokenId)
        external view
        returns (bool valid, bool revoked, string memory uri, bytes32 hash)
    {
        Credential memory cred = _credentials[tokenId];
        require(cred.exists, "Credential does not exist");
        require(_ownerOf(tokenId) == student || _credentials[tokenId].isRevoked, "Token not owned by student");

        revoked = cred.isRevoked;
        uri     = cred.metadataUri;
        hash    = cred.metadataHash;
        valid   = !revoked && ownerOf(tokenId) == student;
    }

    // prove: GPA >= threshold
    function verifyGpaProof(
        uint256        tokenId,
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[]     calldata pubSignals   // [credentialHash, threshold]
    ) external returns (bool) {
        require(address(gpaVerifier) != address(0), "GPA verifier not set");
        require(_credentials[tokenId].exists,        "Credential does not exist");
        require(!_credentials[tokenId].isRevoked,    "Credential is revoked");
        require(pubSignals.length == 2,              "Expected 2 public signals");

        bool result = gpaVerifier.verifyProof(pA, pB, pC, pubSignals);

        emit GpaProofVerified(msg.sender, tokenId, pubSignals[1], result);
        return result;
    }

    // prove: degree belongs to an approved set
    function verifyDegreeProof(
        uint256        tokenId,
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[]     calldata pubSignals   // [credentialHash, degreeSetRoot]
    ) external returns (bool) {
        require(address(degreeVerifier) != address(0), "Degree verifier not set");
        require(_credentials[tokenId].exists,           "Credential does not exist");
        require(!_credentials[tokenId].isRevoked,       "Credential is revoked");
        require(pubSignals.length == 2,                 "Expected 2 public signals");

        bool result = degreeVerifier.verifyProof(pA, pB, pC, pubSignals);

        emit DegreeProofVerified(msg.sender, tokenId, result);
        return result;
    }

    // prove: a valid, non-revoked credential exists for this wallet
    function verifyExistenceProof(
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[]     calldata pubSignals
    ) external returns (bool) {
        require(address(existenceVerifier) != address(0), "Existence verifier not set");
        require(pubSignals.length == 2,                    "Expected 2 public signals");

        bool result = existenceVerifier.verifyProof(pA, pB, pC, pubSignals);

        emit ExistenceProofVerified(msg.sender, result);
        return result;
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        require(_credentials[tokenId].exists, "Credential does not exist");
        return _credentials[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_credentials[tokenId].exists, "Token does not exist");
        return _credentials[tokenId].metadataUri;
    }

    function getStudentTokens(address student) external view returns (uint256[] memory) {
        return _studentTokens[student];
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: token is non-transferable");
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public virtual override { revert("Soulbound: token is non-transferable"); }
    function setApprovalForAll(address, bool) public virtual override { revert("Soulbound: token is non-transferable"); }
    function transferFrom(address, address, uint256) public virtual override { revert("Soulbound: token is non-transferable"); }
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override { revert("Soulbound: token is non-transferable"); }

}
