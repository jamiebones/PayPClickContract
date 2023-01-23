//SPDX-License-Identifier:MIT
pragma solidity ^0.8.15;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./ControlContract.sol";
import "./Lib.sol";

//import "hardhat/console.sol";

//vusd contract address : 0x8694A1A789133c94aA3c95B80c852583628A93b6

contract PayToClickContract {
    //storage

    using SharedStructs for *;

    //Declare control contract
    ControlContract private controlContract;


    //where to place the Member in the tree
    uint256 private currentIndex;

    //click reward in cents $1 token VUSD

    address private ownerWallet; //wallet of owner

    address private tokenManager; //wallet of owner

    //payment wallet
    address[] private adminWallet;

    uint256 public transactionTax = 1; //1 VNT

    //0=> owner wallet %
    //1=> admin wallet %

    //the array to hold the price of the membership packages of elite, premium and platinum

    IERC20 private VUSDTOKEN;

    //array of nodes
    SharedStructs.Node[100000] public nodes;
    //0=> elite plan : 1=> premium : 2=> platinum

    //SIMPLE QUEUE VARIABLE
    SharedStructs.Node[] private Nodequeue;

    //mappings
    mapping(address => Member) public members;

    mapping(address => SpillNode[]) private spillNodeArray; //the array that contains all spill nodes;

    mapping(address => SharedStructs.Node[]) public memberSubNode;
    mapping(address => uint256) public smbBonusEarned;
    //admin VNT purse in the main contract
    mapping(address => uint256) private adminVNTPurse;

    //withdrawal history
    // mapping(address => History[]) private withdrawalHistory;

    uint256[] public membershipPackagePriceArray = [20, 100, 1000];

    //0=> elite plan : 1=> premium : 2=> platinum
    SharedStructs.MembershipPackage[] private membershipPackagesArray;

    struct Member {
        address walletAddress;
        address upline; //the referral address
        uint256 slotIndex; //the index in the array
        uint256 uplineIndex; //the index of the upline
        //direct referral bonus earned
        uint256 directRefEarnings; //10% of package size
        uint256 clickRewardEarned; //total number of clicks
        uint256 totalEarnings; //total amount they have earned
        uint256 firstClickToday; //the firsttime the advert was clicked
        //array of invites that is the node positions
        uint256[] invites;
        MembershipType membershipType;
        bool status; //if the member is active or not
        uint8 clickCount; //how many times they have clicked in 24 hours
    }

    struct SpillNode {
        address memberAddress;
        uint256 points;
    }

    constructor(
        address owner,
        address tokenAddress,
        address payable controlContractAddress,
        //adminwallets
        address[] memory wallets,
        address tokenManagerContractAddress
    ) {
        //set all default packages value;
        //set all default membership plan
        ownerWallet = owner;
        tokenManager = tokenManagerContractAddress;
        for (uint256 i = 0; i < 3; i++) {
            if (i == 0) {
                SharedStructs.MembershipPackage memory newPackage;
                newPackage.dailyClicks = 10;
                newPackage.packagePoints = 1;
                newPackage.maximumIncome = 300;
                membershipPackagesArray.push(newPackage);
            } else if (i == 1) {
                SharedStructs.MembershipPackage memory newPackage;
                newPackage.dailyClicks = 20;
                newPackage.packagePoints = 5;
                newPackage.maximumIncome = 1500;
                membershipPackagesArray.push(newPackage);
            } else if (i == 2) {
                SharedStructs.MembershipPackage memory newPackage;
                newPackage.dailyClicks = 30;
                newPackage.packagePoints = 50;
                newPackage.maximumIncome = 6000;
                membershipPackagesArray.push(newPackage);
            }
        }

        //set admin adminWallet
        for (uint8 i = 0; i < wallets.length; i++) {
            adminWallet.push(wallets[i]);
        }

        controlContract = ControlContract(controlContractAddress);
        //set initial pyramid
        SharedStructs.Node memory newNode;
        newNode.memberAddress = owner;
        newNode.index = 0;
        newNode.leftPointer = 0;
        newNode.rightPointer = 0;

        //save the node
        nodes[0] = (newNode); //index will be 0

        //save the Member details
        Member memory newMember;
        newMember.directRefEarnings = 0;
        newMember.invites = new uint256[](0);
        newMember.walletAddress = owner;
        newMember.slotIndex = 0;
        newMember.upline = address(0);
        newMember.uplineIndex = 0;
        newMember.membershipType = MembershipType.PLATINUM;
        newMember.status = true;
        newMember.clickRewardEarned = 0;
        newMember.firstClickToday = 0;
        newMember.clickCount = 0;
        newMember.totalEarnings = 0;
        members[owner] = newMember;
        //increment the currentIndex
        currentIndex++;
        //save the token address in a variable
        VUSDTOKEN = IERC20(tokenAddress);
    }

    function buyMembershipPlan(uint256 planIndex, address referral) public {
        //check if the referral is valid if not valid referral is the owner with index 0;
        if (referral == address(0)) {
            referral = nodes[0].memberAddress;
        }
        //check if the person has the token to be able to buy the plan;
        if (members[referral].walletAddress == address(0)) {
            referral = nodes[0].memberAddress;
        }

        if (members[msg.sender].walletAddress != address(0)) {
            revert("1W");
        }

        uint256 planPrice = membershipPackagePriceArray[planIndex];
        planPrice = planPrice * 1 ether;

        uint256 planPoints = membershipPackagesArray[planIndex].packagePoints;
        //insert member into nodes
        (uint256 insertIndex, bool canInsert) = _insertMemberIntoNode(
            referral,
            planPoints
        );

        //create a new Member
        Member memory newMember;
        newMember.upline = referral;
        if (canInsert) {
            newMember.slotIndex = insertIndex;
        } else {
            //cannot insert just put a random value
            newMember.slotIndex = 1000000;
        }

        uint256 referralSlot = members[referral].slotIndex;
        newMember.uplineIndex = referralSlot;
        newMember.directRefEarnings = 0;
        newMember.walletAddress = msg.sender;
        newMember.clickRewardEarned = 0;
        newMember.firstClickToday = 0;
        newMember.invites = new uint256[](0);
        newMember.totalEarnings = 0;
        MembershipType memberType;
        if (planIndex == 0) {
            memberType = MembershipType.ELITE;
        } else if (planIndex == 1) {
            memberType = MembershipType.PREMIUM;
        } else if (planIndex == 2) {
            memberType = MembershipType.PLATINUM;
        }
        newMember.membershipType = memberType;
        newMember.status = true;
        newMember.clickCount = 0;

        members[msg.sender] = newMember;

        uint256 amountToShare = (planPrice * 10) / 100;
        uint256 amountToContract = (planPrice * 90) / 100;

        //10% bonus
        uint256 directRefBonus = (planPrice * 10) / 100; //the bonus keep for the upline
        //add to the direct ref bonus
        members[referral].directRefEarnings =
            members[referral].directRefEarnings +
            directRefBonus;
        //add the index to the
        if (canInsert) {
            //you only add the confirm node to the invites
            members[referral].invites.push(insertIndex);
        }
        shareTokenFeeToAdmin(amountToShare);

        VUSDTOKEN.transferFrom(msg.sender, tokenManager, amountToContract);
        //require(success, "transfer failed");
    }

    function _insertMemberIntoNode(address referral, uint256 points)
        private
        returns (uint256 index, bool canInsert)
    {
        //get the referral slotNumber
        uint256 referralSlot = members[referral].slotIndex;
        //get the referral node and see if the children position is filled;
        if (referralSlot == 1000000) {
            SpillNode memory spillNode;
            spillNode.memberAddress = msg.sender;
            spillNode.points = points;
            //add the spillNode to the array
            spillNodeArray[referral].push(spillNode);
            return (1000000, false);
        }
        SharedStructs.Node memory referralNode = nodes[referralSlot];
        if (referralNode.memberAddress != address(0)) {
            //we have a node present.
            //check if the leftchild is empty
            if (referralNode.leftPointer == 0) {
                //we can add the new Node here
                uint256 newLeftIndex = referralSlot * 2 + 1;
                SharedStructs.Node memory newNode;
                newNode.index = newLeftIndex;
                newNode.leftPointer = 0;
                newNode.rightPointer = 0;
                newNode.memberAddress = msg.sender;
                newNode.points = points;
                nodes[newLeftIndex] = newNode;
                //update the parent nodes reference here
                nodes[referralSlot].leftPointer = newLeftIndex;
                //increment the currentIndex
                currentIndex++;
                return (newLeftIndex, true);
                //return
            } else if (referralNode.rightPointer == 0) {
                //we can add it here
                uint256 newRightIndex = referralSlot * 2 + 2;
                SharedStructs.Node memory newNode;
                newNode.index = newRightIndex;
                newNode.leftPointer = 0;
                newNode.rightPointer = 0;
                newNode.memberAddress = msg.sender;
                newNode.points = points;
                nodes[newRightIndex] = newNode;
                //update the parent nodes reference here
                nodes[referralSlot].rightPointer = newRightIndex;
                //increment the currentIndex
                currentIndex++;
                return (newRightIndex, true);
            } else {
                //nothing works add it to spillNode spillNodeArray
                SpillNode memory spillNode;
                spillNode.memberAddress = msg.sender;
                spillNode.points = points;
                //add the spillNode to the array
                spillNodeArray[referral].push(spillNode);
                return (1000000, false);
            }
        }
    }

    function renewSubScription() public payable {
        Member memory member = members[msg.sender];
        uint256 maximumEarnings;
        uint256 planPrice;
        uint256 packagePoints;

        if (member.membershipType == MembershipType.ELITE) {
            maximumEarnings = membershipPackagesArray[0].maximumIncome;
            planPrice = membershipPackagePriceArray[0];
            packagePoints = membershipPackagesArray[0].packagePoints;
        } else if (member.membershipType == MembershipType.PLATINUM) {
            maximumEarnings = membershipPackagesArray[2].maximumIncome;
            planPrice = membershipPackagePriceArray[2];
            packagePoints = membershipPackagesArray[2].packagePoints;
        } else if (member.membershipType == MembershipType.PREMIUM) {
            maximumEarnings = membershipPackagesArray[1].maximumIncome;
            planPrice = membershipPackagePriceArray[1];
            packagePoints = membershipPackagesArray[1].packagePoints;
        }
        maximumEarnings = maximumEarnings * 1 ether;
        
        if (
            member.walletAddress == address(0) ||
            member.totalEarnings < maximumEarnings
        ) {
            revert("o");
        }
        planPrice = planPrice * 1 ether;
        uint256 amountToShare = (planPrice * 10) / 100;
        uint256 amountToContract = (planPrice * 90) / 100;

        //10% bonus
        uint256 directRefBonus = (planPrice * 10) / 100;
        //add to the direct ref bonus
        members[member.upline].directRefEarnings =
            members[member.upline].directRefEarnings +
            directRefBonus;

        //set the new membership here
        members[msg.sender].totalEarnings = 0;
        members[msg.sender].directRefEarnings = 0;

        //add the points to the node hereca
        //get the node
        SharedStructs.Node memory node = nodes[member.slotIndex];
        uint256 totalPoints = node.points + packagePoints;
        node.points = totalPoints;

        //add the node back to the binary tree system
        if (member.slotIndex != 0 && member.slotIndex != 1000000) {
            //not the owner and not the node not inserted yet
            nodes[member.slotIndex] = node;
        }

        //share to greedy bastards
        shareTokenFeeToAdmin(amountToShare);
        VUSDTOKEN.transferFrom(msg.sender, tokenManager, amountToContract);
        //require(success, "transfer failed");

        //transfer vnt to the greedy bastards
        shareTransactionFeeOfVNTToAdmin(msg.value);
    }

    function withdrawEarnings() public payable {
        (uint256 minimumWithdrawal, , , uint256 clickReward) = controlContract
            .getTransactionDetails();
        //check if the person has not collected more than their package
        //Member memory member = members[msg.sender];
        //check transaction tax

        if (msg.value < transactionTax) {
            revert();
        }

        //get package total Earnings
        uint256 maximumEarnings;
        if (members[msg.sender].membershipType == MembershipType.ELITE) {
            maximumEarnings = membershipPackagesArray[0].maximumIncome;
        } else if (
            members[msg.sender].membershipType == MembershipType.PLATINUM
        ) {
            maximumEarnings = membershipPackagesArray[2].maximumIncome;
        } else if (
            members[msg.sender].membershipType == MembershipType.PREMIUM
        ) {
            maximumEarnings = membershipPackagesArray[1].maximumIncome;
        }
        //check if they have not withdraw more than necessary
        maximumEarnings = maximumEarnings * 1 ether;
        if (members[msg.sender].slotIndex != 0) {
            if (members[msg.sender].totalEarnings >= maximumEarnings) {
                revert();
            }
        }

        //prepare the withdrawal here
        //bonus due to directRef
        uint256 amountAvailableToWithdraw;

        amountAvailableToWithdraw = members[msg.sender].directRefEarnings; //already in 18 decimals coming from the client

        uint256 smbBonus = controlContract.getSmbBonus();

        //bonus due to SMB
        //calculateSMBBonus();
        //uint256 smbPoints = smbBonusEarned[msg.sender];

        //get the token worth of the points
        amountAvailableToWithdraw += ((smbBonusEarned[msg.sender] * smbBonus) * 1 ether); //multiply by 18 decimals
        //bonus due to daily click

        uint256 pointClicked = members[msg.sender].clickRewardEarned;

        //click reward comes in as ether
        amountAvailableToWithdraw += (pointClicked * clickReward);
        //add amount available to withdraw to extra earnings left

        // require(
        //     amountAvailableToWithdraw >= minimumWithdrawal,
        //     "minimum withdrawal not met"
        // );

        //we are good here we can withdraw.
        uint256 amountToTransfer;
        //uint256 amountAfterTax = amountAvailableToWithdraw;
        

        if (
            amountAvailableToWithdraw == 0 ||
            members[msg.sender].totalEarnings == maximumEarnings
        ) {
            amountToTransfer = 0;
        } else if (
           amountAvailableToWithdraw + members[msg.sender].totalEarnings > maximumEarnings
        ) {
            //we need to just get the balance
            uint256 balance = maximumEarnings -
                members[msg.sender].totalEarnings;
            if (amountAvailableToWithdraw > balance) {
                amountToTransfer = balance;
            } else {
                amountToTransfer = amountAvailableToWithdraw;
            }
        } else {
            amountToTransfer = amountAvailableToWithdraw;
        }
        
          if (amountToTransfer < (minimumWithdrawal)) {
             revert();
        }
        //require(amountToTransfer > minimumWithdrawal, "");

        //add the money to the totalEarnings
        members[msg.sender].totalEarnings =
            members[msg.sender].totalEarnings +
            amountToTransfer;
        //set the directRef to 0
        members[msg.sender].directRefEarnings = 0;
        //set the dailyClick to 0
        members[msg.sender].clickRewardEarned = 0;
        //set the SMB to 0
        smbBonusEarned[msg.sender] = 0;


        uint256 finalAmount = (amountToTransfer * 90) / 100;
        uint256 taxOnWithdrawal = (amountToTransfer * 10) / 100;

        tokenManager.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                finalAmount
            )
        );

        //Transfer 10% to the greedy bastards
        shareTokenFeeToAdminOnWithdrawal(taxOnWithdrawal);

        //transfer tax to greedy bastards
        shareTransactionFeeOfVNTToAdmin(msg.value);
    }

    function insertSpillOverMember(
        uint256 parentIndex,
        uint256 points,
        address memberAddress
    ) public payable {
        //check if the nodeToInsert exist on the spillNodeArray
        SpillNode[] memory spillNode = spillNodeArray[msg.sender];
        bool exist;
        uint256 indexToRemove;
        for (uint8 i = 0; i < spillNode.length; i++) {
            if (spillNode[i].memberAddress == memberAddress) {
                exist = true;
                indexToRemove = i;
            }
        }

        // if (!exist) {
        //     revert();
        // }

        //get the member
        Member memory member = members[memberAddress];
        SharedStructs.Node memory parentNode = nodes[parentIndex];

        if (parentNode.memberAddress != address(0)) {
            uint256 childNode;
            if (parentNode.leftPointer == 0) {
                //add the node here
                childNode = 2 * parentIndex + 1;
                nodes[parentIndex].leftPointer = childNode;
            } else if (parentNode.rightPointer == 0) {
                childNode = 2 * parentIndex + 2;
                nodes[parentIndex].rightPointer = childNode;
            } else {
                revert("in");
            }
            //we can insert
            //create a new Node to insert
            SharedStructs.Node memory newNode;
            newNode.index = childNode;
            newNode.leftPointer = 0;
            newNode.rightPointer = 0;
            newNode.memberAddress = member.walletAddress;
            newNode.points = points;

            //place the new node on the nodes array
            nodes[childNode] = newNode;

            //add the pointer to the member
            members[member.walletAddress].slotIndex = childNode;

            //push the new index to the upline invites array
            //members[msg.sender].invites.push(childNode);

            //remove the node from the spillOverNodeArray
            spillNodeArray[msg.sender][indexToRemove] = spillNodeArray[
                msg.sender
            ][spillNodeArray[msg.sender].length - 1];
            spillNodeArray[msg.sender].pop();

            //remit tax to the greedy bastards:
            //transfer the VNT to the control contract first

            //think of a way to structure the sharing
            shareTransactionFeeOfVNTToAdmin(msg.value);
        }
    }

    function generateSubNodeFromBinaryTree() public {
        //check if the person is a member
        SharedStructs.Node[1000] memory subNodes;
        uint8 subNodeLength = 0;
        //Member memory findMember = members[msg.sender];
        uint256 slotIndex;
        if (
            members[msg.sender].walletAddress != address(0) &&
            members[msg.sender].slotIndex != 1000000
        ) {
            //check if they have a slot number
            slotIndex = members[msg.sender].slotIndex;
            if (
                (slotIndex == 0 &&
                    members[msg.sender].walletAddress == ownerWallet) ||
                slotIndex != 1000000
            ) {
                //this code will run if the slotIndex is 0 and the wallet address is the owner
                //or it will also run if the slotIndex is not zero
                SharedStructs.Node memory startingNode = nodes[slotIndex];
                //add the node to the queue
                controlContract._enqueue(startingNode); //starting point

                while (controlContract.getHead() != controlContract.getTail()) {
                    // Get the index of the next node in the queue
                    SharedStructs.Node memory dequeueNode = controlContract
                        ._dequeue();
                    //add to the final array to return here
                    subNodes[subNodeLength] = dequeueNode;
                    //increment subNodeLength
                    subNodeLength++;

                    //check left pointer
                    if (dequeueNode.leftPointer != 0) {
                        controlContract._enqueue(
                            nodes[dequeueNode.leftPointer]
                        );
                    }
                    //check right pointer
                    if (dequeueNode.rightPointer != 0) {
                        controlContract._enqueue(
                            nodes[dequeueNode.rightPointer]
                        );
                    }
                }
            }
        }
        //remove what was there before
        delete memberSubNode[msg.sender];
        bool savedAlready;
        for (uint256 i = 0; i < subNodes.length; i++) {
            if (slotIndex == 0 && subNodes[i].index == 0 && !savedAlready) {
                memberSubNode[msg.sender].push(subNodes[i]);
                savedAlready = true;
            } else if (subNodes[i].index != 0) {
                memberSubNode[msg.sender].push(subNodes[i]);
            }
        }
    }

    function retrieveSubNode()
        public
        view
        returns (SharedStructs.Node[] memory)
    {
        //return the generated sub node of the user;
        return (memberSubNode[msg.sender]);
    }

    receive() external payable {}


    function clickToEarn() public payable {
        // (, , uint256 transactionTax, ) = controlContract
        //     .getTransactionDetails();
        if (
            members[msg.sender].walletAddress == address(0) ||
            msg.value < transactionTax
        ) {
            revert();
        }

        //require(msg.value >= transactionTax, "insufficient tax sent");
        //Member memory member = members[msg.sender];
        uint256 allowedDailyClicks;
        if (members[msg.sender].membershipType == MembershipType.ELITE) {
            allowedDailyClicks = membershipPackagesArray[0].dailyClicks;
        } else if (
            members[msg.sender].membershipType == MembershipType.PLATINUM
        ) {
            allowedDailyClicks = membershipPackagesArray[2].dailyClicks;
        } else if (
            members[msg.sender].membershipType == MembershipType.PREMIUM
        ) {
            allowedDailyClicks = membershipPackagesArray[1].dailyClicks;
        }

        //uint256 fs = member.firstClickToday + (1 days);

        if (block.timestamp < members[msg.sender].firstClickToday + (1 days)) {
            //we can still click
            if (members[msg.sender].clickCount >= allowedDailyClicks) {
                revert();
            }
            //add the click to the
            members[msg.sender].clickRewardEarned += 1;
            members[msg.sender].clickCount += 1;
        } else {
            //we need to reset the click here
            members[msg.sender].firstClickToday = block.timestamp;
            members[msg.sender].clickRewardEarned += 1;
            members[msg.sender].clickCount = 1;
        }

        //share tax to greedy bastards
        shareTransactionFeeOfVNTToAdmin(msg.value);
    }

    function shareTransactionFeeOfVNTToAdmin(uint256 amount) public {
        //20% and 80%
        //require(ownerWallet != address(0), "owner wallet not set");
        //require(adminWallet.length == 4, "set admin wallet");
        adminVNTPurse[ownerWallet] += (amount * 20) / 100;

        for (uint256 i = 0; i < adminWallet.length; i++) {
            adminVNTPurse[adminWallet[i]] += (amount * 20) / 100;
        }
    }

    function withdrawTokenFromContract() public {
        uint256 assetBalance = adminVNTPurse[msg.sender];
        if (assetBalance > 0) {
            payable(msg.sender).call{value: assetBalance}("");
        }
    }

    function changeTransactionTax(uint256 tranTax) public onlyOwner {
        //dividing transaction tax by 1000
        if (tranTax > 0) {
            transactionTax = (tranTax * 1 ether) / 1000;
        }
    }

    modifier onlyOwner() {
        require(msg.sender == ownerWallet);
        _;
    }

    function shareTokenFeeToAdmin(uint256 amount) public {
        //20% and 80%
        VUSDTOKEN.transferFrom(msg.sender, ownerWallet, (amount * 20) / 100);

        for (uint256 i = 0; i < adminWallet.length; i++) {
            VUSDTOKEN.transferFrom(
                msg.sender,
                adminWallet[i],
                (amount * 20) / 100
            );
        }
    }

    function shareTokenFeeToAdminOnWithdrawal(uint256 amount) public {
        //20% and 80%
        tokenManager.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                ownerWallet,
                (amount * 20) / 100
            )
        );

        for (uint256 i = 0; i < adminWallet.length; i++) {
            //VUSDTOKEN.transfer(adminWallet[i], (amount * 20) / 100);
            tokenManager.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    adminWallet[i],
                    (amount * 20) / 100
                )
            );
        }
    }

    // function getNodeByIndex(uint256 index)
    //     public
    //     view
    //     returns (
    //         address,
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256
    //     )
    // {
    //     SharedStructs.Node memory node = nodes[index];
    //     return (
    //         node.memberAddress,
    //         node.index,
    //         node.leftPointer,
    //         node.rightPointer,
    //         node.points
    //     );
    // }

    function updateSMBBalance(
        uint256 smb,
        SharedStructs.Node[] memory nodesToUpdate
    ) public {
        for (uint256 i = 0; i < nodesToUpdate.length; i++) {
            SharedStructs.Node memory currentNode = nodesToUpdate[i];
            nodes[currentNode.index].points = currentNode.points;
        }
        if (smb > 0) {
            smbBonusEarned[msg.sender] = smbBonusEarned[msg.sender] + smb;
        }
    }

    function getMemberDetails()
        public
        view
        returns (
            SpillNode[] memory,
            address,
            address,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint8
        )
    {
        return (
            spillNodeArray[msg.sender],
            members[msg.sender].walletAddress,
            members[msg.sender].upline,
            members[msg.sender].slotIndex,
            members[msg.sender].directRefEarnings,
            members[msg.sender].clickRewardEarned,
            members[msg.sender].totalEarnings,
            members[msg.sender].firstClickToday,
            members[msg.sender].clickCount
        );
    }

    // function withdrawLeftOverFunds() public onlyOwner {
    //     //loop through the VNT purse
    //     uint256 sumTotal;

    //     for (uint8 i = 0; i < adminWallet.length; i++) {
    //         sumTotal += adminVNTPurse[adminWallet[i]];
    //     }

    //     sumTotal += adminVNTPurse[ownerWallet];
    //     uint256 totalBal = address(this).balance;
    //     uint256 toWithdraw = totalBal - sumTotal;
    //     if (toWithdraw > 0) {
    //         //withdraw balance
    //         payable(msg.sender).call{value: toWithdraw}("");
    //         //require(success, "f");
    //     }
    // }

    //Admin Function Starts Here //

    //Admin Function Ends Here //
}
