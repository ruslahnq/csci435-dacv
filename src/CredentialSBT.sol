// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialSBT
 * @dev Soulbound Token for Academic Credentials
 * @notice This contract issues non-transferable credentials to students
 */
contract CredentialSBT is ERC721, Ownable {
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Struct to store credential information
    struct Credential {
        string studentName;
        string degree;
        string major;
        uint256 graduationYear;
        uint256 issueDate;
        bool exists;
    }
    
    // Mapping from token ID to credential data
    mapping(uint256 => Credential) private _credentials;
    
    // Mapping from student address to array of their token IDs
    mapping(address => uint256[]) private _studentTokens;
    
    // Institution name
    string public institutionName;
    
    // Events
    event CredentialIssued(
        address indexed student,
        uint256 indexed tokenId,
        string degree,
        string major,
        uint256 graduationYear
    );
    
    /**
     * @dev Constructor to initialize the contract
     * @param _institutionName Name of the issuing institution
     */
    constructor(string memory _institutionName) 
        ERC721("Academic Credential", "CRED") 
        Ownable(msg.sender)
    {
        institutionName = _institutionName;
        _tokenIdCounter = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Issue a new credential to a student
     * @param student Address of the student receiving the credential
     * @param studentName Full name of the student
     * @param degree Type of degree (e.g., "Bachelor of Science")
     * @param major Field of study (e.g., "Computer Science")
     * @param graduationYear Year of graduation
     * @return tokenId The ID of the newly minted credential token
     */
    function issueCredential(
        address student,
        string memory studentName,
        string memory degree,
        string memory major,
        uint256 graduationYear
    ) external onlyOwner returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(degree).length > 0, "Degree cannot be empty");
        require(bytes(major).length > 0, "Major cannot be empty");
        require(graduationYear >= 1900 && graduationYear <= 2100, "Invalid graduation year");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint the token
        _safeMint(student, tokenId);
        
        // Store credential data
        _credentials[tokenId] = Credential({
            studentName: studentName,
            degree: degree,
            major: major,
            graduationYear: graduationYear,
            issueDate: block.timestamp,
            exists: true
        });
        
        // Add to student's token list
        _studentTokens[student].push(tokenId);
        
        emit CredentialIssued(student, tokenId, degree, major, graduationYear);
        
        return tokenId;
    }
    
    /**
     * @dev Get credential details by token ID
     * @param tokenId The ID of the credential token
     * @return Credential struct containing all credential information
     */
    function getCredential(uint256 tokenId) 
        external 
        view 
        returns (Credential memory) 
    {
        require(_credentials[tokenId].exists, "Credential does not exist");
        return _credentials[tokenId];
    }
    
    /**
     * @dev Get all token IDs owned by a student
     * @param student Address of the student
     * @return Array of token IDs
     */
    function getStudentTokens(address student) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _studentTokens[student];
    }
    
    /**
     * @dev Get total number of credentials issued
     * @return Total count of credentials
     */
    function totalCredentials() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Check if an address owns a specific credential
     * @param student Address to check
     * @param tokenId Token ID to verify
     * @return bool True if the address owns the token
     */
    function verifyCredentialOwnership(address student, uint256 tokenId) 
        external 
        view 
        returns (bool) 
    {
        return ownerOf(tokenId) == student;
    }
    
    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from address(0))
        // Block all transfers (from != address(0))
        require(from == address(0), "Soulbound: Token is non-transferable");
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Disable approve functionality for soulbound tokens
     */
    function approve(address, uint256) public virtual override {
        revert("Soulbound: Token is non-transferable");
    }
    
    /**
     * @dev Disable setApprovalForAll functionality for soulbound tokens
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert("Soulbound: Token is non-transferable");
    }
    
    /**
     * @dev Override to disable token transfers
     */
    function transferFrom(address, address, uint256) public virtual override {
        revert("Soulbound: Token is non-transferable");
    }
    
    /**
     * @dev Override to disable safe transfers
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert("Soulbound: Token is non-transferable");
    }
}
