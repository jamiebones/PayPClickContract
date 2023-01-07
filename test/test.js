const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");

const transactionTax = 1;
const amountToTransfer = ethers.utils.parseEther("10000");

describe("PayToClickContract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function setUpContractUtils() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_ETH = 1_000_000_000_000_000_000;

    const deposit = ONE_ETH * 0.001;
    const amountToDeposit = ethers.utils.parseEther("0.001");
    const futureTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [
      owner,
      memberOne,
      memberTwo,
      memberThree,
      memberFour,
      memberFive,
      memberSix,
      admin1,
      admin2,
      admin3,
      admin4,
    ] = await ethers.getSigners();

    //deploy the test token contract
    const VUSDContractFactory = await hre.ethers.getContractFactory("VUSD");
    const VUSDContract = await VUSDContractFactory.deploy();
    await VUSDContract.deployed();

    console.log("vusd token deployed to ", VUSDContract.address);

    //contract Factory
    const ControlFactory = await hre.ethers.getContractFactory(
      "ControlContract"
    );

    const ControlContract = await ControlFactory.deploy(
      owner.address,
      VUSDContract.address
    );
    await ControlContract.deployed();

    console.log("control contract deployed to ", ControlContract.address);

    //deploy the contracts here
    const PayToClickFactory = await hre.ethers.getContractFactory(
      "PayToClickContract"
    );
    const PayToClickContract = await PayToClickFactory.deploy(
      owner.address,
      VUSDContract.address,
      ControlContract.address,
      [admin1.address, admin2.address, admin3.address, admin4.address]
    );
    await PayToClickContract.deployed();

    console.log(
      "pay to click contract deployed to ",
      PayToClickContract.address
    );

    return {
      PayToClickContract,
      VUSDContract,
      ControlContract,
      owner,
      memberOne,
      memberTwo,
      memberThree,
      memberFour,
      memberFive,
      memberSix,
      admin1,
      admin2,
      admin3,
      admin4,
    };
  }





  describe("Pay to click test suite", async function () {
    let owner,
      memberOne,
      memberTwo,
      memberThree,
      memberFour,
      memberFive,
      memberSix,
      admin1,
      admin2,
      admin3,
      admin4,
      VUSDContract,
      ControlContract,
      PayToClickContract;
    before(async () => {
      [
        owner,
        memberOne,
        memberTwo,
        memberThree,
        memberFour,
        memberFive,
        memberSix,
        admin1,
        admin2,
        admin3,
        admin4,
      ] = await ethers.getSigners();
      const VUSDContractFactory = await hre.ethers.getContractFactory("VUSD");
      VUSDContract = await VUSDContractFactory.deploy();
      await VUSDContract.deployed();
      console.log("VUSD contract deployed to ", VUSDContract.address);
      //contract Factory
      const ControlFactory = await hre.ethers.getContractFactory(
        "ControlContract"
      );
      ControlContract = await ControlFactory.deploy(
        owner.address,
        VUSDContract.address
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
        [admin1.address, admin2.address, admin3.address, admin4.address]
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
    });

  
    it("should be able to buy membership", async () => {
      await VUSDContract.connect(owner).transfer(
        memberOne.address,
        amountToTransfer
      );
      const balBefore = await VUSDContract.balanceOf(memberOne.address);
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
      await PayToClickContract.connect(memberOne).buyMembershipPlan(
        0,
        owner.address
      );

      await PayToClickContract.connect(memberTwo).buyMembershipPlan(
        0,
        owner.address
      );

      await PayToClickContract.connect(memberThree).buyMembershipPlan(
        2,
        owner.address
      );

      await PayToClickContract.connect(memberFour).buyMembershipPlan(
        1,
        owner.address
      );

      const node = await PayToClickContract.connect(owner).getNodeByIndex(0);
      //console.log("node value", node)



      const balAfter = await VUSDContract.balanceOf(memberOne.address);

      console.log(balAfter.toString());
      console.log(balBefore.toString());

      expect(balBefore.toString() - balAfter.toString()).to.be.greaterThan(0);
    });

    it("insert the node in the correct location", async() => {
        const nodeBefore = await PayToClickContract.connect(owner).getNodeByIndex(1);
        await PayToClickContract.connect(owner).insertSpillOverMember(1, 50,memberThree.address,{value: ethers.utils.parseEther("1")})
        await PayToClickContract.connect(owner).insertSpillOverMember(1, 50,memberFour.address,{value: ethers.utils.parseEther("1")})
        const nodeAfter = await PayToClickContract.connect(owner).getNodeByIndex(1);

        const [, , leftPointer, rightPointer] = nodeBefore;

        const [,, leftPointer2, rightPointer2] = nodeAfter;

        expect(+leftPointer.toString()).to.be.equal(0);
        expect(+rightPointer.toString()).to.be.equal(0);
        expect(+leftPointer2.toString()).to.be.equal(3);
        expect(+rightPointer2.toString()).to.be.equal(4);

      })
  });
});
