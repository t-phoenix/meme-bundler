const hre = require('hardhat');
const { tokenAddresses, uniswapAddresses } = require('../../utils/constants');
const { ERC20_ABI } = require('../../utils/ABI');
const UniswapV3Router2ABI = require('../../utils/UniswapV3Router2ABI.json');
const { FeeAmount } = require('@uniswap/v3-sdk');
const { quote_weth_to_freya } = require('../quote/quote_weth_to_freya');
const { printBalances, printBalancesETH } = require('../../utils/helper');



async function swap_weth_to_freya(_wallet, _inputAmt){

    const swappingWallet = _wallet;
    // await printBalances(swappingWallet.address);

    const inputAmount = hre.ethers.parseUnits(_inputAmt, 'ether'); // FREYA 

    const WETH_Contract = new hre.ethers.Contract(tokenAddresses.WETH_Address, ERC20_ABI, hre.ethers.provider);


    const quoteSwap = await quote_weth_to_freya(inputAmount);
    console.log("Outer Quote Output for", Number(inputAmount)/10**18, "WETH is", Number(quoteSwap)/10**18, "TOKEN")



    // Approve Tokens
    // CHECK APPROVAL
    const approve = await WETH_Contract.connect(swappingWallet).approve(uniswapAddresses.swapRouter2Address, inputAmount)
    await approve.wait()

    console.log("User Balance Before Trade")
    await printBalancesETH(swappingWallet.address);


    // WRITING TRANSACTION TO BLOCKCHAIN
    // ------------------------------------------------ //
    // WORKING CODE : EXECUTE SWAP
    // ------------------------------------------------ //
    const SwapRouterContract = await hre.ethers.getContractAt(UniswapV3Router2ABI, uniswapAddresses.swapRouter2Address);

    const params = {
        tokenIn: tokenAddresses.WETH_Address,
        tokenOut: tokenAddresses.FREYA_Address,
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
    swap_weth_to_freya,
}