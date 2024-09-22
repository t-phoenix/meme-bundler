// USE LIQUIDITY SCRIPTS
const hre = require("hardhat");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const INONFUNGIBLE_POSITION_MANAGER = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const {
  uniswapAddresses,
  FREYA_TOKEN,
  USDC_TOKEN,
  WETH_TOKEN,
  tokenAddresses,
} = require("../utils/constants");
const { getAccounts, printBalances, printBalancesETH } = require("../utils/helper");
const { Position, Pool, FeeAmount } = require("@uniswap/v3-sdk");

async function main() {
  const wallets = getAccounts();
  const account = wallets[1];
  await printBalancesETH(account.address);

  const POOL_Contract = await hre.ethers.getContractAt(
    IUniswapV3PoolABI.abi,
    uniswapAddresses.freyaWETHPoolAddress
  );
  const nfpmContract = new hre.ethers.Contract(
    uniswapAddresses.nonFungiblePositionManagerAddress,
    INONFUNGIBLE_POSITION_MANAGER.abi,
    hre.ethers.provider
  );

  // FETCH POOL DATA
  const [tickSpacing, liquidity, slot0] = await Promise.all([
    POOL_Contract.tickSpacing(),
    POOL_Contract.liquidity(),
    POOL_Contract.slot0(),
  ]);
  console.log("Tick Spacing: ", tickSpacing, "Liquidity: ", liquidity);
  console.log("Slot0: ", slot0);

  const numOfPositions = await nfpmContract.balanceOf(account.address);
  const calls = [];
  for (let index = 0; index < numOfPositions; index++) {
    calls.push(await nfpmContract.tokenOfOwnerByIndex(account.address, index));
  }
  console.log("NFT Ids: ", calls);

  const positionCalls = [];

  for (let id of calls) {
    positionCalls.push(await nfpmContract.positions(id));
  }
  console.log("Position Calls:", positionCalls);
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
    WETH_TOKEN,
    FeeAmount.MEDIUM,
    String(slot0[0]),
    String(liquidity),
    Number(slot0[1])
  );

  for (let index = 0; index < positionCalls.length; index++) {
    if (String(positionCalls[index][3]) === String(tokenAddresses.WETH_Address)) {
      const nftPosition = new Position({
        pool: pool,
        tickLower: Number(positionCalls[index][5]),
        tickUpper: Number(positionCalls[index][6]),
        liquidity: String(positionCalls[index][7]),
        useFullPrecision: true,
      });

      const amount0 = nftPosition.amount0.toSignificant(6);
      const amount1 = nftPosition.amount1.toSignificant(6);
      console.log(
        "NFT Position: ",
        index + 1,
        " Amount0(FREYA): ",
        amount0,
        " Amount1(USDC): ",
        amount1
      );
    }
  }
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});
