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

const { GetAllNodesAtEachLevel,  CalculateSMBBonus } = require("./utilities");

// function getSigners(amount = 40) {
//   // getting seed phrase and derivation path from the hardhat config
//   const { mnemonic, path } = hre.network.config.accounts
//   return [...Array(amount).keys()].map((i) =>
//     hre.ethers.Wallet.fromMnemonic(mnemonic, `${path}/${i}`)
//       .connect(hre.ethers.provider),
//   )
// }


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
        VUSDContract.address,
        [admin1.address, admin2.address, admin3.address, admin4.address]
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

      await VUSDContract.connect(owner).transfer(
        memberFive.address,
        amountToTransfer
      );

      await VUSDContract.connect(owner).transfer(
        memberSix.address,
        bigAmountToTransfer
      );
      await ControlContract.connect(owner).setAdminDetails(50, 18);
    });

  
    it("should be able to buy membership", async () => {
     
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
      await VUSDContract.connect(memberFive).approve(
        PayToClickContract.address,
        ethers.utils.parseEther("10000")
      );
      await VUSDContract.connect(memberSix).approve(
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
        0,
        memberOne.address
      );

      await PayToClickContract.connect(memberFour).buyMembershipPlan(
        0,
        memberOne.address
      );


      // await PayToClickContract.connect(memberFour).buyMembershipPlan(
      //   1,
      //   owner.address
      // );
      // await PayToClickContract.connect(memberFive).buyMembershipPlan(
      //   1,
      //   memberOne.address
      // );
      // await PayToClickContract.connect(memberSix).buyMembershipPlan(
      //   2,
      //   memberOne.address
      // );

      const node = await PayToClickContract.connect(owner).getNodeByIndex(0);
     

      const balAfter = await VUSDContract.balanceOf(memberOne.address);

      console.log('USER balance before buying plan: ', (balBefore.toString())/10 ** 18);
      console.log(`USER balance after buying plan :`, balAfter.toString()/10 ** 18);

      expect(balBefore.toString() - balAfter.toString()).to.be.greaterThan(0);
    });

    // it("insert the node in the correct location", async() => {
    //     const nodeBefore = await PayToClickContract.connect(memberOne).getNodeByIndex(1);
    //     await PayToClickContract.connect(memberOne).insertSpillOverMember(1, 50,memberThree.address,{value: ethers.utils.parseEther("1")});
    //     await PayToClickContract.connect(memberOne).insertSpillOverMember(1, 50,memberFour.address,{value: ethers.utils.parseEther("1")});
    //     const nodeAfter = await PayToClickContract.connect(memberOne).getNodeByIndex(1);

    //     const [, , leftPointer, rightPointer] = nodeBefore;

    //     const [,, leftPointer2, rightPointer2] = nodeAfter;

    //     expect(+leftPointer.toString()).to.be.equal(0);
    //     expect(+rightPointer.toString()).to.be.equal(0);
    //     expect(+leftPointer2.toString()).to.be.equal(3);
    //     expect(+rightPointer2.toString()).to.be.equal(4);

    //   })

      it("should calculate the SMB Bonus", async() => {

        await PayToClickContract.connect(owner).generateSubNodeFromBinaryTree();
        const nodes = await PayToClickContract.connect(owner).retrieveSubNode();
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
        
        //the nodeLevelArray is an array of the nodes in levels and the nodeArray is the root array
        const { smb, nodes: returnNode } = CalculateSMBBonus(
          nodesLevelArray,
          nodeArray
        );

        const [,,,,pointBefore] = await PayToClickContract.getNodeByIndex(1);


        if ( smb > 0 && returnNode.length > 0 ){
            await PayToClickContract.connect(memberOne).updateSMBBalance(smb, returnNode);
           
        }

        const [,,,,pointAfter] = await PayToClickContract.getNodeByIndex(1);

        console.log("points before|after", pointBefore.toString(), pointAfter.toString());

        expect(+pointBefore.toString()).to.be.greaterThan(+pointAfter.toString())
        
    
      });

      it("should be able to click adds", async() => {

        
          await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          //await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
          // //increase time here:
          // const latestTime = await time.latest();
          // await time.increaseTo(latestTime + (1 * 24 * 60 * 60));
          // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
      });

      it("should be able to renew the subscription", async() => {
        //await PayToClickContract.connect(memberOne).renewSubScription({value: ethers.utils.parseEther("1")});
        // await expect(PayToClickContract.connect(memberOne).renewSubScription({value: ethers.utils.parseEther("1")})).to.be.revertedWith("o");
      });

      it("should be able to withdraw earnings", async()=> {
        const balBefore = await VUSDContract.balanceOf(memberOne.address);
        const contractbalBefore = await VUSDContract.balanceOf(PayToClickContract.address);
        console.log("contract balance before : ", +(contractbalBefore.toString())/10**18)
         await PayToClickContract.connect(memberOne).withdrawEarnings({value: ethers.utils.parseEther("1")});
         const balAfter = await VUSDContract.balanceOf(memberOne.address);
         const contractbalAfter = await VUSDContract.balanceOf(PayToClickContract.address);


         console.log("user bal before: user balance after : ", +(balBefore.toString())/10 ** 18, +(balAfter.toString())/10 ** 18)
         console.log("contract balance after : ", +(contractbalAfter.toString())/10**18)
         expect(+balAfter.toString()/10**18).to.be.greaterThan(+balBefore.toString()/10**18);
         expect(+contractbalBefore.toString()/10**18).to.be.greaterThan(+contractbalAfter.toString()/10**18);
        });
      it("should be able to set advert cost", async()=> {
          // await ControlContract.connect(owner).setAdminDetails(10, 0);
      })
      it("should be able to pay for advert", async()=> {
          // await VUSDContract.connect(memberOne).approve(ControlContract.address, ethers.utils.parseEther("10000"));
          // await ControlContract.connect(memberOne).buyAdvertiserPlan("This is a scammer paradise", ["https://google.com"]);
      })
  });
});
