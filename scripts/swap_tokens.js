const hre = require('hardhat');
const fs = require('fs'); 
// const UniswapV3RouterABI = require('../utils/UniswapV3RouterABI.json')
// const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
// const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')

const {FeeAmount, Route, Pool, SwapQuoter, Trade, SwapRouter, computePoolAddress} = require('@uniswap/v3-sdk');
const {CurrencyAmount, TradeType, Percent} = require('@uniswap/sdk-core')
const JSBI = require('jsbi')

const { USDC_TOKEN, WETH_TOKEN, uniswapAddresses, tokenAddresses, ERC20_ABI, WETH_ABI, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = require('../utils/constants');
const { getNativeBalance, getTokenBalance } = require('../utils/getBalances');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')


async function main(){
    // Execute Swap
    // COMPUTE POOL OBJECT
    // COMPUTE ROUTE WITH POOLS OBJECT AND INPUT OUTPUT
    // GET A QUOTE - OUTPUT AMOUNT
    // APPROVE TOKEN
    // CREATE UNCHECKED TRADE WITHOUT OUTPUT AMOUNT
    // CREATE SWAP OPTION OBJECT
    // GET TRANSACTION DATA AND VALUE
    // CREATE TRXN
    // SEND TRXN


    
    const accounts=[]
    accounts[0] = await ethers.getImpersonatedSigner("0x887C3599c4826F7b3cDe82003b894430F27d5b92");
    accounts[1] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");

    // TRANSFER NATIVE ETH TO ACCOUNT 0
    await accounts[1].sendTransaction({
        to: accounts[0].address,
        value: 4_000000000000000000n
    })

    console.log("Natve ETH Balance: ")
    console.log("Account 0 (USDC holder): ", Number(await getNativeBalance(accounts[0].address))/10**18)
    console.log("Account 1 (ETH holder): ", Number(await getNativeBalance(accounts[1].address))/10**18 )


    // Creating Token Contract instance
    const USDC_Contract = new hre.ethers.Contract(tokenAddresses.USDC_Address, ERC20_ABI, hre.ethers.provider)
    const WETH_Contract = new hre.ethers.Contract(tokenAddresses.WETH_Address, WETH_ABI, hre.ethers.provider)


    // Creating Pool Address (USDC/WETH)
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

    
    // Construct Pool
    // @params: token in, token out, poolfee, sqrtPriceX96, liquidity, tick 
    // Check the types of params
    const USDCwETHPool = new Pool(
        USDC_TOKEN,
        WETH_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    // Contruct Route Object
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route(
        [USDCwETHPool], 
        USDC_TOKEN, 
        WETH_TOKEN
    )


    // Getting a Quote for Swap
    // Using SwapQuoter from v3-sdk
    const {calldata} = await SwapQuoter.quoteCallParameters(
        swapRoute,
        CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
            10000_000000,
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


    // UNCHECKED TRADE
    // USE QUOTE OUTPUT AMOUNT HERE
    const uncheckedTrade = Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
            Number(10000_000000)
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
            WETH_TOKEN,
            Number(decodedData[0])
        ),
        tradeType: TradeType.EXACT_INPUT
    })
    console.log("UNCHECKED TRADE :", uncheckedTrade)


    // Approve Tokens
    await USDC_Contract.connect(accounts[0]).approve(uniswapAddresses.swapRouterAddress, 10000_000000n)

    // Swap Options
    // Setting swap settings
    // JSBI version should be 3.2.5 for Percent to work as per docs
    const swapOptions = {
        slippageTolerance: new Percent(50, 10000), // 50 bips, or 0.50%
        deadline: Math.floor(Date.now()/1000) + (60 * 20), // 20 minutes from current unix time
        recipient: accounts[0].address
    }
    console.log("Swap Options:", swapOptions)

    // Getting Swap data and value
    // @params: uncheckedTrades[], swapOptions
    const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], swapOptions)
    console.log("Swap Method Params: ", methodParameters)


    //Creating Transaction Object
    const tx = {
        from: accounts[0].address,
        to: uniswapAddresses.swapRouterAddress,
        value: methodParameters.value,
        data: methodParameters.calldata,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    }
    

    console.log("User Balance Before Trade")
    console.log('USDC Balance: ', Number(await getTokenBalance(tokenAddresses.USDC_Address, accounts[0].address))/10**6, 
    ' WETH Balance: ', Number(await getTokenBalance(tokenAddresses.WETH_Address, accounts[0].address))/10**18)

    // WRITING TRANSACTION TO BLOCKCHAIN
    const result = await accounts[0].sendTransaction(tx);
    // console.log("Swap Transaction: ", result)

    console.log("User Balance After Trade")
    console.log('USDC Balance: ', Number(await getTokenBalance(tokenAddresses.USDC_Address, accounts[0].address))/10**6,
    ' WETH Balance: ', Number(await getTokenBalance(tokenAddresses.WETH_Address, accounts[0].address))/10**18)
}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})