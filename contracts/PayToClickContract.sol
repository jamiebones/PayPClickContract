//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PayToClickContract is Ownable {
    //storage
    //where to place the Member in the tree
    uint256 private currentIndex;
    uint256 public advertCost;

    uint256 public transactionTax = 1;

    //click reward in cents $1 => 100
    uint256 public clickReward = 10;

    address public ownerWallet; //wallet of owner

    //payment wallet
    //address[5] public advertWalletPayment;
    address[4] public adminWallet;

    //0=> owner wallet %
    //1=> admin wallet %
    uint8[2] public advertFeePercentage;

    uint256[2] public memberEntryPercentage;

    //the array to hold the price of the membership packages of elite, premium and platinum
    uint256[2] public membershipPackagePriceArray;

    address private vusdContractAddress =
        0x8694A1A789133c94aA3c95B80c852583628A93b6;
    IERC20 private VUSDTOKEN = IERC20(vusdContractAddress);
    //array of nodes
    Node[] private nodes;
    //0=> elite plan : 1=> premium : 2=> platinum
    MembershipPackage[] private membershipPackagesArray;

    //mappings
    mapping(address => Member) members;
    mapping(address => Advertiser) advertisers;
    mapping(address => SpillNode[]) spillNodeArray; //the array that contains all spill nodes;

    //struct

    struct Advertiser {
        address owner;
        string message;
        string[] links;
        bool active;
        uint256 dateSubscribed;
    }

    struct Node {
        address memberAddress;
        uint256 index; //the index occupied in the array
        uint256 leftPointer;
        uint256 rightPointer;
        uint256 points; //point of the plan
    }

    struct Member {
        address walletAddress;
        address upline; //the referral address
        uint256 slotIndex; //the index in the array
        uint256 uplineIndex; //the index of the upline
        //direct referral bonus earned
        uint256 directRefEarnings; //10% of package size
        uint256 clickRewardEarned;
        uint256 firstClickToday; //the firsttime the advert was clicked
        //array of invites that is the node positions
        uint256[] invites;
        MembershipType membershipType;
        bool status; //if the member is active or not
        uint8 clickCount; //how many times they have clicked in 24 hours
    }

    //the membership package
    struct MembershipPackage {
        uint256 dailyClicks;
        uint256 packagePoints;
        uint256 maximumIncome;
    }

    struct SpillNode {
        address memberAddress;
        uint256 points;
    }

    //enum storage
    enum MembershipType {
        ELITE,
        PREMIUM,
        PLATINUM
    }

    constructor(address owner) {
        //set all default packages value;
        _setAllDefaultMembershipPackage();
        _setInitialPyramid(owner);
    }

    function buyAdvertiserPlan(string memory message, string[] memory links)
        public
    {
        //check if all parameters are set
        require(advertCost > 0, "advert fee not set");
        //check token balance;
        require(
            checkTokenBalance(msg.sender) > advertCost,
            "token balance too small"
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
        _shareTokenFeeToAdmin(amountToShare);
        //transfer the 90% to the contract
        uint256 amountToContract = (advertCost * 90) / 100;
        bool success = VUSDTOKEN.transferFrom(
            msg.sender,
            address(this),
            amountToContract
        );
        require(success, "transfer failed");
    }

    function buyMembershipPlan(uint256 planIndex, address referral) public {
        //check if the referral is valid if not valid referral is the owner with index 0;
        if (referral == address(0)) {
            referral = nodes[0].memberAddress;
        }
        //check if the person has the token to be able to buy the plan;
        require(
            members[referral].walletAddress != address(0),
            "referral not a member"
        );
        //check if the member already exist and also check if not active
        require(
            members[msg.sender].walletAddress != address(0) &&
                members[msg.sender].status == true,
            "member exist and active"
        );

        require(planIndex <= 2, "invalid membership index passed");

        //
        require(membershipPackagePriceArray[0] > 0, "membership price not set");
        uint256 planPrice = membershipPackagePriceArray[planIndex];
        //check if they have tokens
        require(
            VUSDTOKEN.balanceOf(msg.sender) >= planPrice,
            "insufficent token to buy plan"
        );
        uint256 allowancePermitted = VUSDTOKEN.allowance(
            msg.sender,
            address(this)
        );
        require(allowancePermitted >= planPrice, "insufficient allowance set");

        uint256 planPoints = membershipPackagesArray[planIndex].packagePoints;
        //insert member into nodes
        (uint256 insertIndex, bool canInsert) = _insertMemberIntoNode(
            referral,
            planPoints
        );

        //create a new Member
        createNewMember(referral, insertIndex, planIndex);

        uint256 amountToShare = (planPrice * 10) / 100;
        uint256 amountToContract = (planPrice * 80) / 100;

        //10% bonus
        uint256 directRefBonus = (planPrice * 10) / 100;
        //add to the direct ref bonus
        members[referral].directRefEarnings =
            members[referral].directRefEarnings +
            directRefBonus;
        //add the index to the
        if (canInsert) {
            //you only add the confirm node to the invites
            members[referral].invites.push(insertIndex);
        }

        _shareTokenFeeToAdmin(amountToShare);
        bool success = VUSDTOKEN.transferFrom(
            msg.sender,
            address(this),
            amountToContract
        );
        require(success, "transfer failed");
    }

    function _insertMemberIntoNode(address referral, uint256 points)
        private
        returns (uint256 index, bool canInsert)
    {
        //get the referral slotNumber
        uint256 referralSlot = members[referral].slotIndex;
        //get the referral node and see if the children position is filled;
        Node memory referralNode = nodes[referralSlot];
        if (referralNode.memberAddress != address(0)) {
            //we have a node present.
            //check if the leftchild is empty
            if (referralNode.leftPointer != 0) {
                //we can add the new Node here
                uint256 newLeftIndex = referralSlot * 2 + 1;
                Node memory newNode;
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
            } else if (referralNode.rightPointer != 0) {
                //we can add it here
                uint256 newRightIndex = referralSlot * 2 + 2;
                Node memory newNode;
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
                return (0, false);
            }
        }
    }

    function createNewMember(
        address referral,
        uint256 slotIndex,
        uint256 planIndex
    ) private {
        Member memory newMember;
        newMember.upline = referral;
        newMember.slotIndex = slotIndex;
        uint256 referralSlot = members[referral].slotIndex;
        newMember.uplineIndex = referralSlot;
        newMember.directRefEarnings = 0;
        newMember.walletAddress = msg.sender;
        newMember.clickRewardEarned = 0;
        newMember.firstClickToday = 0;
        newMember.invites = new uint256[](0);
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
    }

    function _shareTokenFeeToAdmin(uint256 amount) private {
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

    function shareTransactionFeeOfVNTToAdmin(uint256 amount) private {
        //20% and 80%
        require(ownerWallet != address(0), "owner wallet not set");
        require(adminWallet.length == 4, "set admin wallet");
        (bool success, ) = payable(address(this)).call{
            value: (amount * 20) / 100
        }("");
        require(success, "VNT transfer failed");
        for (uint256 i = 0; i < adminWallet.length; i++) {
            (bool success2, ) = payable(address(this)).call{
                value: (amount * 20) / 100
            }("");
            require(success2, "vnt transfer 2 failed");
        }
    }

    receive() external payable {}

    function checkTokenBalance(address wallet) public view returns (uint256) {
        return VUSDTOKEN.balanceOf(wallet);
    }

    function _setInitialPyramid(address owner) private {
        //add the first value in the Node array
        Node memory newNode;
        newNode.memberAddress = owner;
        newNode.index = currentIndex;
        newNode.leftPointer = 0;
        newNode.rightPointer = 0;

        //save the node
        nodes[currentIndex] = newNode;

        //save the Member details
        Member memory newMember;
        newMember.directRefEarnings = 0;
        newMember.invites = new uint256[](0);
        newMember.walletAddress = owner;
        newMember.slotIndex = currentIndex;
        newMember.upline = address(0);
        newMember.uplineIndex = 0;
        newMember.membershipType = MembershipType.PLATINUM;
        newMember.status = true;
        newMember.clickRewardEarned = 0;
        newMember.firstClickToday = 0;
        newMember.clickCount = 0;
        members[owner] = newMember;
        //increment the currentIndex
        currentIndex++;
    }

    //Admin Function Starts Here //

    function setMembershipPricing(uint256[2] memory pricing) public onlyOwner {
        require(pricing.length == 2, "the pricing requires 3 element");
        for (uint8 i = 0; i < pricing.length; i++) {
            membershipPackagePriceArray[i] = pricing[i];
        }
    }

    function setAdminWallet(address[] memory wallets) public onlyOwner {
        require(wallets.length == 4, "the wallet length should be 4");
        for (uint8 i = 0; i < wallets.length; i++) {
            adminWallet[i] = wallets[i];
        }
    }

    function setTransactionTax(uint256 amount) public onlyOwner {
        transactionTax = amount;
    }

    function setOwnerWallet(address wallet) public onlyOwner {
        ownerWallet = wallet;
    }

    function setAdvertCost(uint256 cost) public onlyOwner {
        advertCost = cost;
    }

    function setClickReward(uint256 cost) public onlyOwner {
        clickReward = cost;
    }

    function setAdvertFeePercentage(uint8[2] memory percentageArray)
        public
        onlyOwner
    {
        require(percentageArray.length == 2, "invalid array length");
        for (uint256 i = 0; i < percentageArray.length; i++) {
            advertFeePercentage[i] = percentageArray[i];
        }
    }

    function setMemberFeePercentage(uint8[2] memory percentageArray)
        public
        onlyOwner
    {
        require(percentageArray.length == 2, "invalid array length");
        for (uint256 i = 0; i < percentageArray.length; i++) {
            memberEntryPercentage[i] = percentageArray[i];
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
        MembershipPackage memory editMembershipPackage;
        editMembershipPackage.dailyClicks = dailyClicks;
        editMembershipPackage.packagePoints = packagePoints;
        editMembershipPackage.maximumIncome = maximumIncome;
        membershipPackagesArray[index] = editMembershipPackage;
    }

    function _addMemberToBinaryNode() public {
        //get the available currentIndex
    }

    //Admin Function Ends Here //

    //set membership
    function _setAllDefaultMembershipPackage() private {
        //create a loop
        for (uint256 i = 0; i < 3; i++) {
            if (i == 0) {
                MembershipPackage memory newPackage;
                newPackage.dailyClicks = 10;
                newPackage.packagePoints = 1;
                newPackage.maximumIncome = 100;
                membershipPackagesArray[0] = newPackage;
            }
            if (i == 1) {
                MembershipPackage memory newPackage;
                newPackage.dailyClicks = 20;
                newPackage.packagePoints = 5;
                newPackage.maximumIncome = 500;
                membershipPackagesArray[0] = newPackage;
            }

            if (i == 2) {
                MembershipPackage memory newPackage;
                newPackage.dailyClicks = 30;
                newPackage.packagePoints = 25;
                newPackage.maximumIncome = 2500;
                membershipPackagesArray[0] = newPackage;
            }
        }
    }
}
