

//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract VUSD is ERC20 {
    constructor() ERC20("VUSD", "VU") {
        _mint(msg.sender, 100000000000000000 * 10 ** decimals());
    }
}