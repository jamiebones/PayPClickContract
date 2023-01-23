require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
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
      {
        version: "0.8.15",
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
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
      url: process.env.VENTION_URL_MAINNET,
      accounts: [
        `0x${process.env.PRIVATE_KEY}`,
        `0x${process.env.ACCOUNT_TWO_KEY}`,
        `0x${process.env.ACCOUNT_ONE_KEY}`,
        `0x${process.env.ACCOUNT_THREE_KEY}`,
      ],
      chainId: 77612,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    polygonMainnet: {
      url: "https://rpc-mainnet.matic.quiknode.pro",
      chainId: 137,
      gasPrice: 35000000000,
      accounts: [process.env.PRIVATE_KEY],
      
    },
    polygonMumbai: {
      url: ` https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLY_SCAN}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: process.env.POLY_SCAN,
  },
  mocha: {
    timeout: 400000,
  },
  contractSizer: {
    runOnCompile: true,
  },
};
