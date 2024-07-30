const hre = require('hardhat');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const INONFUNGIBLE_POSITION_MANAGER = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json')
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN } = require('../utils/constants');
const { getAccounts, printBalances } = require('../utils/helper');
const { Position, Pool, FeeAmount } = require('@uniswap/v3-sdk');


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
    console.log("NFT Ids: ", calls)


    const positionCalls =[]
    
    for (let id of calls) {
        positionCalls.push(await nfpmContract.positions(id));
    }
    console.log("Position Calls:", positionCalls)
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

    const pool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    for (let index = 0; index < positionCalls.length; index++) {
        const nftPosition = new Position({
            pool: pool,
            tickLower: Number(positionCalls[index][5]),
            tickUpper: Number(positionCalls[index][6]),
            liquidity: String(positionCalls[index][7]),
            useFullPrecision: true
        })

        const amount0 = nftPosition.amount0.toSignificant(6);
        const amount1 = nftPosition.amount1.toSignificant(6);
        console.log("NFT Position: ", index+1, " Amount0(FREYA): ", amount0, " Amount1(USDC): ",amount1 )
        
    }
    


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})
