// SAME IN MAIN REPO
const hre = require('hardhat');
const { getAccounts, printBalances, printBalancesETH } = require('../../utils/helper');
const { ERC20_ABI } = require('../../utils/ABI');
const { tokenAddresses, uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, WETH_TOKEN } = require('../../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { encodeSqrtRatioX96, TickMath, Position, Pool, FeeAmount, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent } = require('@uniswap/sdk-core');


async function main(){
    //1. Give token approval
    //2. Create Pool Instance
    //3. Calculate Position from our input tokens
    //4. Config and Execute minting transaction

    // INPUTS:
    // 1. WALLET
    // 2. AMOUNTS IN // Max amount of currency the liquidity position can use. 
    // 3. Position Lower and Upper tick




    // INPUTS
    const freyaInput = hre.ethers.parseUnits('2000', 'ether'); // 2000/1 or 0.0005
    const wethInput = hre.ethers.parseUnits('0.1', 'ether');

    const wallets = getAccounts()
    const account = wallets[2];
    await printBalancesETH(account.address)
    

    //CONTRACT INSTANCES
    const WETH_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.WETH_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaWETHPoolAddress)


    // APPROVE TOKENS
    const approveFreya = await FREYA_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, freyaInput);
    const approveWETH = await WETH_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, wethInput);
    await approveFreya.wait();
    await approveWETH.wait();

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
        WETH_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    // INPUT
    // const tickLower = Math.floor(Math.log(priceLower) / Math.log(1.0001));


    // const positionTickLower = nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing;
    // const positionTickUpper = nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing*2000
    const positionTickLower = nearestUsableTick(TickMath.MIN_TICK, configuredPool.tickSpacing)
    const positionTickUpper = nearestUsableTick(TickMath.MAX_TICK, configuredPool.tickSpacing)



    // CREATE POSITION FROM INPUT AMOUNTS
    const position  = Position.fromAmounts({
        pool: configuredPool,
        tickLower: positionTickLower,
        tickUpper: positionTickUpper,
        amount0: Number(freyaInput),
        amount1: Number(wethInput),
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



    console.log("User Balance")
    await printBalancesETH(account.address);    
    console.log("Pool Balance")
    await printBalancesETH(uniswapAddresses.freyaWETHPoolAddress)


}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})