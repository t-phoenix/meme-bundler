const hre = require('hardhat');
const fs = require('fs');
const readlineSync = require('readline-sync');

const { getNativeBalance } = require('../../utils/getBalances');

async function main(){
    
   

    // GET WALLETS FROM FILE
    const walletsAddress= []
    const wallets = JSON.parse(fs.readFileSync('./wallets.json', 'utf-8'));

    // GET WALLET ADDRESS LIST
    for (let index = 0; index < wallets.length; index++) {
        walletsAddress.push(wallets[index].address);
    }
    console.log("Addresses to mint ETH:", walletsAddress)

    
    // SIGNER ACCOUNT
    const accounts = await hre.ethers.getSigners();
    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(await getNativeBalance(accounts[0].address))/ 10**18)


    // INPUT: NATIVE ETH TO FUND
    const fundInput = readlineSync.question("Enter Amount of ETH to fund the wallet:")
    const fundAmount = hre.ethers.parseUnits(fundInput, "ether") ;


   

    // FUND WALLETS
    for (let index = 0; index < walletsAddress.length; index++) {
        await accounts[0].sendTransaction({
            to: wallets[index].address,
            value: fundAmount
        })
        console.log("Balance of ", wallets[index].address, " is ", await hre.ethers.provider.getBalance(wallets[index].address))
    }

    console.log("Remaining balance of", accounts[0].address, " is ", Number(await getNativeBalance(accounts[0].address))/ 10**18)


}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})