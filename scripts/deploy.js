const hre = require("hardhat");

async function main() {
  //deploy the control contract

  console.log("prepping token manager deployment");
  const TokenManagerFactory = await hre.ethers.getContractFactory(
    "TokenManagerContract"
  );

  const TokenManager = await TokenManagerFactory.deploy(
    "0x18EaA202B70d85e828E02f7D5F38B65f9c16d987" //token address
  );

  await TokenManager.deployed();
  console.log("Token manager deployed to", TokenManager.address);

  console.log("prepping the deployment");
  const ControlFactory = await hre.ethers.getContractFactory("ControlContract");

  const ControlContract = await ControlFactory.deploy(
    "0xDae5065067dface64C9f715b6d664b082d6E5bc9", //owner address
    "0x18EaA202B70d85e828E02f7D5F38B65f9c16d987", //vusd token address
    [
      "0x3b3F2ff766081a4E81ef0EE63A7aC64E4e25eE10",
      "0x2427B7cD6cC4fCCECb095e3f1892Cee31Ef25906", //admin wallets
      "0xC6157E78D8107a22ED795998d371600084C98A78",
      "0xd4aF9Eebed85D67dEaB40087A041D1d724BF60Ce",
    ],
    TokenManager.address
  );
  await ControlContract.deployed();

  console.log("control contract deployed to ", ControlContract.address);

  //deploy the PayToClickContract contract
  console.log("prepping deployment of the payto click contract");
  const PayToClickFactory = await hre.ethers.getContractFactory(
    "PayToClickContract"
  );

  console.log("deploying the pay to click contract");
  const PayToClickContract = await PayToClickFactory.deploy(
    "0xDae5065067dface64C9f715b6d664b082d6E5bc9", //owner address
    "0x18EaA202B70d85e828E02f7D5F38B65f9c16d987", //vusd contract address,
    ControlContract.address,
    [
      "0x3b3F2ff766081a4E81ef0EE63A7aC64E4e25eE10",
      "0x2427B7cD6cC4fCCECb095e3f1892Cee31Ef25906", //admin wallets
      "0xC6157E78D8107a22ED795998d371600084C98A78",
      "0xd4aF9Eebed85D67dEaB40087A041D1d724BF60Ce",
    ], //address of the four admin wallet
    TokenManager.address
  );

  await PayToClickContract.deployed();

  console.log("pay to click contract deployed to ", PayToClickContract.address);
}

main().catch((error) => {
  console.error("There was an error", error);
  process.exitCode = 1;
});





//Token manager deployed to 0x3c681A22c37193e2E793178b0339ad4599234b90

//control contract deployed to  0xA5169fd9ee98220EbCcAc4DEe61c11736b76C0e3


//pay to click contract deployed to  0x88d9BD06216E238323e6D96646f9b95752929976