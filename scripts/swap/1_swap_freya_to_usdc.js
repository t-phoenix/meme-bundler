const hre = require('hardhat');
const fs = require('fs'); 
const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent} = require('@uniswap/sdk-core')

const { USDC_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN, FREYA_TOKEN } = require('../../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const { getAccounts, printBalances } = require('../../utils/helper');
const UniswapV3Router2ABI = require('../../utils/UniswapV3Router2ABI.json');

// const { sqrtPriceX96ToPrice, priceToSqrtPriceX96 } = require('../../utils/helper');

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


    // SELECT WALLET
    const wallets = await getAccounts();
    const swappingWallet =  wallets[0];
    await printBalances(swappingWallet.address);


    // INPUT: AMOUNT
    const inputAmountRaw = '80000'
    const inputAmount = hre.ethers.parseUnits(inputAmountRaw, 'ether'); // FREYA 
    // const inputAmount = 10_000000000000000000n;

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const FREYA_Contract = new hre.ethers.Contract(tokenAddresses.FREYA_Address, ERC20_ABI, hre.ethers.provider);



    // COMPUTE POOL ADDRESS (USDC/WETH)
    // INPUT: FEE
    const freyausdcPoolAddress = computePoolAddress({
        factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
        tokenA: FREYA_TOKEN,
        tokenB: USDC_TOKEN,
        fee: FeeAmount.MEDIUM
    })
    console.log("Computed TOKEN/USDC Pool Address: ", freyausdcPoolAddress)

    // CREATE POOL INSTANCE
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyausdcPoolAddress);

    // RETRIEVE POOL DATA
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])
    console.log("FREYA POOL INFO: token0:", token0, " token1: ", token1, "Fee: ", fee, " liquidity: ", liquidity);
    // console.log("Slot0 data: ", slot0);


    // CONSTRUCT POOL OBJECT
    // @params: token in, token out, poolfee, sqrtPriceX96, liquidity, tick 
    // Check the types of params
    const FREYAUSDCPool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )
    // console.log("WBTC USDC Pool:", wBTCUSDCPool)

    // CONSTRUCT ROUTE OBJECT
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [FREYAUSDCPool], 
        FREYA_TOKEN,
        USDC_TOKEN
    )

    // GETTING A QUOTE FOR SWAP
    // Using SwapQuoter from v3-sdk
    const {calldata} = await SwapQuoter.quoteCallParameters(
        swapRoute,
        CurrencyAmount.fromRawAmount(
            FREYA_TOKEN,
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
    console.log("Quote Output for", Number(inputAmount)/10**18, " is", Number(decodedData[0])/10**6)

    // -----------------------------------//
    // APPROVE TOKENS
    // CHECK APPROVAL
    // -----------------------------------//
    await FREYA_Contract.connect(swappingWallet).approve(uniswapAddresses.swapRouter2Address, inputAmount)
    
    // BEFORE BALANCE
    console.log("User Balance Before Trade")
    await printBalances(swappingWallet.address);

    // WRITING TRANSACTION TO BLOCKCHAIN
    // ------------------------------------------------ //
    // WORKING CODE : EXECUTE SWAP
    // ------------------------------------------------ //
    const SwapRouterContract = await hre.ethers.getContractAt(UniswapV3Router2ABI, uniswapAddresses.swapRouter2Address);

    const params = {
        tokenIn: tokenAddresses.FREYA_Address,
        tokenOut: tokenAddresses.USDC_Address,
        fee: FeeAmount.MEDIUM, // 0.3% fee
        recipient: swappingWallet.address,
        amountIn: inputAmount, // 1 WETH
        amountOutMinimum: 0, // Minimum 1800 DAI
        sqrtPriceLimitX96: 0 // No price limit
      };
    // sqrtPriceLimitX96: 0 means there's no limit
    // By setting sqrtPriceLimitX96, you can ensure that the swap will not execute if the price move beyond this limit.
    const swap = await SwapRouterContract.connect(swappingWallet).exactInputSingle(params)
    console.log("SWAPPING ASSETS ...")
    await swap.wait()

    console.log("User Balance After Trade")
    await printBalances(swappingWallet.address);
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})