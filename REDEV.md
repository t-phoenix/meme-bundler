# Redevlopment of Bundling Script

Features
1. Create Number of Wallets
2. Fund wallet with input type token and amount
3. Create ERC20 token and mint to Wallets
4. Check Balances
5. Create and Init Pool
6. Mint Liquidity Position/ Redeem Liquidity Position/ Check Pool Position
7. Quote Tokens/ Swap Tokens based on input token and amount
8. Generate Simple Volume 

(ethers.constants.AddressZero) for NATIVE ETH pool


## Commands
yarn hardhat run --network hardhat scripts/1_create_wallets.js 


## Fee
export declare enum FeeAmount {
    LOWEST = 100, // 0.01%
    LOW = 500, // 0.05%
    MEDIUM = 3000, // 0.3%
    HIGH = 10000 // 1%
}

Maximum Tick: 887272

## NOTES
- Must add Pool and Token Address in `utils/constants.js` manually

## MINT LIQUIDITY
liquidity - the amount of liquidity the pool can use for trades at the current price.
slot0 returns 
- sqrtPriceX96
- tick
- observationIndex
- observationCardinality
- observationCardinalityNext
- feeProtocol
- unlocked




## INFO NEEDED
1. Project Name, Symbol, Supply
2. How many wallets to distriute $FREECZ token?
3. Do you want to distribute $FREECZ randomly to all wallets when deploying ERC20 token ? (It looks like whitelisting)
4. Uniswap v3 token pair to be created  - FREECZ/USDC  
5. Select Pool Fee 0.01%, 0.05%, 0.3% (common), 1%
6. Initializing Pool Ratio Price? (e.g. 66k FREECZ / 1 USDC ===> 1 FREECZ = 0.0005 USDC)
7. Add Liquidity by multiple wallets (we created to store $FREECZ):
7.1: Full curve Liquidity (Uniswap v2)
7.2: Price Range based Liquidity (e.g. Range - 0.0005 to 0.0010) will cost us no USDC, and price of FREECZ never go below 0.0005.
7.3 Custom Range (Refer uni v3 pool add liquidity any pair)
8. Volume Bot: Simple Volume bot buy/ sell
8.1: Select bot frequency: 1 minute/ 10 minute/ 1hr
