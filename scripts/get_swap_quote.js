const { computePoolAddress, FeeAmount } = require('@uniswap/v3-sdk');
const hre = require('hardhat');
const { uniswapAddresses, USDC_TOKEN, WETH_TOKEN, tokenAddresses } = require('../utils/constants');

const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')


async function main(){

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
    const wethusdcPoolAddress = computePoolAddress({
        factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
        tokenA: USDC_TOKEN,
        tokenB: WETH_TOKEN,
        fee: FeeAmount.MEDIUM
    })
    console.log("Computed Pool Address: ", wethusdcPoolAddress)
    
    // Create Pool Instance
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, wethusdcPoolAddress);

    // Retrieve Pool Data
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])
    console.log("Pool Data: ", token0, token1, fee, Number(liquidity)/10**18, slot0)
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
    const quoterContract = new hre.ethers.Contract(uniswapAddresses.quoterAddress, Quoter.abi, hre.ethers.provider)

    // Simulate Swap with quoteExactInputSingle
    // Static Call simulates the Write Function
    const quotedAmoutOut = await quoterContract.quoteExactInputSingle.staticCall(
        tokenAddresses.USDC_Address,
        tokenAddresses.WETH_Address,
        FeeAmount.MEDIUM,
        10000_000000, // Decimal 6 for USDC
        0
    )
    console.log("Checking for 10,000 USDC: ", Number(quotedAmoutOut)/10**18)
}




main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})