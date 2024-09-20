require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  etherscan: {
    // apiKey: {
    //   sepolia: process.env.SEPOLIA_API_KEY
    // },
    customChains:[
      {
        network: "sepolia",
        chainId: 111555111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://etherscan.io/"
        }
      }
    ]
  },
  solidity: "0.8.24",
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      //forking ETH MAINNET 
      forking: {
        enabled: true,
        url: "https://eth-sepolia.g.alchemy.com/v2/I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS",
        blockNumber: 6710206        
      },
      accounts: [{privateKey: process.env.PRIVATE_KEY, balance: "10000000000000000000"}]
    },
    mainnet: {
      url: "https://eth-mainnet.g.alchemy.com/v2/I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS",
      accounts: [process.env.PRIVATE_KEY]
    },
    goerli:{
      url: 'https://ethereum-goerli.publicnode.com',
      // accounts: [process.env.PRIVATE_KEY1, process.env.PRIVATE_KEY7, process.env.PRIVATE_KEY8 ]
    },
    sepolia:{
      url: 'https://eth-sepolia.g.alchemy.com/v2/I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS',
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY]
      // accounts: [process.env.PRIVATE_KEY, process.env.WALLET_1_KEY, process.env.WALLET_2_KEY]
    },
    polygon: {
      url: 'https://polygon-rpc.com',
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      // accounts: [process.env.PRIVATE_KEY1, process.env.PRIVATE_KEY7, process.env.PRIVATE_KEY8 ]

    }
  },

};
