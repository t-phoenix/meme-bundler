const hre = require('hardhat');
const readlineSync = require('readline-sync');
const { getAccounts, printBalances, printBalancesETH } = require('../../utils/helper');
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, tokenAddresses, WETH_TOKEN } = require('../../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const UniswapNonFungiblePositionManagerABI = require('../../utils/UniswapNonFungiblePositionManager.json');

const { Position, Pool, FeeAmount, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent, CurrencyAmount } = require('@uniswap/sdk-core');
const { ERC20_ABI } = require('../../utils/ABI');


async function main(){

    // NFT ID INPUT
    // const nftId = 18358;
    // INPUTS


    const wallets = getAccounts()
    const account = wallets[1];
    await printBalancesETH(account.address)
    

    // NFT Manager Contract
    const nfpmContract = await hre.ethers.getContractAt(UniswapNonFungiblePositionManagerABI, uniswapAddresses.nonFungiblePositionManagerAddress );

    // USER NFT BALANCE
    const userBalance = await nfpmContract.balanceOf(account.address);
    console.log("Uniswap NFT Balance: ", userBalance);

    // NFT IDS
    for (let index = 0; index < userBalance; index++) {
        const token = await nfpmContract.tokenOfOwnerByIndex(account.address, index);
        console.log("Token", index, ": ", token);
    }

    // NFT ID INPUT
    // const nftId = 21193;
    // INPUT: NUMBER OF WALLETS
    const input = readlineSync.question("Enter NFT Id you want to remove liquidity:")
    const nftId = parseInt(input, 10);

    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaWETHPoolAddress)


    // FETCH POOL DATA
    const [tickSpacing, liquidity, slot0] = await Promise.all([
        POOL_Contract.tickSpacing(),
        POOL_Contract.liquidity(),
        POOL_Contract.slot0()
    ])
    console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
    console.log("Slot0: ", slot0);

    // Construct Pool Object
    const pool = new Pool(
        FREYA_TOKEN,
        WETH_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    // GET POSITION
    const nftPosition = await nfpmContract.positions(nftId);
    // console.log("NFT Position for id: ", nftId, " is ", nftPosition)
    // @Return Result12)
    // nonce, operator, token0,, token1,
    // fee, tickLower, tickUpper, liquidity
    // feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokenOweb0,, tokenOwed1 

    // Construct position Object
    const position = new Position({
        pool: pool,
        tickLower: Number(nftPosition[5]),
        tickUpper: Number(nftPosition[6]),
        liquidity: String(nftPosition[7]),
        useFullPrecision: true
    })
    const amount0 = position.amount0.toSignificant(6);
    const amount1 = position.amount1.toSignificant(6);

    // console.log("Position: ", position);
    console.log("Amount0: ", amount0, " Amount1: ", amount1)

    const removeInput = readlineSync.question("Enter Liquidity % you want to remove (e.g. 60):")
    const percentage = parseInt(removeInput, 10);
    const removeLiquidityPercentage = new Percent(percentage, 100)
    
    // FOR COLLECTING FEE
    const collectOptions = {
        tokenId: nftId,
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
            FREYA_TOKEN,
            Number(nftPosition.tokensOwed0)
        ),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
            WETH_TOKEN,
            Number(nftPosition.tokensOwed1)
        ),
        recipient: account.address
    }


    const removeLiquidityOptions = {
        deadline: Math.floor(Date.now()/1000) + 60*20,
        slippageTolerance: new Percent(50, 10_000), // 50 bips
        tokenId: nftId,
        liquidityPercentage: removeLiquidityPercentage, // remove 60% liquidity
        collectOptions: collectOptions
    }


    const {calldata, value} = NonfungiblePositionManager.removeCallParameters(
        position,
        removeLiquidityOptions
    )

    const transaction = {
        data: calldata,
        to: uniswapAddresses.nonFungiblePositionManagerAddress,
        value: value,
        from: account.address
    }
    

    console.log("Reducing Liquidity... from Position Id: ", nftId)
    const txRes = await account.sendTransaction(transaction)
    await txRes.wait()

    const newPosition = await nfpmContract.positions(nftId);
    // console.log("Position Calls:", newPosition)

    const afterPosition = new Position({
        pool: pool,
        tickLower: Number(newPosition[5]),
        tickUpper: Number(newPosition[6]),
        liquidity: String(newPosition[7]),
        useFullPrecision: true
    })
    const amount0Liquidity = afterPosition.amount0.toSignificant(6);
    const amount1Liquidity = afterPosition.amount1.toSignificant(6);
    console.log("Amount0: ", amount0Liquidity, "Amount1: ", amount1Liquidity)

    await printBalancesETH(account.address)
    console.log("Pool Balance:")
    await printBalancesETH(uniswapAddresses.freyaWETHPoolAddress)



}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})