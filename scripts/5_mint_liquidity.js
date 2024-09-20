//CAUTION: MUST ADD TOKEN AND POOL ADDRESS MANUALLY IN utils/constants.js
// USE LIQUIDITY SCRIPTS
const fs = require('fs');
const hre = require('hardhat');
const { getAccounts, printBalances } = require('../utils/helper');
const { ERC20_ABI } = require('../utils/ABI');
const { tokenAddresses, uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = require('../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { encodeSqrtRatioX96, TickMath, Position, Pool, FeeAmount, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent } = require('@uniswap/sdk-core');


async function main(){
    //1. Give token approval
    //2. Create Pool Instance
    //3. Calculate Position from our input tokens
    //4. Config and Execute minting transaction

    // INPUTS
    const freyaInput = hre.ethers.parseUnits('4000000', 'ether'); // 2000/1 or 0.0005
    const usdcInput = hre.ethers.parseUnits('5', 6);

    // PRICE RANGE (line 78-79)
    // const sqrtPrice = encodeSqrtRatioX96(Number(usdcInput), Number(freyaInput));
    // const tick = TickMath.getTickAtSqrtRatio(sqrtPrice);


    const wallets = getAccounts()
    
    const account =  wallets[0];
    await printBalances(account.address)


    // GET POOL ADDRESS
    const data = fs.readFileSync('./addresses.json', 'utf-8');
    const freyaAddress = JSON.parse(data).token
    const freyaUsdcPoolAddress = JSON.parse(data).pool;

     //CONTRACT INSTANCES
     const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
     const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, freyaAddress);
     const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyaUsdcPoolAddress)


    // APPROVE TOKENS
    await FREYA_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, freyaInput);
    await USDC_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, usdcInput);

    // FETCH POOL DATA
    const [tickSpacing, liquidity, slot0] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
    console.log("Slot0: ", slot0[0], slot0[1]);

    // UNISWAP POOL OBJECT
    const configuredPool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )


    
    // CREATE POSITION FROM INPUT AMOUNTS
    const position  = Position.fromAmounts({
        pool: configuredPool,
        tickLower: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) ,
        tickUpper: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing*2000,
        amount0: Number(freyaInput),
        amount1: Number(usdcInput),
        useFullPrecision: true
    })
    // console.log("Position: ", position)

    // MINT OPTIONS OBJECT
    const mintoptions = {
        recipient: account.address,
        deadline: Math.floor(Date.now()/1000)+ 60*20,
        slippageTolerance: new Percent(50, 10_000)
    }

    // GETTING CALLDATA PARAMS FOR TRANSACTION
    const {calldata, value} = NonfungiblePositionManager.addCallParameters(
        position, 
        mintoptions
    )

    // TRANSACTION OBJECT
    const transaction = {
        data: calldata,
        to: uniswapAddresses.nonFungiblePositionManagerAddress,
        value: value,
        from: account.address,
        // maxFeePerGas: MAX_FEE_PER_GAS,
        // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    }

    console.log("MINTING POSITION IN POOOL....")
    const txRes = await account.sendTransaction(transaction);
    await txRes.wait()


    for (let index = 0; index < wallets.length; index++) {
        await printBalances(wallets[index].address);    
    }

    console.log("Pool Address: ", freyaUsdcPoolAddress)
    console.log("Pool balance Freya: ", Number(await FREYA_Contract.balanceOf(freyaUsdcPoolAddress))/10**18, "USDC: ", Number(await USDC_Contract.balanceOf(uniswapAddresses.freyaUsdcPoolAddress))/10**6)







}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})