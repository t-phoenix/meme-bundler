// {
//     "uniswapV3Router": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
//     "uniswapV3Router2": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
//     "uniswapV3Factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
//     "USDT_TOKEN": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
//     "USDC_TOKEN": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     "WETH_TOKEN": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
// }

const {Token} = require('@uniswap/sdk-core');

const uniswapAddresses = { 
    uniswapV3RouterAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    uniswapV3Router2Address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    uniswapV3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    quoterV2Address: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    swapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    swapRouter2Address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
}

const tokenAddresses = {
    USDT_Address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC_Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH_Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
}


 const WETH_TOKEN = new Token(
    1,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
)

 const USDC_TOKEN = new Token(
    1,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    6,
    'USDC',
    'USD Coin'
)

const USDT_TOKEN = new Token(
    1,
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    6,
    'USDT',
    'Tether USD'
)

const ERC20_ABI = [
    // Read-Only Functions
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  
    // Authenticated Functions
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address _spender, uint256 _value) returns (bool)',
  
    // Events
    'event Transfer(address indexed from, address indexed to, uint amount)',
  ]

const WETH_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  
    // Authenticated Functions
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address _spender, uint256 _value) returns (bool)',
  
    // Events
    'event Transfer(address indexed from, address indexed to, uint amount)',
    // Wrap ETH
    'function deposit() payable',
  
    // Unwrap ETH
    'function withdraw(uint wad) public',
  ]
  
  // Transactions
  
const MAX_FEE_PER_GAS = 100000000000
const MAX_PRIORITY_FEE_PER_GAS = 100000000000

  

module.exports = {
    uniswapAddresses,
    tokenAddresses,
    WETH_TOKEN,
    USDC_TOKEN,
    ERC20_ABI,
    WETH_ABI,
    MAX_FEE_PER_GAS,
    MAX_PRIORITY_FEE_PER_GAS,
}
 