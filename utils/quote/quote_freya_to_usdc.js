const hre = require('hardhat');
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN } = require('../constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { FeeAmount, SwapQuoter, Pool, Route } = require('@uniswap/v3-sdk');
const { CurrencyAmount, TradeType } = require('@uniswap/sdk-core');



async function quote_freya_to_usdc(inputAmount){
    const freyausdcPoolAddress = uniswapAddresses.freyaUsdcPoolAddress;

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


    // CONSTRUCT POOL OBJECT
    const FREYAUSDCPool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    const swapRoute = new Route(
        [FREYAUSDCPool], 
        FREYA_TOKEN,
        USDC_TOKEN
    )

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
    // console.log("Quote Output for", Number(inputAmount)/10**18, " is", Number(decodedData[0])/10**6)

    return decodedData[0]

}






module.exports = {
    quote_freya_to_usdc,
}