const hre = require('hardhat');
const fs = require('fs');
const { getTokenApproval, getNativeBalance } = require('../utils/getBalances');
const { uniswapAddresses, tokenAddresses } = require('../utils/constants');
const { ERC20_ABI } = require('../utils/ABI');
const { Wallet } = require('ethers');


async function main(){
    //1. Give token approval
    //2. Create Pool Instance
    //3. Calculate Position from our input tokens
    //4. Config and Execute minting transaction

    const data = fs.readFileSync('./addresses.json', 'utf-8');
    const freyaAddress = JSON.parse(data).token;
    const freyaUSDCPoolAddress = JSON.parse(data).pool;
    console.log("Pool Address: ", freyaUSDCPoolAddress)

    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, freyaAddress);


    const accounts = await hre.ethers.getSigners();
    console.log("Primary Account: ",accounts[0].address);
    console.log("ETH Balance: ", Number(await getNativeBalance(accounts[0].address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(accounts[0].address))/10**18, "USDC Balance: ", Number(await USDC_Contract.balanceOf(accounts[0].address))/10**6);



    let wallets =[]
    const walletsData = fs.readFileSync('./wallets.json', 'utf-8');
    const ParseData = JSON.parse(walletsData)
    for (let index = 0; index < ParseData.length; index++) {
        const address =ParseData[index].address
        const key = ParseData[index].privateKey
        const wallet = new Wallet(key, hre.ethers.provider)
        console.log("Wallet: ",wallet.address);
        wallets.push(wallet)
        console.log("ETH Balance: ", Number(await getNativeBalance(address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(address))/10**18, "USDC Balance: ", Number(await USDC_Contract.balanceOf(address))/10**6);
    }



    // const freyaAmount = hre.ethers.parseUnits('1000', 'ether');
    // const usdcAmount = hre.ethers.parseUnits('20', 6);
    // console.log("Freya Amount: ", freyaAmount, " USDC amount: ", usdcAmount);

    

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})