const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const hre = require("hardhat");
  const { ethers } = require("hardhat");
  
  const transactionTax = 1;
  const amountToTransfer = ethers.utils.parseEther("100");
  
  
  describe("PayToClickContract", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
  
   

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
          [owner.address, owner.address, owner.address, owner.address]
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
          [owner.address, owner.address, owner.address, owner.address]
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
     
      });
  
    
      it("should be able to buy membership", async () => {
        
        const balBefore = await VUSDContract.balanceOf(memberOne.address);
        await VUSDContract.connect(memberOne).approve(
          PayToClickContract.address,
          ethers.utils.parseEther("10000")
        );
        
  
        await PayToClickContract.connect(memberOne).buyMembershipPlan(
          0,
          owner.address
        );

  
        // await PayToClickContract.connect(memberThree).buyMembershipPlan(
        //   2,
        //   owner.address
        // );
  
        // await PayToClickContract.connect(memberFour).buyMembershipPlan(
        //   1,
        //   owner.address
        // );
  
        //const node = await PayToClickContract.connect(owner).getNodeByIndex(0);
        //console.log("node value", node)
  
        const balAfter = await VUSDContract.balanceOf(memberOne.address);
  
        console.log('USER balance before buying plan: ', (+balBefore.toString())/10 ** 18);
        console.log(`USER balance after buying plan :`, (+balAfter.toString())/10 ** 18);
  
        expect(balBefore.toString() - balAfter.toString()).to.be.greaterThan(0);
      });
  
      // it("insert the node in the correct location", async() => {
      //     //const nodeBefore = await PayToClickContract.connect(owner).getNodeByIndex(1);
      //     //await PayToClickContract.connect(owner).insertSpillOverMember(1, 50,memberThree.address,{value: ethers.utils.parseEther("1")})
      //     //await PayToClickContract.connect(owner).insertSpillOverMember(1, 50,memberFour.address,{value: ethers.utils.parseEther("1")})
      //     // const nodeAfter = await PayToClickContract.connect(owner).getNodeByIndex(1);
  
      //     // const [, , leftPointer, rightPointer] = nodeBefore;
  
      //     // const [,, leftPointer2, rightPointer2] = nodeAfter;
  
      //     // expect(+leftPointer.toString()).to.be.equal(0);
      //     // expect(+rightPointer.toString()).to.be.equal(0);
      //     // expect(+leftPointer2.toString()).to.be.equal(3);
      //     // expect(+rightPointer2.toString()).to.be.equal(4);
  
      //   })
  
        // it("should calculate the SMB Bonus", async() => {
        //      await PayToClickContract.connect(owner).calculateSMBBonus();
        //      const smbBonus = await PayToClickContract.connect(owner).retrieveSMBBonusEarned();
        //      const smbBonus2 = await PayToClickContract.connect(memberOne).retrieveSMBBonusEarned();
        //     //expect(+smbBonus.toString()).to.be.equal(2);
        //     //expect(+smbBonus2.toString()).to.be.equal(0);
        // });
  
        it("should be able to click adds", async() => {
  
            await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseUnits("1", 9)});
            await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseUnits("1", 9)});
            await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseUnits("1", 9)});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            // await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseEther("1")});
            //increase time here:
            //const latestTime = await time.latest();
            //await time.increaseTo(latestTime + (1 * 24 * 60 * 60));
            await PayToClickContract.connect(memberOne).clickToEarn({value: ethers.utils.parseUnits("1", 9)});
        });
  
        // it("should be able to renew the subscription", async() => {
        //   //await PayToClickContract.connect(memberOne).renewSubScription({value: ethers.utils.parseEther("1")});
        //   await expect(PayToClickContract.connect(memberOne).renewSubScription({value: ethers.utils.parseEther("1")})).to.be.revertedWith("o");
        // });
  
        it("should be able to withdraw earnings", async()=> {
          const balBefore = await VUSDContract.balanceOf(memberOne.address);
          const contractBalBefore = await VUSDContract.balanceOf(PayToClickContract.address);
           await PayToClickContract.connect(memberOne).withdrawEarnings({value: ethers.utils.parseUnits("1", 9)});
           const balAfter = await VUSDContract.balanceOf(memberOne.address);
           const contractBalAfter = await VUSDContract.balanceOf(PayToClickContract.address);
           console.log("contract bal before withdrawing : contract balance after withdrawing : ", +(contractBalBefore.toString())/10 ** 18, +(contractBalAfter.toString())/10 ** 18)
           console.log("member bal before withdrawing : member balance after withdrawing : ", +(balBefore.toString())/10 ** 18, +(balAfter.toString())/10 ** 18)
           expect(+balAfter.toString()).to.be.greaterThan(+balBefore.toString());
          });
        it("should be able to set advert cost", async()=> {
            await ControlContract.connect(owner).setAdminDetails(10, 0);
        })
        it("should be able to pay for advert", async()=> {
            await VUSDContract.connect(memberOne).approve(ControlContract.address, ethers.utils.parseEther("10000"));
            await ControlContract.connect(memberOne).buyAdvertiserPlan("This is a scammer paradise", ["https://google.com"]);
        })
    });
  });
  