const hre = require("hardhat");
const {UniswapV3PoolABI} = require('../../utils/UniswapV3PoolABI.json');
const { uniswapAddresses, tokenAddresses } = require("../../utils/constants");
const { ERC20_ABI } = require('../../utils/ABI');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');


async function main(){

    //CONTRACT INSTANCES
    const WETH_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.WETH_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);

    const poolFREYABalance = await FREYA_Contract.balanceOf(uniswapAddresses.freyaWETHPoolAddress);
    const poolWETHBalance = await WETH_Contract.balanceOf(uniswapAddresses.freyaWETHPoolAddress);

    console.log("Pool Balance", Number(poolFREYABalance)/10**18, "TOKEN" , Number(poolWETHBalance)/10**18, "WETH")

    const priceFREYA = (Number(poolWETHBalance)/10**18)/(Number(poolFREYABalance)/10**18);
    console.log("Price of FREYA =",priceFREYA, "WETH");
    console.log("Price of WETH = ", 1/priceFREYA, "FREYA")

    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaWETHPoolAddress);

    const [slot0] = await Promise.all([
        poolContract.slot0()
    ])

    console.log("Current Tick: ", slot0[1])
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
  });
  