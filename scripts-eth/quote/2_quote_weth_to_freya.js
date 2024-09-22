const hre = require("hardhat");
const { getAccounts, printBalances } = require("../../utils/helper");

const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  uniswapAddresses,
  FREYA_TOKEN,
  USDC_TOKEN,
  WETH_TOKEN,
} = require("../../utils/constants");
const { Pool, FeeAmount, Route, SwapQuoter } = require("@uniswap/v3-sdk");
const { TradeType, CurrencyAmount } = require("@uniswap/sdk-core");

async function main() {
  const accounts = await getAccounts();
  // for (let index = 0; index < accounts.length; index++) {
  //   await printBalances(accounts[index].address);
  // }

  const inputAmountList = ['0.001', '0.01', '0.1', '1','10', '100','1000', '2000', '5000', '10000']; // USDC INPUT
  //const inputAmountList = ['1', '2',  '4', '7', '9','10']; // USDC INPUT

  let outputAmountList =[];

  for (let index = 0; index < inputAmountList.length; index++) {
    // INPUT: AMOUNT
    const inputAmount = hre.ethers.parseUnits(inputAmountList[index], 'ether'); // FREYA
    // console.log("INPUT AMOUNT(USDC) : ", inputAmount);

    // Create Pool Instance
    const poolContract = await hre.ethers.getContractAt(
      IUniswapV3PoolABI.abi,
      uniswapAddresses.freyaWETHPoolAddress
    );

    // Retrieve Pool Data
    const [liquidity, slot0] = await Promise.all([
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);
    // console.log("FREYA POOL INFO: token0:",token0," token1: ",token1,"Fee: ",fee," liquidity: ",liquidity);
    // console.log("Slot0 data: ", slot0);

    // console.log("SqrtPriceX96: ",String(slot0[0])," tick: ",String(slot0[1]));

    const FREYAUSDCPool = new Pool(
      FREYA_TOKEN,
      WETH_TOKEN,
      FeeAmount.MEDIUM,
      String(slot0[0]),
      String(liquidity),
      Number(slot0[1])
    );
    // NOTE: Use Number for tick value
    // console.log("FREYA USDC Pool:", FREYAUSDCPool)

    // Contruct Route Object
    // Route @params: [pool], token.in, token.out
    const swapRoute = new Route([FREYAUSDCPool], WETH_TOKEN, FREYA_TOKEN);

    // Getting a Quote for Swap
    // Using SwapQuoter from v3-sdk
    const { calldata } = await SwapQuoter.quoteCallParameters(
      swapRoute,
      CurrencyAmount.fromRawAmount(WETH_TOKEN, Number(inputAmount)),
      TradeType.EXACT_INPUT,
      {
        useQuoterV2: true,
      }
    );
    // console.log("Quote CallData: ", calldata);
    const quoteCallReturnData = await hre.ethers.provider.call({
      to: uniswapAddresses.quoterV2Address,
      data: calldata,
    });
    const decodedData = hre.ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256"],
      quoteCallReturnData
    );
    outputAmountList.push(decodedData[0])
  }
  for (let index = 0; index < inputAmountList.length; index++) {
    console.log(
        "Quote Output for",
        Number(inputAmountList[index]),
        "WETH is",
        Number(outputAmountList[index]) / 10 ** 18
      );
  }
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});
