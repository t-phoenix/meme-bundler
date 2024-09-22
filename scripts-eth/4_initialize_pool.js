const hre = require('hardhat');
const JSBI = require('jsbi');
const fs = require('fs');

const { uniswapAddresses } = require('../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { printBalances, getAccounts, printBalancesETH } = require('../utils/helper');
const { encodeSqrtRatioX96, TickMath } = require('@uniswap/v3-sdk');


async function main(){
    //CAUTION: Correctly use encodeSqrtRqtioX96 to inititalize the pool.
    // Clear with token0 and token1, and function parameters

    // GET POOL ADDRESS
    const data = fs.readFileSync('./addresses.json', 'utf-8');
    const freyaWETHPoolAddress = JSON.parse(data).tokenWETHpool;
    //const freyaUsdcPoolAddress = uniswapAddresses.freyaUsdcPoolAddress;


    //CONTRACT INSTANCES
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyaWETHPoolAddress );

    // GET ACCOUNTS
    let accounts = await hre.ethers.getSigners()
    await printBalancesETH(accounts[0].address)
    
    
    // INPUTS
    // token0: FREYA, token1: USDC
    // 2000TOKEN/ USDC
    const freyaInput = hre.ethers.parseUnits('1000', 'ether');
    const wethInput = hre.ethers.parseUnits('0.05', 'ether');
    //const usdcInput = hre.ethers.parseUnits('1', 6);

    // CALCULATE POOL VARIABLES
    // REVERSE INPUTS(amount1, amount0)
    // const oldsqrtPrice = encodeSqrtRatioX96(Number(freyaInput), Number(usdcInput));
    // const oldtick = TickMath.getTickAtSqrtRatio(oldsqrtPrice);
    // const oldbuyOneOfToken0 = ((10**6/ 10**18)/ ((oldsqrtPrice) / 2**96)**2).toFixed(6);
    // console.log("old sqrt Price: ", BigInt(oldsqrtPrice), "old TickMath: ", oldtick);
    // console.log("Buy 1 Of token FREYA: ", oldbuyOneOfToken0)

    const sqrtPrice = encodeSqrtRatioX96(Number(wethInput), Number(freyaInput));
    const tick = TickMath.getTickAtSqrtRatio(sqrtPrice);
    const buyOneOfToken0 = ( ((sqrtPrice) / 2**96)**2 / (10**18/ 10**18)).toFixed(6);
    console.log("sqrt Price: ", Number(sqrtPrice), "TickMath: ", tick);
    console.log("Price of 1 ERC token: ", buyOneOfToken0, "WETH")
    console.log("Price of 1 WETH: ", 1/buyOneOfToken0, "TOKEN")


    // INITIALIZE POOL
    console.log("INITIALIZING POOL")
    const init = await POOL_Contract.initialize(BigInt(sqrtPrice))
    await init.wait()

    console.log("TOKEN UNISWAP V3 POOL INITIALIZED!  ADD LIQUIDTY...")


    // GET POOL DATA
    const [tickSpacing, liquidity, slot0] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
    console.log("Slot0 SqrtPrice: ", slot0[0], "Tick", slot0[1]);


    // const calculatePrice = TickMath.getSqrtRatioAtTick(Number(slot0[1]));
    // console.log("Calculating sqrtPriceX96 from tick: ", Number(calculatePrice), String(calculatePrice), BigInt(calculatePrice))
    
    
    // //const tick = TickMath.getTickAtSqrtRatio(sqrtPrice);
    // const calculateTick = TickMath.getTickAtSqrtRatio(JSBI.BigInt(Number(slot0[0])));
    // console.log("Calculating Tick from sqrtPriceX96: ", Number(calculateTick), String(calculateTick), BigInt(calculateTick))


}




main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})