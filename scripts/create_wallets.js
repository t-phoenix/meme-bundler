const hre = require("hardhat");
const fs = require("fs");
const readlineSync = require('readline-sync');

async function main(){
    let accounts = [];

    // FOR MAINNET - use this line
    // const accounts = await hre.ethers.getSigners();
    
    // FOR FORKED IMPERSONATE - use this line
    accounts[0] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");


    const accountsBalance = await hre.ethers.provider.getBalance(accounts[0])
    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(accountsBalance)/ 10**18)


    // CREATE WALLET
    const wallets= []
    const walletsAddress = []

    const input = readlineSync.question("Enter number of wallets to create:")
    const numberOfWallets = parseInt(input, 10);
    

    for (let index = 0; index < numberOfWallets; index++) {
        const newWallet = hre.ethers.Wallet.createRandom();
        console.log("New Account: ", newWallet.address)
        wallets.push({
            address: newWallet.address,
            privateKey: newWallet.privateKey
        });
        walletsAddress.push(newWallet.address)
    }

    const jsonFileName = "wallets.json";
    fs.writeFileSync(jsonFileName, JSON.stringify(wallets, null, 2));
    console.log(`Created ${numberOfWallets} wallets. Keys saved to ${jsonFileName}`);


    // const fundAmount = 1_000000000000000000n;
    const fundInput = readlineSync.question("Enter Amount of ETH to fund the wallet:")
    const fundAmount = hre.ethers.parseUnits(fundInput, "ether") ;


    // FUND WALLETS
    for (let index = 0; index < numberOfWallets; index++) {
        await accounts[0].sendTransaction({
            to: wallets[index].address,
            value: fundAmount
        })
        console.log("Balance of ", wallets[index].address, " is ", await hre.ethers.provider.getBalance(wallets[index].address))
    }

    console.log("Remaining balance of", accounts[0].address, " is ", await hre.ethers.provider.getBalance(accounts[0].address))
    

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})