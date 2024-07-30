const hre = require('hardhat');
const fs = require('fs');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')

const { getTokenApproval, getNativeBalance } = require('../../utils/getBalances');
const { uniswapAddresses, tokenAddresses, FREYA_TOKEN, USDC_TOKEN, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = require('../../utils/constants');
const { ERC20_ABI } = require('../../utils/ABI');
const { Wallet } = require('ethers');
const { Pool, FeeAmount, encodeSqrtRatioX96,TickMath, Position, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');

const { priceToSqrtPriceX96, getTickFromPrice, getPriceFromTick, printBalances } = require('../../utils/helper');
const { Percent } = require('@uniswap/sdk-core');


async function main(){
    //1. Give token approval
    //2. Create Pool Instance
    //3. Calculate Position from our input tokens
    //4. Config and Execute minting transaction


    // SETUP 
    const data = fs.readFileSync('./addresses.json', 'utf-8');
    const freyaAddress = JSON.parse(data).token;
    const freyaUSDCPoolAddress = JSON.parse(data).pool;
    console.log("Pool Address: ", freyaUSDCPoolAddress)

    //CONTRACT INSTANCES
    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, freyaAddress);
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyaUSDCPoolAddress)

    const accounts = await hre.ethers.getSigners();
    console.log("Primary Account: ",accounts[0].address);
    console.log("ETH Balance: ", Number(await getNativeBalance(accounts[0].address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(accounts[0].address))/10**18, "USDC Balance: ", Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6);



    let wallets =[]
    const walletsData = fs.readFileSync('./wallets.json', 'utf-8');
    const ParseData = JSON.parse(walletsData)
    for (let index = 0; index < ParseData.length; index++) {
        const address =ParseData[index].address
        const key = ParseData[index].privateKey
        const wallet = new Wallet(key, hre.ethers.provider)
        wallets.push(wallet)

        console.log("Wallet: ",wallet.address);
        console.log("ETH Balance: ", Number(await getNativeBalance(address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(address))/10**18, "USDC Balance: ", Number(await USDC_Contract.balanceOf(address))/10**6);
    }


    // INPUTS
    //token0: FREYA, token1: USDC
    const freyaRatio = hre.ethers.parseUnits('2000', 'ether');
    const usdcRatio = hre.ethers.parseUnits('1', 6);
    const freyaInput = hre.ethers.parseUnits('400000', 'ether');
    const usdcInput = hre.ethers.parseUnits('200', 6);

    // const priceFreya = 0.04; 
    // const decimalFreya = 18;
    // const decimalUSDC = 6
    // REVERSE INPUTS(amount1, amount0)
    const sqrtPrice = encodeSqrtRatioX96(Number(usdcRatio), Number(freyaRatio));
    console.log("sqrt Price: ", BigInt(sqrtPrice));
    const tick = TickMath.getTickAtSqrtRatio(sqrtPrice)
    console.log("TickMath: ", tick);
    const buyOneOfToken0 = ( ((sqrtPrice) / 2**96)**2 / (10**6/ 10**18)).toFixed(6);
    console.log("Buy 1 Of token FREYA: ", buyOneOfToken0, "USDC")
    console.log("Buy 1 OF token USDC: ", 1/buyOneOfToken0, "FREYA")


    // APPROVE TOKENS
    await FREYA_Contract.connect(wallets[0]).approve(uniswapAddresses.nonFungiblePositionManagerAddress, freyaInput);
    await USDC_Contract.connect(wallets[0]).approve(uniswapAddresses.nonFungiblePositionManagerAddress, usdcInput);

    // INITIALIZE POOL
    const init = await POOL_Contract.initialize(BigInt(sqrtPrice))
    await init.wait()

    // UNISWAP POOL OBJECT
    const [tickSpacing, liquidity, slot0] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
    console.log("Slot0: ", slot0[0], slot0[1]);


    const calculatePrice = TickMath.getSqrtRatioAtTick(Number(slot0[1]));
    console.log("Calculating price from tick: ", Number(calculatePrice), String(calculatePrice), BigInt(calculatePrice))




    const configuredPool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    console.log("Pool Ticks: tickSpacing: ", configuredPool.tickSpacing, " Tick Current: ", configuredPool.tickCurrent, "Nearest Usable tick:" , nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing))

    const position  = Position.fromAmounts({
        pool: configuredPool,
        tickLower: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing*200,
        tickUpper: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing*200,
        amount0: Number(freyaInput),
        amount1: Number(usdcInput),
        useFullPrecision: true
    })

    // console.log("Position: ", position)

    const mintoptions = {
        recipient: wallets[0].address,
        deadline: Math.floor(Date.now()/1000)+ 60*20,
        slippageTolerance: new Percent(50, 10_000)
    }

    const {calldata, value} = NonfungiblePositionManager.addCallParameters(
        position, 
        mintoptions
    )
    console.log("Calldata and value: ", calldata, " : ", value);

    const transaction = {
        data: calldata,
        to: uniswapAddresses.nonFungiblePositionManagerAddress,
        value: value,
        from: wallets[0].address,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    }

    const txRes = await wallets[0].sendTransaction(transaction);
    await txRes.wait() 

    const [tickSpacing2, liquidity2, slot02] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ]) 

    console.log("Tick Spacing: ", tickSpacing2, "Liquidity: ", liquidity2);
    console.log("Slot0: ", slot02[0], slot02[1]);


    for (let index = 0; index < wallets.length; index++) {
        await printBalances(wallets[index].address)
    }
    console.log(uniswapAddresses.freyaUsdcPoolAddress,"Pool balance Freya: ", Number(await FREYA_Contract.balanceOf(uniswapAddresses.freyaUsdcPoolAddress))/10**18, "USDC: ", Number(await USDC_Contract.balanceOf(uniswapAddresses.freyaUsdcPoolAddress))/10**6)


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})