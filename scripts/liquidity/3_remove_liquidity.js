const hre = require('hardhat');
const { getAccounts, printBalances } = require('../../utils/helper');
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, tokenAddresses } = require('../../utils/constants');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const INONFUNGIBLE_POSITION_MANAGER = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json');
const { Position, Pool, FeeAmount, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent, CurrencyAmount } = require('@uniswap/sdk-core');
const { ERC20_ABI } = require('../../utils/ABI');


async function main(){

    // NFT ID INPUT
    const nftId = 18358;
    // INPUTS
    const freyaInput = hre.ethers.parseUnits('500000', 'ether'); // 2000/1 or 0.0005
    const usdcInput = hre.ethers.parseUnits('300', 6);
    


    const accounts = getAccounts()
    for (let index = 0; index < accounts.length; index++) {
        await printBalances(accounts[index].address)
    }

    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
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

    // Construct Pool Object
    const pool = new Pool(
        FREYA_TOKEN,
        USDC_TOKEN,
        FeeAmount.MEDIUM,
        String(slot0[0]),
        String(liquidity),
        Number(slot0[1])
    )

    // GET POSITION
    const nftPosition = await nfpmContract.positions(nftId);
    console.log("NFT Position for id: ", nftId, " is ", nftPosition)
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
    
    // FOR COLLECTING FEE
    const collectOptions = {
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
            FREYA_TOKEN,
            0
        ),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
            USDC_TOKEN,
            0
        ),
        recipient: accounts[0].address
    }


    const removeLiquidityOptions = {
        deadline: Math.floor(Date.now()/1000) + 60*20,
        slippageTolerance: new Percent(50, 10_000), // 50 bips
        tokenId: nftId,
        liquidityPercentage: new Percent(50, 100), // remove 50% liquidity
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
        from: accounts[0].address
    }
    // APPROVE TOKENS
    // const approveFreya = await FREYA_Contract.connect(accounts[0]).approve(uniswapAddresses.nonFungiblePositionManagerAddress, freyaInput);
    // const approveUSDC = await USDC_Contract.connect(accounts[0]).approve(uniswapAddresses.nonFungiblePositionManagerAddress, usdcInput);
    // await approveUSDC.wait()

    console.log("Reducing Liquidity... from Position Id: ", nftId)
    const txRes = await accounts[0].sendTransaction(transaction)


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

    for (let index = 0; index < accounts.length; index++) {
        await printBalances(accounts[index].address)
    }


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})