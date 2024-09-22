const hre = require('hardhat');
const fs = require('fs');
const { tokenAddresses } = require('../../utils/constants');
const { ERC20_ABI } = require('../../utils/ABI');

async function main(){
    

    // INPUT TOKEN
    const tokenAddress = tokenAddresses.WETH_Address;

    const amount = hre.ethers.parseUnits('0.1', 'ether');
    const TOKEN_CONTRACT = new hre.ethers.Contract(tokenAddress, ERC20_ABI, hre.ethers.provider)
   

    // GET WALLETS FROM FILE
    const walletsAddress= []
    const wallets = JSON.parse(fs.readFileSync('./wallets.json', 'utf-8'));

    // GET WALLET ADDRESS LIST
    for (let index = 0; index < wallets.length; index++) {
        walletsAddress.push(wallets[index].address);
    }
    console.log("Addresses to mint Freya:", walletsAddress)

    

    // SIGNER ACCOUNT
    const accounts = await hre.ethers.getSigners();
    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(await TOKEN_CONTRACT.balanceOf(accounts[0].address))/ 10**18)



    for (let index = 0; index < walletsAddress.length; index++) {
        // TRANSFER TOKEN
        const sendBalance = await TOKEN_CONTRACT.connect(accounts[0]).transfer(walletsAddress[index], amount);
        await sendBalance.wait()
        // CHECK BALANCE
        console.log("Balance of ", walletsAddress[index], " is ", Number(await TOKEN_CONTRACT.balanceOf(walletsAddress[index]))/10**18,  " WETH")
    }


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})