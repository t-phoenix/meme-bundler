const hre = require("hardhat");
const {UniswapV3PoolABI} = require('../../utils/UniswapV3PoolABI.json');
const { uniswapAddresses, tokenAddresses } = require("../../utils/constants");
const { ERC20_ABI } = require('../../utils/ABI');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');


async function main(){

    //CONTRACT INSTANCES
    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);

    const poolFREYABalance = await FREYA_Contract.balanceOf(uniswapAddresses.freyaUsdcPoolAddress);
    const poolUSDCBalance = await USDC_Contract.balanceOf(uniswapAddresses.freyaUsdcPoolAddress);

    console.log("Pool Balance", Number(poolFREYABalance)/10**18, "TOKEN" , Number(poolUSDCBalance)/10**6, "USDC")

    const priceFREYA = (Number(poolUSDCBalance)/10**6)/(Number(poolFREYABalance)/10**18);
    console.log("Price of FREYA =",priceFREYA, "USDC");
    console.log("Price of USDC = ", 1/priceFREYA, "FREYA")

    const poolContract = await hre.ethers.getContractAt(IUniswapV3PoolABI.abi, uniswapAddresses.freyaUsdcPoolAddress);

    const [slot0] = await Promise.all([
        poolContract.slot0()
    ])

    console.log("Current Tick: ", slot0[1])
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
  });
  