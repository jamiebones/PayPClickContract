//SPDX-License-Identifier:MIT
pragma solidity ^0.8.15;


library SharedStructs {
     struct Node {
        address memberAddress;
        uint256 index; //the index occupied in the array
        uint256 leftPointer;
        uint256 rightPointer;
        uint256 points; //point of the plan
    }
     struct MembershipPackage {
        uint256 dailyClicks;
        uint256 packagePoints;
        uint256 maximumIncome;
    }
    
}