const hre = require('hardhat');
const fs = require('fs'); 
// const UniswapV3RouterABI = require('../utils/UniswapV3RouterABI.json')
// const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
// const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')

const {FeeAmount, Route, Pool, SwapQuoter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN } = require('../../utils/constants');
const { getNativeBalance } = require('../../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const UniswapV3Router2ABI = require('../../utils/UniswapV3Router2ABI.json');
const {  sqrtPriceX96ToPrice, priceToSqrtPriceX96 } = require('../../utils/helper');

async function main(){
    // GOAL: Execute Swap
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
    const inputAmount = 10000000;

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const WBTC_Contract = new hre.ethers.Contract(tokenAddresses.WBTC_Address, ERC20_ABI, hre.ethers.provider);



    console.log("Account 0 USDC: ", Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6)

    // Creating Pool Address (USDC/WETH)
    // INPUT: FEE
    const wbtcusdcPoolAddress = computePoolAddress({
        factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
        tokenA: WBTC_TOKEN,
        tokenB: USDC_TOKEN,
        fee: FeeAmount.MEDIUM
    })
    console.log("Computed WBTC/USDC Pool Address: ", wbtcusdcPoolAddress)


    
    // Create Pool Instance
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, wbtcusdcPoolAddress);

    // Retrieve Pool Data
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])
    console.log("FREYA POOL INFO: token0:", token0, " token1: ", token1, "Fee: ", fee, " liquidity: ", liquidity);
    console.log("Slot0 data: ", slot0);

    console.log("SqrtPriceX96: ", String(slot0[0]), " tick: ", String(slot0[1]) )
    const sqrtPrice = sqrtPriceX96ToPrice(slot0[0])
    console.log("Price From Sqrt Again:" , sqrtPrice)
    // Construct Pool
    // @params: token in, token out, poolfee, sqrtPriceX96, liquidity, tick 
    // Check the types of params

    const wBTCUSDCPool = new Pool(
        WBTC_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )
    console.log("WBTC USDC Pool:", wBTCUSDCPool)

    // Contruct Route Object
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [wBTCUSDCPool], 
        WBTC_TOKEN, 
        USDC_TOKEN
    )
    

    // Getting a Quote for Swap
    // Using SwapQuoter from v3-sdk
    const {calldata} = await SwapQuoter.quoteCallParameters(
        swapRoute,
        CurrencyAmount.fromRawAmount(
            WBTC_TOKEN,
            Number(inputAmount),
        ),
        TradeType.EXACT_INPUT,
        {
            useQuoterV2: true,
        }
    )
    console.log("Quote CallData: ", calldata)
    const quoteCallReturnData = await hre.ethers.provider.call({
        to: uniswapAddresses.quoterV2Address,
        data: calldata,
    })
    const decodedData = hre.ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData)
    const outputAmount = Number(decodedData[0])
    console.log("Quote Output for", Number(inputAmount)/10**8, " is", Number(decodedData[0])/10**6)
    const sqrtPriceCalculated = priceToSqrtPriceX96(Number(decodedData[0])/10**6)
    console.log("Price to Sqrt Price:", sqrtPriceCalculated)
    
    // Approve Tokens
    // CHECK APPROVAL
    await WBTC_Contract.connect(accounts[0]).approve(uniswapAddresses.swapRouter2Address, Number(inputAmount)*2)
    

    console.log("User Balance Before Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6, 
    ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)

    // WRITING TRANSACTION TO BLOCKCHAIN
    // ------------------------------------------------ //
    // WORKING CODE : EXECUTE SWAP
    // ------------------------------------------------ //
    const SwapRouterContract = await hre.ethers.getContractAt(UniswapV3Router2ABI, uniswapAddresses.swapRouter2Address);

    const params = {
        tokenIn: tokenAddresses.WBTC_Address,
        tokenOut: tokenAddresses.USDC_Address,
        fee: 3000, // 0.3% fee
        recipient: accounts[0].address,
        amountIn: Number(inputAmount), // 1 WETH
        amountOutMinimum: 0, // Minimum 1800 DAI
        sqrtPriceLimitX96: 0 // No price limit
      };
    // sqrtPriceLimitX96: 0 means there's no limit
    // By setting sqrtPriceLimitX96, you can ensure that the swap will not execute if the price move beyond this limit.


    const swap = await SwapRouterContract.exactInputSingle(params)

    console.log("User Balance After Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6,
    ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})