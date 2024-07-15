// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FreyaMemeCoin is ERC20, Ownable {
    constructor(
        address[] memory _addresses,
        uint256[] memory _amounts
    ) ERC20("Freya Meme Coin", "FREYA") Ownable(msg.sender) {
        require(
            _addresses.length == _amounts.length,
            "Addresses and amounts length mismatch"
        );
        // _mint(msg.sender, 10000000 * 10 ** decimals());
        for (uint256 i = 0; i < _addresses.length; i++) {
            _mint(_addresses[i], _amounts[i] * 10 ** decimals());
        }
    }
}
