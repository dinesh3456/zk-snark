// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./verifier.sol";

contract TokenWithZK is ERC20, Ownable {
    Groth16Verifier public immutable verifier;
    uint256 private immutable _cap;
    bool private _paused;
    mapping(uint256 => bool) private _verifiedStates;

    event StateVerified(uint256 indexed state, bool success);
    event ProofVerified(bool success, uint256 indexed state);
    event Debug(string message, uint256 value);

    constructor(
        uint256 initialSupply,
        uint256 capValue,
        address initialOwner,
        address verifierAddress
    ) ERC20("Token", "TKN") Ownable(initialOwner) {
        require(capValue > 0, "Cap is 0");
        require(initialSupply <= capValue, "Initial supply exceeds cap");
        _cap = capValue;
        _mint(msg.sender, initialSupply);
        verifier = Groth16Verifier(verifierAddress);
    }

    function verifyState(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) public returns (bool) {
        require(input[0] > 0, "Invalid input state");
        
        bool isValid = verifier.verifyProof(a, b, c, input);
        require(isValid, "Invalid proof");
        
        _verifiedStates[input[0]] = true;
        
        emit StateVerified(input[0], true);
        emit ProofVerified(true, input[0]);
        
        return true;
    }

    function getVerificationStatus(uint256 state) public view returns (bool) {
        require(state > 0, "Invalid state value");
        return _verifiedStates[state];
    }

    function cap() public view returns (uint256) {
        return _cap;
    }

    function isPaused() public view returns (bool) {
        return _paused;
    }

    function pause() public onlyOwner {
        _paused = true;
    }

    function unpause() public onlyOwner {
        _paused = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "Token transfer while paused");
        _;
    }

    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}