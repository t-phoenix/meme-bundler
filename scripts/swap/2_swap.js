const hre = require('hardhat');
const fs = require('fs'); 
const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN } = require('../../utils/constants');
const { getNativeBalance } = require('../../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const { sqrtPriceX96ToPrice, priceToSqrtPriceX96 } = require('../../utils/helper');

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
    const inputAmount = 10000000; // 0.1 BTC 

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const WBTC_Contract = new hre.ethers.Contract(tokenAddresses.WBTC_Address, ERC20_ABI, hre.ethers.provider)

    console.log("Account 0 USDC: ", Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6)

    // COMPUTE POOL ADDRESS (USDC/WETH)
    // INPUT: FEE
    const wbtcusdcPoolAddress = computePoolAddress({
        factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
        tokenA: WBTC_TOKEN,
        tokenB: USDC_TOKEN,
        fee: FeeAmount.MEDIUM
    })
    console.log("Computed WBTC/USDC Pool Address: ", wbtcusdcPoolAddress)

    // CREATE POOL INSTANCE
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, wbtcusdcPoolAddress);

    // RETRIEVE POOL DATA
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


    // CONSTRUCT POOL OBJECT
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

    // CONSTRUCT ROUTE OBJECT
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [wBTCUSDCPool], 
        WBTC_TOKEN, 
        USDC_TOKEN
    )

    // GETTING A QUOTE FOR SWAP
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
    const quoteCallReturnData = await hre.ethers.provider.call({
        to: uniswapAddresses.quoterV2Address,
        data: calldata,
    })
    const decodedData = hre.ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData)
    console.log("Quote Output for", Number(inputAmount)/10**8, " is", Number(decodedData[0])/10**6)

    const sqrtPriceCalculated = priceToSqrtPriceX96(Number(decodedData[0])/10**6)
    console.log("Price to Sqrt Price:", sqrtPriceCalculated)

    // UNCHECKED TRADE
    // USE QUOTE OUTPUT AMOUNT HERE
    const uncheckedTrade = Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
            WBTC_TOKEN,
            Number(inputAmount)
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
            Number(decodedData[0])
        ),
        tradeType: TradeType.EXACT_INPUT
    })
    console.log("UNCHECKED TRADE :", uncheckedTrade)

    // -----------------------------------//
    // APPROVE TOKENS
    // CHECK APPROVAL
    // -----------------------------------//
    await WBTC_Contract.connect(accounts[0]).approve(uniswapAddresses.swapRouter2Address, Number(inputAmount)*2)

    // INPUT: SLIPPAGE CONFIG
    // Swap Options
    // Setting swap settings
    // JSBI version should be 3.2.5 for Percent to work as per docs
    const swapOptions = {
        slippageTolerance: new Percent(1000, 10000), // 50 bips, or 0.50%
        deadline: Math.floor(Date.now()/1000) + (60 * 20), // 20 minutes from current unix time
        recipient: accounts[0].address
    }

    // // Getting Swap data and value
    // // @params: uncheckedTrades[], swapOptions
    const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], swapOptions)
    console.log("Swap Method Params: ", methodParameters)


    //Creating Transaction Object
    const tx = {
        data: methodParameters.calldata,
        from: accounts[0].address,
        to: uniswapAddresses.swapRouter2Address,
        value: methodParameters.value,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    }
    
    // BEFORE BALANCE
    console.log("User Balance Before Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6, 
    ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)

    // WRITING TRANSACTION TO BLOCKCHAIN
    const result = await accounts[0].sendTransaction(tx);
    console.log("Swap Transaction: ", result)

    // AFTER BALANCE
    console.log("User Balance After Trade")
    console.log('USDC Balance: ', Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6,
    ' WBTC Balance: ', Number(await WBTC_Contract.balanceOf(accounts[0].address))/10**8)
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})