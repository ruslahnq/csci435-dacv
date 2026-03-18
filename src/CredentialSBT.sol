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

    function f(bytes4 interfaceId) public view virtual override returns (bool) {
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
}
