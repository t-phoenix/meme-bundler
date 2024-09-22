// SETUP CONSTANTS BASED ON TESTING CHAIN
// SETUP FOR ETH MAINNET FORK
// 

const {Token} = require('@uniswap/sdk-core');


// ETH MAINNET
// const uniswapAddresses = { 
//     uniswapV3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
//     quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
//     quoterV2Address: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
//     swapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
//     swapRouter2Address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
//     nonFungiblePositionManagerAddress: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
// }

// SEPOLIA
const uniswapAddresses = {
    uniswapV3FactoryAddress: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    quoterV2Address: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    swapRouter2Address: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    nonFungiblePositionManagerAddress: '0x1238536071E1c677A632429e3655c799b22cDA52',
    freyaUsdcPoolAddress: "0x409270a27d6fC8DDb0C43E680BeA7586736D89F1",
    freyaWETHPoolAddress: "0x06a20CBabD6e5D84c6A8Aa4C59A8E0Aa22842fD7"
    // newfreyaUsdcPoolAddress: "0xa1D00f8bE9E4cA67c2Bc5976Ed1B75b0c6D27872",
    // wbtcUsdcPoolAddress: "0x3faC21f2d59d890BA23b82028aB2B3dA8ae5A116"
}
// ETH MAINNET
// const tokenAddresses = {
//     USDT_Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
//     USDC_Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     WETH_Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
// }

// SEPOLIA
const tokenAddresses = {
    // USDT_Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC_Address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    WETH_Address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    WBTC_Address: "0x29f2D40B0605204364af54EC677bD022dA425d03",
    FREYA_Address: "0x1C13e788f79a4976e35Bb76025b0aAb92eA8b769",
    //FREYA_Address: "0xa1D00f8bE9E4cA67c2Bc5976Ed1B75b0c6D27872",
}


// ETH MAINNET
// const chainId = 1
const chainId = 11155111	


 const WETH_TOKEN = new Token(
    chainId,
    tokenAddresses.WETH_Address,
    18,
    'WETH',
    'Wrapped Ether'
)

 const USDC_TOKEN = new Token(
    chainId,
    tokenAddresses.USDC_Address,
    6,
    'USDC',
    'USD Coin'
)

const WBTC_TOKEN = new Token(
    chainId,
    tokenAddresses.WBTC_Address,
    8,
    'WBTC',
    'WBTC'
)

const FREYA_TOKEN = new Token(
    chainId, 
    tokenAddresses.FREYA_Address,
    18,
    'FREYA',
    'Freya Meme Coin'
)


  
  // Transactions
  
const MAX_FEE_PER_GAS = 100000000000
const MAX_PRIORITY_FEE_PER_GAS = 100000000000

  

module.exports = {
    uniswapAddresses,
    tokenAddresses,
    WETH_TOKEN,
    USDC_TOKEN,
    WBTC_TOKEN,
    FREYA_TOKEN,
    MAX_FEE_PER_GAS,
    MAX_PRIORITY_FEE_PER_GAS,
}
 