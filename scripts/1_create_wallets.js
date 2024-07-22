const hre = require("hardhat");
const fs = require("fs");
const readlineSync = require('readline-sync');
const { getNativeBalance } = require("../utils/getBalances");

async function main(){
    //1. Config- Impersonate Signer
    //2. Create Wallets based on Inputs
    //3. Save Wallet addres and Key to wallets.json
    //4. Fund Wallets based on Inputs (ETH)

    let accounts = [];

    // FOR MAINNET - use this line
    accounts = await hre.ethers.getSigners();
    
    // FOR FORKED IMPERSONATE - use this line
    // accounts[0] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");

    console.log("Account[0]: ", accounts[0].address) 
    console.log(" Balance: ", Number(await getNativeBalance(accounts[0].address))/ 10**18)


    // CREATE WALLET
    const wallets= []
    const walletsAddress = []


    // INPUT: NUMBER OF WALLETS
    const input = readlineSync.question("Enter number of wallets to create:")
    const numberOfWallets = parseInt(input, 10);
    

    for (let index = 0; index < numberOfWallets; index++) {
        const newWallet = hre.ethers.Wallet.createRandom();
        wallets.push({
            address: newWallet.address,
            privateKey: newWallet.privateKey
        });
        walletsAddress.push(newWallet.address)
    }

    // Save Wallets to json file
    fs.writeFileSync("wallets.json", JSON.stringify(wallets, null, 2));
    console.log(`Created ${numberOfWallets} wallets. Keys saved to wallets.json`);


    // INPUT: NATIVE ETH TO FUND
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