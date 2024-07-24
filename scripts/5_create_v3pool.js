const hre = require('hardhat');
const fs = require('fs');
const UniswapFactoryABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')

const { uniswapAddresses, tokenAddresses } = require('../utils/constants');
const { FeeAmount } = require('@uniswap/v3-sdk');


async function main(){
    // GOAL: Create V3 Pool
    // 1. Create Uniswap Factory
    // 2. Get Meme Token Address from JSON file
    // 3. CREATE FREYA Trading POOL
    // 4. GET POOL ADDRESS FROM FACTORY and POOL DATA from Pool Contract
    // 5. Save Pool Address in addresses.json


    // Tick: boundaries between discrete price ranges
    // 1 tick represents a price change of 0.01% from current price
    // tickSpacing: a contant that describes which ticks can be used by the pool. only ticks at indices that are divisible by it can be initialized.
    // high fee (1%) --> higher tickSpacing (200)
    // price difference between init ticks 1.0001**200 = 1.0202 = 2.02%
    
    // Liquidity Position: providing liq
    
    // Use Uniswap V3 Factory and use createPool(tokenA, tokenB, fee)
    // getPool (token0, token1, fee) ==> pool || token0 and token1 is interchangable

    // GET UNISWAP FACTORY
    const UniswapV3FactoryContract = await hre.ethers.getContractAt(UniswapFactoryABI.abi, uniswapAddresses.uniswapV3FactoryAddress);
    const owner = await UniswapV3FactoryContract.owner();
    console.log("Uniswap Factory Owner: ", owner)


    // Meme Token Address
    const data = fs.readFileSync('./addresses.json', 'utf-8');
    // const freyaAddress = JSON.parse(data).token;
    // console.log("FREYA address: ",freyaAddress)

    // Create MEME TOKEN POOL 
    const createPool = await UniswapV3FactoryContract.createPool(tokenAddresses.FREYA_Address, tokenAddresses.USDC_Address, FeeAmount.MEDIUM);
    console.log("Creating MEME Pool FREYA/USDC at Fee: ", FeeAmount.MEDIUM);
     
    await createPool.wait()

    

    // GET POOL ADDRESS
    const freyaPoolAddress = await UniswapV3FactoryContract.getPool(tokenAddresses.FREYA_Address, tokenAddresses.USDC_Address, FeeAmount.MEDIUM)
    console.log("FREYA Pool Contract:", freyaPoolAddress)

    // GET POOL DATA
    const FreyaPoolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, freyaPoolAddress);
    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        FreyaPoolContract.token0(),
        FreyaPoolContract.token1(),
        FreyaPoolContract.fee(),
        FreyaPoolContract.liquidity(),
        FreyaPoolContract.slot0(),
    ])

    console.log("FREYA POOL INFO: token0:", token0, " token1: ", token1, "Fee: ", fee, " liquidity: ", liquidity);
    console.log("Slot0 data: ", slot0);
    // slot[0]: sqrtPriceX96
    // slot[1]: tick
    

    // Adding pool address to json Data file
    const dataStore = {
        pool: freyaPoolAddress
    }
    let jsonFileData = JSON.parse(data)
    const newData = {...jsonFileData, ...dataStore}

    const jsonFileName = "addresses.json";
    fs.writeFileSync(jsonFileName, JSON.stringify(newData, null, 2));
    console.log(`Token Address ${newData} stored. Saved to ${jsonFileName}`);

    


}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})