const hre = require('hardhat');

const UniswapNonFungiblePositionManagerABI = require('../../utils/UniswapNonFungiblePositionManager.json');
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, WETH_TOKEN, tokenAddresses } = require('../../utils/constants');
const { getAccounts, printBalances, printBalancesETH } = require('../../utils/helper');
const {Position, Pool, FeeAmount} = require('@uniswap/v3-sdk');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');


async function main(){

    const wallets = getAccounts()
    const account = wallets[1];
    await printBalancesETH(account.address);

    // NFT Manager Contract
    const nfpmContract = await hre.ethers.getContractAt(UniswapNonFungiblePositionManagerABI, uniswapAddresses.nonFungiblePositionManagerAddress );

    // USER NFT BALANCE
    const userBalance = await nfpmContract.balanceOf(account.address);
    console.log("Uniswap NFT Balance: ", userBalance);

    // NFT IDS
    let positionIds = []
    for (let index = 0; index < userBalance; index++) {
        const token = await nfpmContract.tokenOfOwnerByIndex(account.address, index);
        console.log("Token", index, ": ", token);
        positionIds.push(token)
    }


    // POSITION INSTANCE CONFIG 
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaWETHPoolAddress)
    const [liquidity, slot0] = await Promise.all([
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    const pool = new Pool(
        FREYA_TOKEN,
        WETH_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    // NFT POSITIONS
    for (let index = 0; index < positionIds.length; index++) {

        const tokenPosition = await nfpmContract.positions(positionIds[index]);
        if(String(tokenPosition[3]) === String(tokenAddresses.WETH_Address)){


        const position = new Position({
            pool: pool,
            tickLower: Number(tokenPosition[5]),
            tickUpper: Number(tokenPosition[6]),
            liquidity: String(tokenPosition[7]),
            useFullPrecision: true
        })
        const amount0 = position.amount0.toSignificant(6);
        const amount1 = position.amount1.toSignificant(6);

        console.log("TokenId",positionIds[index],"Amount0: ", amount0, " Amount1: ", amount1)
    }
        
    }


}



main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})