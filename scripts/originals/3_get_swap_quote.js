//NOT WORKING
const { computePoolAddress, FeeAmount } = require('@uniswap/v3-sdk');
const hre = require('hardhat');
const { uniswapAddresses, USDC_TOKEN, WETH_TOKEN, tokenAddresses } = require('../../utils/constants');

const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const QuoterV2 = require('@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json')


async function main(){

    // LEARNING: SWAP QUOTE
    // Step1 :Compute Pool Address
    // Step2 :Pool Contract Instance
    // Step3 :Get Pool Data
    // Step4 :Quote Contract Instance
    // Step5 :Quote.quoteExactInputSingle staticCall
    // Step6 :Amount Output Quote

    // Get a Quote
    // quoteExactInputSingle (USDC-WETH): 
    // @params: 
    // token in 
    // token out, 
    // amount in, 
    // fee--> pool identifier
    // FeeAmount.LOWEST = 100, LOW = 500, MEDIUM = 3000, HIGH = 10000
    // fee 500 == 0.05%

    // Compute WETH/USDC Pool Address
    // const wethusdcPoolAddress = computePoolAddress({
    //     factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
    //     tokenA: USDC_TOKEN,
    //     tokenB: WETH_TOKEN,
    //     fee: FeeAmount.MEDIUM
    // })
    // console.log("Computed Pool Address: ", wethusdcPoolAddress)
    const inputAmount = hre.ethers.parseUnits('10', 6); // 1, 10, 100, 200 USDC

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
    console.log("Pool Data: ", token0, token1, fee, Number(liquidity), slot0)
    // liquidity - the amount of liquidity the pool can use for trades at the current price.
    // slot0 returns 
    // sqrtPriceX96
    // tick
    // observationIndex
    // observationCardinality
    // observationCardinalityNext
    // feeProtocol
    // unlocked


    // Create Quoter Contract Instance
    const quoterV2Contract = new hre.ethers.Contract(uniswapAddresses.quoterV2Address, QuoterV2.abi, hre.ethers.provider)

    // quoteExactInputSingle
    // quoteExactInputSingle
    // Simulate Swap with quoteExactInputSingle
    // Static Call simulates the Write Function
    // DOUBLE CHECK ABI FOR QUOTER OR V2
    const quotedAmoutOut = await quoterV2Contract.quoteExactInputSingle.staticCall({
        tokenIn: tokenAddresses.USDC_Address,
        tokenOut: tokenAddresses.FREYA_Address,
        amountIn: inputAmount,
        fee: FeeAmount.MEDIUM,
        sqrtPriceLimitX96:0
    })
    console.log("Checking for", Number(inputAmount)/10**6 ,"USDC: ", Number(quotedAmoutOut)/10**18)
}




main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})