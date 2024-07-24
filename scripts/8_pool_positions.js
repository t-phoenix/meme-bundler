const hre = require('hardhat');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const INONFUNGIBLE_POSITION_MANAGER = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json')
const { uniswapAddresses } = require('../utils/constants');
const { getAccounts, printBalances } = require('../utils/helper');


async function main(){


    const accounts = getAccounts()
    for (let index = 0; index < accounts.length; index++) {
        await printBalances(accounts[index].address)
    }


    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaUsdcPoolAddress)
    const nfpmContract = new hre.ethers.Contract(uniswapAddresses.nonFungiblePositionManagerAddress, INONFUNGIBLE_POSITION_MANAGER.abi, hre.ethers.provider );


    // FETCH POOL DATA
    const [tickSpacing, liquidity, slot0] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
    console.log("Slot0: ", slot0);



    const numOfPositions = await nfpmContract.balanceOf(accounts[0].address)
    const calls = []
    for (let index = 0; index < numOfPositions; index++) {
        calls.push(await nfpmContract.tokenOfOwnerByIndex(accounts[0].address, index));
    }

    const positionIds = await Promise.all(calls);
    console.log("Position Ids: ", positionIds);

    const positionCalls =[]
    
    for (let id of positionIds) {
        positionCalls.push(await nfpmContract.positions(id));
    }

    const callResponses = await Promise.all(positionCalls);

    console.log("Call Responses: ", callResponses)
    // @Return Result12)
    // nonce
    // operator
    // token0,
    // token1,
    // fee
    // tickLower
    // tickUpper
    // liquidity
    // feeGrowthInside0LastX128
    // feeGrowthInside1LastX128
    // tokenOweb0,
    // tokenOwed1 

    // const calculatedPrice = 


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})
