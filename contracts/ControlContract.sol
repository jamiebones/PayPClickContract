//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Lib.sol";

enum MembershipType {
    ELITE,
    PREMIUM,
    PLATINUM
}

//vusd contract address : 0x8694A1A789133c94aA3c95B80c852583628A93b6

contract ControlContract is Ownable, ReentrancyGuard {
    //storage

    using SharedStructs for *;

    // Define the head and tail indices as public storage variables
    uint256 public head;
    uint256 public tail;

    //SIMPLE QUEUE VARIABLE
    SharedStructs.Node[] public Nodequeue;

    SharedStructs.Node public nodeStruct;

    //where to place the Member in the tree
    uint256 public advertCost;

    uint256 public transactionTax = 1;

    //click reward in cents $1 token VUSD
    uint256 public clickReward = 1;

    address public ownerWallet; //wallet of owner

    uint256 public minimumWithdrawal = 1;
    uint256 public smbBonus = 2;

    //payment wallet
    //address[5] public advertWalletPayment;
    address[] public adminWallet;

    //0=> owner wallet %
    //1=> admin wallet %
    uint8[3] public advertFeePercentage;

    uint256[3] public memberEntryPercentage;

    //the array to hold the price of the membership packages of elite, premium and platinum
    uint256[3] public membershipPackagePriceArray;

    address private vusdContractAddress;
    IERC20 private VUSDTOKEN;

    //0=> elite plan : 1=> premium : 2=> platinum
    SharedStructs.MembershipPackage[] public membershipPackagesArray;

    //mappings
    mapping(address => Advertiser) advertisers;
    mapping(address => SpillNode[]) spillNodeArray; //the array that contains all spill nodes;

    //withdrawal history
    mapping(address => History[]) public withdrawalHistory;

    //admin VNT purse in the main contract
    mapping(address => uint256) public adminVNTPurse;

    //struct

    struct History {
        uint256 time;
        uint256 amount;
    }

    struct Advertiser {
        address owner;
        string message;
        string[] links;
        bool active;
        uint256 dateSubscribed;
    }

    //the membership package

    struct SpillNode {
        address memberAddress;
        uint256 points;
    }

    constructor(address owner, address tokenAddress, address[]memory wallets) Ownable() {
        ownerWallet = owner;
        VUSDTOKEN = IERC20(tokenAddress);
        //set admin adminWallet
        for (uint8 i = 0; i < wallets.length; i++) {
            adminWallet.push(wallets[i]);
        }
    }

    function buyAdvertiserPlan(string memory message, string[] memory links)
        public
    {
        //check if all parameters are set
        require(advertCost > 0, "Advert cost not set");
        //check token balance;
        require(
            checkTokenBalance(msg.sender) > advertCost,
            "Transfer balancee small"
        );

        //save the advitiser

        Advertiser memory newAdvertiser;

        newAdvertiser.active = true;
        newAdvertiser.dateSubscribed = block.timestamp;
        newAdvertiser.links = links;
        newAdvertiser.message = message;
        newAdvertiser.owner = msg.sender;
        advertisers[msg.sender] = newAdvertiser;

        //perform the mathematics of sharing
        uint256 amountToShare = (advertCost * 10) / 100;

        //2% of it goes to owner wallet (1 address)
        //-8% goes to 4 wallets with 2% each (4 address)
        //90% goes to smartcontract address (1 address
        shareTokenFeeToAdmin(amountToShare);
        //transfer the 90% to the contract
        uint256 amountToContract = (advertCost * 90) / 100;
        bool success = VUSDTOKEN.transferFrom(
            msg.sender,
            address(this),
            amountToContract
        );
        require(success, "Transfer failed");
    }

    function shareTokenFeeToAdmin(uint256 amount) public {
        //20% and 80%
        require(ownerWallet != address(0), "owner wallet not set");
        require(adminWallet.length == 4, "set admin wallet");
        bool success = VUSDTOKEN.transferFrom(
            msg.sender,
            ownerWallet,
            (amount * 20) / 100
        );
        require(success);
        for (uint256 i = 0; i < adminWallet.length; i++) {
            bool success2 = VUSDTOKEN.transferFrom(
                msg.sender,
                adminWallet[i],
                (amount * 20) / 100
            );
            require(success2);
        }
    }

    function getAdvertFeePercentage() public view returns (uint8[3] memory) {
        return advertFeePercentage;
    }

    function getMemberEntryPercentage()
        public
        view
        returns (uint256[3] memory)
    {
        return memberEntryPercentage;
    }

    function getMembershipPackagePriceArray()
        public
        view
        returns (uint256[3] memory)
    {
        return membershipPackagePriceArray;
    }

    function getMembershipPackagesArray()
        public
        view
        returns (SharedStructs.MembershipPackage[] memory)
    {
        return membershipPackagesArray;
    }

    function getOwnerWallet() public view returns (address) {
        return ownerWallet;
    }

    function getSmbBonus() public view returns (uint256) {
        return smbBonus;
    }

    function getTransactionDetails()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        //minimumWithdrawal
        //advertCost
        //transactionTax
        //clickReward
        return (minimumWithdrawal, advertCost, transactionTax, clickReward);
    }

    function checkTokenBalance(address wallet) public view returns (uint256) {
        return VUSDTOKEN.balanceOf(wallet);
    }

    //Admin Function Starts Here //
    function configureSMBBonusAndMinimumWithdrawal(
        uint256 minWithdrawal,
        uint256 smbBonusAllocation
    ) public onlyOwner {
        if (minimumWithdrawal > 0) {
            minimumWithdrawal = minWithdrawal;
        }
        if (smbBonusAllocation > 0) {
            smbBonus = smbBonusAllocation;
        }
    }

    function setAdminDetails(uint256 adCost, uint256 rewardForClicking)
        public
        onlyOwner
    {
        if (adCost > 0) {
            advertCost = adCost;
        }

        if (rewardForClicking > 0) {
            clickReward = rewardForClicking;
        }
    }

    function setAdminWallet(address[] memory wallets) public onlyOwner {
        require(wallets.length == 4, "the wallet length should be 4");
        for (uint8 i = 0; i < wallets.length; i++) {
            adminWallet[i] = wallets[i];
        }
    }

    // function setTransactionTax(uint256 amount) public onlyOwner {
    //     transactionTax = amount;
    // }

    function setOwnerWallet(address wallet) public onlyOwner {
        ownerWallet = wallet;
    }

    // function setAdvertCost(uint256 cost) public onlyOwner {
    //     advertCost = cost;
    // }

    // function setClickReward(uint256 cost) public onlyOwner {
    //     clickReward = cost;
    // }

    function setAdvertMemberFeePercentage(
        uint8[2] memory advertFeeArray,
        uint8[2] memory memberFeeArray
    ) public onlyOwner {
        if (advertFeeArray.length > 0) {
            for (uint256 i = 0; i < advertFeeArray.length; i++) {
                advertFeePercentage[i] = advertFeeArray[i];
            }
        }

        if (memberFeeArray.length > 0) {
            for (uint256 i = 0; i < memberFeeArray.length; i++) {
                memberEntryPercentage[i] = memberFeeArray[i];
            }
        }
    }

    function setMembershipPackage(
        uint256 index,
        uint256 dailyClicks,
        uint256 packagePoints,
        uint256 maximumIncome
    ) public onlyOwner {
        require(
            index <= membershipPackagesArray.length - 1,
            "invalid array length"
        );
        SharedStructs.MembershipPackage memory editMembershipPackage;
        editMembershipPackage.dailyClicks = dailyClicks;
        editMembershipPackage.packagePoints = packagePoints;
        editMembershipPackage.maximumIncome = maximumIncome;
        membershipPackagesArray[index] = editMembershipPackage;
    }

    function advertClickIsWithin24Hours(uint256 firstClick)
        public
        view
        returns (bool)
    {
        //check if firstClick is is within 24hrs
        uint256 fs = firstClick + (1 days);
        if (block.timestamp < fs) {
            return true;
        } else {
            return false;
        }
    }

    function shareTransactionFeeOfVNTToAdmin(uint256 amount) public {
        //20% and 80%
        require(ownerWallet != address(0), "owner wallet not set");
        require(adminWallet.length == 4, "set admin wallet");
        adminVNTPurse[ownerWallet] += (amount * 20) / 100;

        for (uint256 i = 0; i < adminWallet.length; i++) {
            adminVNTPurse[adminWallet[i]] += (amount * 20) / 100;
        }
    }

    function shareWithdrawalTaxFeeToAdmin(uint256 amount) public {
        //20% and 80%
        require(ownerWallet != address(0), "owner wallet not set");
        require(adminWallet.length == 4, "set admin wallet");
        bool success = VUSDTOKEN.transfer(ownerWallet, (amount * 20) / 100);
        require(success);
        for (uint256 i = 0; i < adminWallet.length; i++) {
            bool success2 = VUSDTOKEN.transfer(
                adminWallet[i],
                (amount * 20) / 100
            );
            require(success2);
        }
    }

    function _dequeue() public returns (SharedStructs.Node memory) {
        // If the queue is empty, throw an exception
        require(head != tail, "Error: Queue is empty");

        // Get the value of the front element
        SharedStructs.Node memory value = Nodequeue[head];

        // Update the head index
        head = (head + 1);

        // Return the value of the removed node
        return value;
    }

    // Define a function to add a new value to the end of the queue
    function _enqueue(SharedStructs.Node memory value) public {
        // Add the new value to the end of the queue
        Nodequeue.push(value);
        // Update the tail index
        tail = (tail + 1);
    }

    function getHead() public view returns (uint256) {
        return head;
    }

    function getTail() public view returns (uint256) {
        return tail;
    }

    //Admin Function Ends Here //
}
