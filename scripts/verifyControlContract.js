const hre = require("hardhat");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
async function main() {
  // Verify the contract after deploying
  await hre.run("verify:verify", {
    address: "0xadAD61565dE5c9E78dE31C44b5af0ada8009ae2A",
    constructorArguments: [
      "0xDae5065067dface64C9f715b6d664b082d6E5bc9", //owner address
      "0x18EaA202B70d85e828E02f7D5F38B65f9c16d987", //vusd token address
      [
        "0x3b3F2ff766081a4E81ef0EE63A7aC64E4e25eE10",
        "0x2427B7cD6cC4fCCECb095e3f1892Cee31Ef25906", //admin wallets
        "0xC6157E78D8107a22ED795998d371600084C98A78",
        "0xd4aF9Eebed85D67dEaB40087A041D1d724BF60Ce",
      ],
      "0x190FBF523872c4aA1a16A157591F1c4778226862"
    ],
  });
}
// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
