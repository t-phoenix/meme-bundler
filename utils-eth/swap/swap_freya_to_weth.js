const hre = require('hardhat');
const fs = require('fs'); 
const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent} = require('@uniswap/sdk-core')

const { uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN, FREYA_TOKEN } = require('../../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const { getAccounts, printBalances, printBalancesETH } = require('../../utils/helper');
const UniswapV3Router2ABI = require('../../utils/UniswapV3Router2ABI.json');
const { quote_freya_to_weth } = require('../quote/quote_freya_to_weth');


async function swap_freya_to_weth(_wallet, _inputAmt){
    const swappingWallet = _wallet;
    // await printBalances(swappingWallet.address);

    const inputAmount = hre.ethers.parseUnits(_inputAmt, 'ether'); // FREYA 

    const FREYA_Contract = new hre.ethers.Contract(tokenAddresses.FREYA_Address, ERC20_ABI, hre.ethers.provider);


    const quoteSwap = await quote_freya_to_weth(inputAmount);
    console.log("Outer Quote Output for", Number(inputAmount)/10**18, " TOKEN is", Number(quoteSwap)/10**18, " WETH")



    // -----------------------------------//
    // APPROVE TOKENS
    // CHECK APPROVAL
    // -----------------------------------//
    const approve = await FREYA_Contract.connect(swappingWallet).approve(uniswapAddresses.swapRouter2Address, inputAmount)
    await approve.wait();


    // BEFORE BALANCE
    console.log("User Balance Before Trade")
    await printBalancesETH(swappingWallet.address);

    // WRITING TRANSACTION TO BLOCKCHAIN
    // ------------------------------------------------ //
    // WORKING CODE : EXECUTE SWAP
    // ------------------------------------------------ //
    const SwapRouterContract = await hre.ethers.getContractAt(UniswapV3Router2ABI, uniswapAddresses.swapRouter2Address);

    const params = {
        tokenIn: tokenAddresses.FREYA_Address,
        tokenOut: tokenAddresses.WETH_Address,
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
    await printBalancesETH(swappingWallet.address);

    return Number(quoteSwap)/10**18
}


module.exports = {
    swap_freya_to_weth,
}