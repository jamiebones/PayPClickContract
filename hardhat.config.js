require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.2",
      },
      {
        version: "0.8.1",
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    ventionTestnet: {
      url: process.env.VENTION_URL_TESTNET,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 741,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    ventionMainnet: {
      url:  process.env.VENTION_URL_MAINNET,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 77612,
      gas: 2100000,
      gasPrice: 8000000000,
    }
    
  },
  etherscan: {
    apiKey: process.env.POLY_SCAN,
  },
};