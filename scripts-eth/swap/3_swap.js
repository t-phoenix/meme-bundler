const hre = require('hardhat');
const fs = require('fs'); 
const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent, ChainId} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN } = require('../../utils/constants');
const { getNativeBalance } = require('../../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const { sqrtPriceX96ToPrice, priceToSqrtPriceX96 } = require('../../utils/helper');
const { AlphaRouter, SwapType } = require('@uniswap/smart-order-router');

async function main(){
    // GOAL: ROUTE A SWAP
    // 1. COMPUTE POOL OBJECT
    // 2. COMPUTE ROUTE WITH POOLS OBJECT AND INPUT OUTPUT
    // 3. GET A QUOTE - OUTPUT AMOUNT
    // 4. APPROVE TOKEN
    // 5. CREATE UNCHECKED TRADE WITHOUT OUTPUT AMOUNT
    // 6. CREATE SWAP OPTION OBJECT
    // 7. GET TRANSACTION DATA AND VALUE
    // 8. CREATE TRXN
    // 9. SEND TRXN

    let accounts=[]
    accounts = await hre.ethers.getSigners();

    console.log(accounts[0].address)
    console.log("Account 0 ETH: ", Number(await getNativeBalance(accounts[0].address))/10**18)


    // INPUT: AMOUNT
    const inputAmount = 10000000; // 0.1 BTC 

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const WBTC_Contract = new hre.ethers.Contract(tokenAddresses.WBTC_Address, ERC20_ABI, hre.ethers.provider)

    console.log("Account 0 USDC: ", Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6)

    // const provider = hre.ethers.provider;
    const provider = new hre.ethers.AlchemyProvider(ChainId.SEPOLIA, "I24pE_bTrYN23fPFw_CyYdxD0LNTq0fS")
    console.log("Provider: ", provider, "Chain Id: ", ChainId.SEPOLIA)

    // DOES NOT WORK WITH ETHERS V6
    const router = new AlphaRouter({
        chainId: ChainId.SEPOLIA,
        provider: provider
    })

    const options = {
        recipient: accounts[0].address,
        slippageTolerance: new Percent(50, 10_000),
        deadline: Math.floor(Date.now()/ 1000+1800),
        type: SwapType.SWAP_ROUTER_02
    }


    const route = await router.route(
        CurrencyAmount.fromRawAmount(
            WBTC_TOKEN,
            Number(inputAmount)
        ),
        USDC_TOKEN,
        TradeType.EXACT_INPUT,
        options
    )
    console.log("Route: ", route);

    const WBTCApproval = await WBTC_Contract.approve(
        uniswapAddresses.swapRouter2Address,
        Number(inputAmount)*2
    )

      // BEFORE BALANCE
      console.log("User Balance Before Trade")
      console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6, 
      ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)
  
      // WRITING TRANSACTION TO BLOCKCHAIN
    const txRes = accounts[0].sendTransaction({
        data: route.methodParameters.calldata,
        to: uniswapAddresses.swapRouter2Address,
        value: route.methodParameters.value,
        from: accounts[0].address,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    })

    console.log("Transaction Result: ", txRes);

       // AFTER BALANCE
       console.log("User Balance After Trade")
       console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6,
       ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)
 

    
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})