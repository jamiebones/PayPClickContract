const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");

const transactionTax = 1;
const amountToTransfer = ethers.utils.parseEther("1000");

const bigAmountToTransfer = ethers.utils.parseEther("1000000000");

const { GetAllNodesAtEachLevel, CalculateSMBBonus } = require("./utilities");

let owner,
  memberOne,
  memberTwo,
  memberThree,
  memberFour,
  memberFive,
  memberSix,
  memberSeven,
  memberEight,
  memberNine,
  memberTen,
  memberEleven,
  admin1,
  admin2,
  admin3,
  admin4,
  VUSDContract,
  ControlContract,
  PayToClickContract,
  TokenManager;

describe("PayToClickContract", function () {
  describe("Pay to click test suite", async function () {
    before(async () => {
      [
        owner,
        memberOne,
        memberTwo,
        memberThree,
        memberFour,
        memberFive,
        memberSix,
        memberSeven,
        memberEight,
        memberNine,
        memberTen,
        memberEleven,
        admin1,
        admin2,
        admin3,
        admin4,
      ] = await ethers.getSigners();

      const VUSDContractFactory = await hre.ethers.getContractFactory("VUSD");
      VUSDContract = await VUSDContractFactory.deploy();
      await VUSDContract.deployed();
      console.log("VUSD contract deployed to ", VUSDContract.address);

      //token manager
      const TokenManagerFactory = await hre.ethers.getContractFactory(
        "TokenManagerContract"
      );
      TokenManager = await TokenManagerFactory.deploy(
        VUSDContract.address //token address
      );
      await TokenManager.deployed();
      console.log("Token manager deployed to", TokenManager.address);

      //contract Factory
      const ControlFactory = await hre.ethers.getContractFactory(
        "ControlContract"
      );
      ControlContract = await ControlFactory.deploy(
        owner.address,
        VUSDContract.address,
        [admin1.address, admin2.address, admin3.address, admin4.address],
        TokenManager.address
      );
      await ControlContract.deployed();
      console.log("control contract deployed to ", ControlContract.address);
      //deploy the contracts here
      const PayToClickFactory = await hre.ethers.getContractFactory(
        "PayToClickContract"
      );
      PayToClickContract = await PayToClickFactory.deploy(
        owner.address,
        VUSDContract.address,
        ControlContract.address,
        [admin1.address, admin2.address, admin3.address, admin4.address],
        TokenManager.address
      );
      await PayToClickContract.deployed();
      console.log(
        "pay to click contract deployed to ",
        ControlContract.address
      );
      //transfer tokens to them
      await VUSDContract.connect(owner).transfer(
        memberOne.address,
        amountToTransfer
      );
      await VUSDContract.connect(owner).transfer(
        memberTwo.address,
        amountToTransfer
      );
      await VUSDContract.connect(owner).transfer(
        memberThree.address,
        amountToTransfer
      );
      await VUSDContract.connect(owner).transfer(
        memberFour.address,
        amountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberFive.address,
        amountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberSix.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberSeven.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberEight.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberNine.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberTen.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberEleven.address,
        bigAmountToTransfer
      );
      await VUSDContract.connect(owner).transfer(
        admin1.address,
        bigAmountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        admin2.address,
        bigAmountToTransfer
      );

      await ControlContract.connect(owner).setAdminDetails(50, 18);
    });

    it("should approve contract", async () => {
      await VUSDContract.connect(memberOne).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberTwo).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberThree).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberFour).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberFive).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberSix).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberSeven).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberEight).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberNine).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberTen).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );

      await VUSDContract.connect(memberEleven).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );

      await VUSDContract.connect(admin1).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );

      await VUSDContract.connect(admin2).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
    });

    it("should be able to buy membership", async () => {
      await PayToClickContract.connect(memberOne).buyMembershipPlan(
        0,
        owner.address
      );

      await PayToClickContract.connect(memberSix).buyMembershipPlan(
        2,
        owner.address
      );

      await PayToClickContract.connect(memberTwo).buyMembershipPlan(
        2,
        memberOne.address
      );

      await PayToClickContract.connect(memberThree).buyMembershipPlan(
        2,
        memberOne.address
      );

      await PayToClickContract.connect(memberFour).buyMembershipPlan(
        2,
        memberOne.address
      );

      await PayToClickContract.connect(memberFive).buyMembershipPlan(
        2,
        memberOne.address
      );
    });

    it("should generate first smb", async () => {
      await PayToClickContract.connect(
        memberOne
      ).generateSubNodeFromBinaryTree();
      const balBefore = await VUSDContract.balanceOf(memberOne.address);

      const nodes = await PayToClickContract.connect(
        memberOne
      ).retrieveSubNode();
      let nodeArray = [];
      for (let i = 0; i < nodes.length; i++) {
        const [memberAddress, index, leftPointer, rightPointer, points] =
          nodes[i];
        const obj = {
          memberAddress: memberAddress,
          index: +index.toString(),
          leftPointer: +leftPointer.toString(),
          rightPointer: +rightPointer.toString(),
          points: +points.toString(),
        };
        nodeArray.push(obj);
      }

      const nodesLevelArray = GetAllNodesAtEachLevel(nodeArray);

      const { smb, nodes: returnNode } = CalculateSMBBonus(
        nodesLevelArray,
        nodeArray
      );

      if (smb > 0 && returnNode.length > 0) {
        console.log("cal smb ", smb);
        console.log("return node ", returnNode)
        await PayToClickContract.connect(memberOne).updateSMBBalance(
          smb,
          returnNode
        );
      }
    });

    it("should make first withdrawal", async () => {
      const balBefore = await VUSDContract.balanceOf(memberOne.address);
      await PayToClickContract.connect(memberOne).withdrawEarnings({
        value: ethers.utils.parseEther("1"),
      });

      const balAfter = await VUSDContract.balanceOf(memberOne.address);
      console.log(
        `before withdrawing ${
          balBefore.toString() / 10 ** 18
        } :: after withdrawing ${balAfter.toString() / 10 ** 18}`
      );
      console.log("member one address ", memberOne.address);
    });

    it("should subscribe and renew", async () => {
      const balBefore = await VUSDContract.balanceOf(memberOne.address);
      await PayToClickContract.connect(memberOne).renewSubScription({
        value: ethers.utils.parseEther("1"),
      });

      const balAfter = await VUSDContract.balanceOf(memberOne.address);
      console.log(
        `before subbing ${balBefore.toString() / 10 ** 18} :: after subbing ${
          balAfter.toString() / 10 ** 18
        }`
      );
    });

    it("should calculate second SMB", async () => {
      await PayToClickContract.connect(
        memberOne
      ).generateSubNodeFromBinaryTree();
      const nodes = await PayToClickContract.connect(
        memberOne
      ).retrieveSubNode();
      let nodeArray = [];
      for (let i = 0; i < nodes.length; i++) {
        const [memberAddress, index, leftPointer, rightPointer, points] =
          nodes[i];
        const obj = {
          memberAddress: memberAddress,
          index: +index.toString(),
          leftPointer: +leftPointer.toString(),
          rightPointer: +rightPointer.toString(),
          points: +points.toString(),
        };
        nodeArray.push(obj);
      }

      const nodesLevelArray = GetAllNodesAtEachLevel(nodeArray);

      const { smb, nodes: returnNode } = CalculateSMBBonus(
        nodesLevelArray,
        nodeArray
      );

      if (smb > 0 && returnNode.length > 0) {
        console.log("cal smb ", smb);
        console.log("return node second", returnNode)
        await PayToClickContract.connect(memberOne).updateSMBBalance(
          smb,
          returnNode
        );
      }
    });

    it("should calculate third SMB", async () => {
      await PayToClickContract.connect(
        memberOne
      ).generateSubNodeFromBinaryTree();
      const nodes = await PayToClickContract.connect(
        memberOne
      ).retrieveSubNode();
      let nodeArray = [];
      for (let i = 0; i < nodes.length; i++) {
        const [memberAddress, index, leftPointer, rightPointer, points] =
          nodes[i];
        const obj = {
          memberAddress: memberAddress,
          index: +index.toString(),
          leftPointer: +leftPointer.toString(),
          rightPointer: +rightPointer.toString(),
          points: +points.toString(),
        };
        nodeArray.push(obj);
      }

      const nodesLevelArray = GetAllNodesAtEachLevel(nodeArray);

      const { smb, nodes: returnNode } = CalculateSMBBonus(
        nodesLevelArray,
        nodeArray
      );

      if (smb > 0 && returnNode.length > 0) {
        console.log("cal smb ", smb);
        console.log("return node 3", returnNode)
        await PayToClickContract.connect(memberOne).updateSMBBalance(
          smb,
          returnNode
        );
      }
    });

    it("last withdrawal should fail", async () => {
      const balBefore = await VUSDContract.balanceOf(memberOne.address);
      await PayToClickContract.connect(memberOne).withdrawEarnings({
        value: ethers.utils.parseEther("1"),
      });

      const balAfter = await VUSDContract.balanceOf(memberOne.address);
      console.log(
        `before withdrawing ${
          balBefore.toString() / 10 ** 18
        } :: after withdrawing ${balAfter.toString() / 10 ** 18}`
      );
    });

  
  });
});
