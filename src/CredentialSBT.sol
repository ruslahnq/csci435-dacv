// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CredentialSBT is ERC721, Ownable {

    event Locked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool) {
        require(_credentials[tokenId].exists, "Token does not exist");
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        // choosing ERC-5192 support as this is a soulbound token contract
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

    constructor(string memory _institutionName) ERC721("Academic Credential", "CRED") Ownable(msg.sender) {
        institutionName = _institutionName;
        _tokenIdCounter = 1;
    }

    function issueCredential(address student, string memory metadataUri, bytes32 metadataHash) external onlyOwner returns (uint256) {
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

    function verifyCredential(address student, uint256 tokenId) external view returns (bool valid, bool revoked, string memory uri, bytes32 hash) {
        Credential memory cred = _credentials[tokenId];
        require(cred.exists, "Credential does not exist");

        revoked = cred.isRevoked;
        uri     = cred.metadataUri;
        hash    = cred.metadataHash;
        valid   = !revoked && ownerOf(tokenId) == student;
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        require(_credentials[tokenId].exists, "Credential does not exist");
        return _credentials[tokenId];
    }

    function getStudentTokens(address student) external view returns (uint256[] memory) {
        return _studentTokens[student];
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: token is non-transferable");
        return super._update(to, tokenId, auth);
    }
}
