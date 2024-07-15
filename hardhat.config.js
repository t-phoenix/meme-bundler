require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      //forking ETH MAINNET 
      forking: {
        enabled: true,
        url: "https://eth-mainnet.g.alchemy.com/v2/I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS",
        chainId: 1,
        accounts: [process.env.PRIVATE_KEY]
      },
    },
    mainnet: {
      url: "https://eth-mainnet.g.alchemy.com/v2/I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS",
      accounts: [process.env.PRIVATE_KEY]
    },
    goerli:{
      url: 'https://ethereum-goerli.publicnode.com',
      // accounts: [process.env.PRIVATE_KEY1, process.env.PRIVATE_KEY7, process.env.PRIVATE_KEY8 ]
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
