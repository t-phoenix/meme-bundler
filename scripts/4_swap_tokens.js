const hre = require('hardhat');
const fs = require('fs'); 
// const UniswapV3RouterABI = require('../utils/UniswapV3RouterABI.json')
// const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
// const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')

const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, WETH_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN, FREYA_TOKEN } = require('../utils/constants');
const { getNativeBalance } = require('../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI, WETH_ABI } = require('../utils/ABI');
const UniswapV3Router2ABI = require('../utils/UniswapV3Router2ABI.json');
const { getPriceFromSqrt, sqrtPriceX96ToPrice, priceToSqrtPriceX96, getAccounts, printBalances } = require('../utils/helper');
const { SwapType, SwapOptionsSwapRouter02 } = require('@uniswap/smart-order-router');

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


    
    const accounts = await getAccounts();
    for (let index = 0; index < accounts.length; index++) {
        await printBalances(accounts[index].address)
    }
    


    // INPUT: AMOUNT  
    const inputAmount = hre.ethers.parseUnits('10', 6); // USDC
    console.log("INPUT AMOUNT(USDC) : ", inputAmount)

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const FREYA_Contract = new hre.ethers.Contract(tokenAddresses.FREYA_Address, ERC20_ABI, hre.ethers.provider)
    //const WBTC_Contract = new hre.ethers.Contract(tokenAddresses.WBTC_Address, ERC20_ABI, hre.ethers.provider);



    // console.log("Account 0 USDC: ", Number(await FREYA_Contract.balanceOf(accounts[0].address))/10**18)

    // Creating Pool Address (USDC/WETH)
    // INPUT: FEE
    // const wethusdcPoolAddress = computePoolAddress({
    //     factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
    //     tokenA: USDC_TOKEN,
    //     tokenB: WETH_TOKEN,
    //     fee: FeeAmount.MEDIUM
    // })
    // console.log("Computed WETH/USDC Pool Address: ", wethusdcPoolAddress)


    // const wbtcusdcPoolAddress = computePoolAddress({
    //     factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
    //     tokenA: WBTC_TOKEN,
    //     tokenB: USDC_TOKEN,
    //     fee: FeeAmount.MEDIUM
    // })
    // console.log("Computed WBTC/USDC Pool Address: ", wbtcusdcPoolAddress)


    
    // Create Pool Instance
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaUsdcPoolAddress);

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

    // Construct Pool
    // @params: token in, token out, poolfee, sqrtPriceX96, liquidity, tick 
    // Check the types of params
    // const USDCwETHPool = new Pool(
    //     USDC_TOKEN,
    //     WETH_TOKEN,
    //     FeeAmount.MEDIUM,
    //     String(slot0[0]),
    //     String(liquidity),
    //     Number(slot0[1])
    // )

    // const wBTCwETHPool = new Pool(
    //     WBTC_TOKEN,
    //     WETH_TOKEN,
    //     FeeAmount.MEDIUM,
    //     String(slot0[0]),
    //     String(liquidity),
    //     Number(slot0[1])

    // )

    const FREYAUSDCPool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )
    // NOTE: Use Number for tick value
    console.log("FREYA USDC Pool:", FREYAUSDCPool)

    // Contruct Route Object
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [FREYAUSDCPool],  
        USDC_TOKEN,
        FREYA_TOKEN
    )
    

    // Getting a Quote for Swap
    // Using SwapQuoter from v3-sdk
    const {calldata} = await SwapQuoter.quoteCallParameters(
        swapRoute,
        CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
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
    console.log("Quote Output for", Number(inputAmount)/10**6, " is", Number(decodedData[0])/10**18)
    // const sqrtPriceCalculated = priceToSqrtPriceX96(Number(decodedData[0])/10**6)
    // console.log("Price to Sqrt Price:", sqrtPriceCalculated)

    // UNCHECKED TRADE
    // USE QUOTE OUTPUT AMOUNT HERE
    const uncheckedTrade = Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
            Number(inputAmount)
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
            FREYA_TOKEN,
            Number(decodedData[0])
        ),
        tradeType: TradeType.EXACT_INPUT
    })
    console.log("UNCHECKED TRADE :", uncheckedTrade)

    // const trade = await Trade.exactIn(swapRoute, Number(inputAmount))
    // console.log("Trade:", trade)

    // Approve Tokens
    // CHECK APPROVAL
    await USDC_Contract.connect(accounts[1]).approve(uniswapAddresses.swapRouter2Address, Number(inputAmount)*2)

    // INPUT: SLIPPAGE CONFIG
    // Swap Options
    // Setting swap settings
    // JSBI version should be 3.2.5 for Percent to work as per docs
    const swapOptions = {
        type: SwapType.SWAP_ROUTER_02,
        slippageTolerance: new Percent(100, 10000), // 50 bips, or 0.50%
        deadline: Math.floor(Date.now()/1000) + (60 * 20), // 20 minutes from current unix time
        recipient: accounts[1].address
    }

    // Getting Swap data and value
    // @params: uncheckedTrades[], swapOptions
    const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], swapOptions)
    console.log("Swap Method Params: ", methodParameters)

    // const methodParameters = SwapQuoter.swapCallParameters(trade, swapOptions);
    // console.log("Swap Method Params:", methodParameters)


    //Creating Transaction Object
    const tx = {
        data: methodParameters.calldata,
        from: accounts[0].address,
        to: uniswapAddresses.swapRouter2Address,
        value: methodParameters.value,
    }
    // maxFeePerGas: MAX_FEE_PER_GAS,
        // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    

    console.log("User Balance Before Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[1].address))/10**6, 
    ' FREYA Balance: ', Number(await FREYA_Contract.balanceOf(accounts[1].address))/10**18)

    // WRITING TRANSACTION TO BLOCKCHAIN
    console.log("SENDING SWAP TRANSACTION ... ")
    const result = await accounts[1].sendTransaction(tx);
    console.log("Swap Transaction: ", result)
    
    // ------------------------------------------------ //
    // WORKING CODE : EXECUTE SWAP
    // ------------------------------------------------ //
    // const SwapRouterContract = await hre.ethers.getContractAt(UniswapV3Router2ABI, uniswapAddresses.swapRouter2Address);

    // const params = {
    //     tokenIn: tokenAddresses.WBTC_Address,
    //     tokenOut: tokenAddresses.USDC_Address,
    //     fee: 3000, // 0.3% fee
    //     recipient: accounts[0].address,
    //     amountIn: Number(inputAmount), // 1 WETH
    //     amountOutMinimum: 0, // Minimum 1800 DAI
    //     sqrtPriceLimitX96: 0 // No price limit
    //   };
    // // sqrtPriceLimitX96: 0 means there's no limit
    // // By setting sqrtPriceLimitX96, you can ensure that the swap will not execute if the price move beyond this limit.


    // const swap = await SwapRouterContract.exactInputSingle(params)

    console.log("User Balance After Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[1].address))/10**6,
    ' FREYA Balance: ', Number(await FREYA_Contract.balanceOf(accounts[1].address))/10**18)
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})