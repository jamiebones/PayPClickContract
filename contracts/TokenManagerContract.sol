
//SPDX-License-Identifier:MIT
pragma solidity ^0.8.15;
import "hardhat/console.sol";

contract TokenManagerContract {
    address private myTokenAddress;
 
    constructor(address tokenAddress){
        myTokenAddress = tokenAddress;
    }


    function transfer(address _to, uint _amount) external {
        console.log("msg.sender : ", msg.sender);
        console.log("tx origin :", tx.origin);
        (bool success, ) = myTokenAddress.call(abi.encodeWithSignature("transfer(address,uint256)",_to,_amount));
        require(success, "transfer failed");
    }
}