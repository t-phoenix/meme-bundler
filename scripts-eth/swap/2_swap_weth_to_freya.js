const hre = require('hardhat');
const fs = require('fs'); 
// const UniswapV3RouterABI = require('../utils/UniswapV3RouterABI.json')
// const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
// const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')

const {FeeAmount, Route, Pool, SwapQuoter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, uniswapAddresses, tokenAddresses, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WBTC_TOKEN, FREYA_TOKEN, WETH_TOKEN } = require('../../utils/constants');
const { getNativeBalance } = require('../../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { ERC20_ABI } = require('../../utils/ABI');
const UniswapV3Router2ABI = require('../../utils/UniswapV3Router2ABI.json');
const {  getAccounts, printBalancesETH } = require('../../utils/helper');

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


    
    // const accounts = await hre.ethers.getSigners();
    // const signerAccount = accounts[0];
    // await printBalances(signerAccount.address);

    const wallets = await getAccounts();
    const swappingWallet =  wallets[0];
    await printBalancesETH(swappingWallet.address);




    // INPUT: AMOUNT
    const inputAmountRaw = '0.01'
    const inputAmount = hre.ethers.parseUnits(inputAmountRaw, 'ether'); // FREYA 

    // Creating Token Contract instance
    // INPUT: SWAP TOKEN
    const WETH_Contract = new hre.ethers.Contract(tokenAddresses.WETH_Address, ERC20_ABI, hre.ethers.provider);
    // const FREYA_Contract =  new hre.ethers.Contract(tokenAddresses.FREYA_Address, ERC20_ABI, hre.ethers.provider);
    // const WBTC_Contract = new hre.ethers.Contract(tokenAddresses.WBTC_Address, ERC20_ABI, hre.ethers.provider);



    // Creating Pool Address (USDC/WETH)
    // INPUT: FEE
    const freyausdcPoolAddress = computePoolAddress({
        factoryAddress: uniswapAddresses.uniswapV3FactoryAddress,
        tokenA: FREYA_TOKEN,
        tokenB: WETH_TOKEN,
        fee: FeeAmount.MEDIUM
    })
    console.log("Computed TOKEN/WETH Pool Address: ", freyausdcPoolAddress)


    
    // Create Pool Instance
    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyausdcPoolAddress);

    // Retrieve Pool Data
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])
    console.log("FREYA/ WETH POOL INFO: token0:", token0, " token1: ", token1, "Fee: ", fee, " liquidity: ", liquidity);

    // const sqrtPrice = sqrtPriceX96ToPrice(slot0[0])
    // console.log("Calculating Price From Sqrt Again:" , sqrtPrice)

    // Construct Pool (Uniswap sdk)
    // @params: token in, token out, poolfee, sqrtPriceX96, liquidity, tick 
    // Check the types of params
    const FREYAUSDCPool = new Pool(
        FREYA_TOKEN,
        WETH_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )
    // console.log("WBTC USDC Pool:", FREYAUSDCPool)

    // Contruct Route Object
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [FREYAUSDCPool], 
        WETH_TOKEN,
        FREYA_TOKEN
    )
    

    // Getting a Quote for Swap
    // Using SwapQuoter from v3-sdk
    const {calldata} = await SwapQuoter.quoteCallParameters(
        swapRoute,
        CurrencyAmount.fromRawAmount(
            WETH_TOKEN,
            Number(inputAmount),
        ),
        TradeType.EXACT_INPUT,
        {
            useQuoterV2: true,
        }
    )
    // console.log("Quote CallData: ", calldata)
    const quoteCallReturnData = await hre.ethers.provider.call({
        to: uniswapAddresses.quoterV2Address,
        data: calldata,
    })
    const decodedData = hre.ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData)
    const outputAmount = Number(decodedData[0]);
    console.log("Quote Output for", Number(inputAmount)/10**18, " is", outputAmount/10**18)
    // const sqrtPriceCalculated = priceToSqrtPriceX96(outputAmount/10**6)
    // console.log("Price to Sqrt Price:", sqrtPriceCalculated)
    
    // Approve Tokens
    // CHECK APPROVAL
    const approveWETH = await WETH_Contract.connect(swappingWallet).approve(uniswapAddresses.swapRouter2Address, inputAmount)
    await approveWETH.wait()

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
    
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})