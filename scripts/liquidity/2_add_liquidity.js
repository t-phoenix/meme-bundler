const hre = require('hardhat');
const readlineSync = require('readline-sync');
const { getAccounts, printBalances } = require('../../utils/helper');
const { uniswapAddresses, FREYA_TOKEN, USDC_TOKEN, tokenAddresses } = require('../../utils/constants');
const UniswapNonFungiblePositionManagerABI = require('../../utils/UniswapNonFungiblePositionManager.json');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const INONFUNGIBLE_POSITION_MANAGER = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json');
const { Position, Pool, FeeAmount, nearestUsableTick, NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent } = require('@uniswap/sdk-core');
const { ERC20_ABI } = require('../../utils/ABI');


async function main(){

    // INPUT: WALLET
    const wallets = getAccounts()
    const account = wallets[0];
    await printBalances(account.address);
    
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

    // NFT ID INPUT
    // const nftId = 21193;
    // INPUT: NUMBER OF WALLETS
    const input = readlineSync.question("Enter NFT Id you want to add liquidity:")
    const nftId = parseInt(input, 10);
    
    // INPUTS
    const freyaInput = hre.ethers.parseUnits('40000', 'ether'); // 2000/1 or 0.0005
    const usdcInput = hre.ethers.parseUnits('10', 6);
    
    
   

    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
    const POOL_Contract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaUsdcPoolAddress)
    // const nfpmContract = new hre.ethers.Contract(uniswapAddresses.nonFungiblePositionManagerAddress, INONFUNGIBLE_POSITION_MANAGER.abi, hre.ethers.provider );


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
    

    const addLiquidityPosition = new Position.fromAmount0({
        pool: pool,
        tickLower: Number(nftPosition[5]),
        tickUpper: Number(nftPosition[6]),
        amount0: Number(freyaInput),
        useFullPrecision: true
    })

    const addLiquidityOptions = {
        deadline: Math.floor(Date.now()/1000) + 60*20,
        slippageTolerance: new Percent(50, 10_000),
        tokenId: nftId
    }

    const {calldata, value} = NonfungiblePositionManager.addCallParameters(
        addLiquidityPosition,
        addLiquidityOptions
    )

    const transaction = {
        data: calldata,
        to: uniswapAddresses.nonFungiblePositionManagerAddress,
        value: value,
        from: account.address
    }
    // APPROVE TOKENS
    const approveFreya = await FREYA_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, freyaInput);
    const approveUSDC = await USDC_Contract.connect(account).approve(uniswapAddresses.nonFungiblePositionManagerAddress, usdcInput);
    await approveFreya.wait()
    await approveUSDC.wait()

    console.log("ADDING Liquidity ...")
    const txRes = await account.sendTransaction(transaction)
    await txRes.wait()

    const newPosition = await nfpmContract.positions(nftId);
    console.log("Position Calls:", newPosition)

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

    console.log("Final Wallet Balance ")
    await printBalances(account.address)
    

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})