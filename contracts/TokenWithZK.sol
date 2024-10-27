// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./verifier.sol";

contract TokenWithZK is ERC20, Ownable {
    Groth16Verifier public verifier;
    uint256 private immutable _cap;
    bool private _paused;
    mapping(uint256 => bool) public verifiedStates;  // Changed from bytes32 to uint256

    event StateVerified(uint256 indexed state);
    event ProofVerified(bool success);

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

    modifier whenNotPaused() {
        require(!_paused, "Token transfer while paused");
        _;
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
        
        emit ProofVerified(isValid);
        
        // Store the state directly
        verifiedStates[input[0]] = true;
        
        emit StateVerified(input[0]);
        return true;
    }

    function isStateVerified(uint256 state) public view returns (bool) {
        require(state > 0, "Invalid state value");
        return verifiedStates[state];
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= _cap, "Cap exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    function pause() public onlyOwner {
        _paused = true;
    }

    function unpause() public onlyOwner {
        _paused = false;
    }

    function cap() public view returns (uint256) {
        return _cap;
    }

    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}