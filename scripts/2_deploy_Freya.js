const hre = require('hardhat');
const fs = require('fs');
const readlineSync = require('readline-sync');
const { divideNumberRandomly } = require('../utils/helper');




async function main(){
    //1. Config Signer
    //2. Get Wallets from JSON file
    //3. Input TOTAL Freya to Mint
    //4. Deploy FREYA contract and mint to wallets in random amount
    //5. Get Balances
    //6. Store Contract Address to addresses.json


    
    let accounts = [];
    // FOR MAINNET - use this line
    accounts = await hre.ethers.getSigners();
    
    // FOR FORKED IMPERSONATE - use this line
    //accounts[0] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");

    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(await hre.ethers.provider.getBalance(accounts[0]))/ 10**18)


    // GET WALLETS FROM FILE
    const walletsAddress= []
    const wallets = JSON.parse(fs.readFileSync('./wallets.json', 'utf-8'));

    // GET WALLET ADDRESS LIST
    for (let index = 0; index < wallets.length; index++) {
        walletsAddress.push(wallets[index].address);
    }
    console.log("Addresses to mint Freya:", walletsAddress)

    // TOTAL FREYA TO MINT AND DISTRIBUTE AMONG ADDRESSES RANDOMLY
    const input = readlineSync.question("How many FREYA to mint (total supply, e.g. 10 million) : ")
    const parsedInput = parseInt(input, 10);

    // Randomly divide mint amount among wallet addresses with input as total mint amount
    const mintAmount = divideNumberRandomly(parsedInput, wallets.length);
    console.log("Random Amount of tokens to mint for wallets: ", mintAmount)

    
    // DEPLOY TOKEN CONTRACT
    const freya = await hre.ethers.deployContract("FreyaMemeCoin", [walletsAddress, mintAmount], accounts[0]);
    console.log("FREYA TOKEN CONTRACT ADDRESS:" , freya.target)
    await freya.wait()
    
    const totalFreyaSupply = await freya.totalSupply();
    const freyaOwner = await freya.owner();
    console.log("FREYA SUPPLY: ", totalFreyaSupply);
    console.log("FREYA OWNER: ", freyaOwner)

    // Freya Balances of Wallets
    for (let index = 0; index < wallets.length; index++) {
        const balance = await freya.balanceOf(walletsAddress[index]);
        console.log("FREYA BALANCE: ", Number(balance)/10**18)
    }


    // STORE TOKEN ADDRESS in JSON FILE
    fs.writeFileSync("addresses.json", JSON.stringify({token: freya.target}, null, 2));
    console.log(`Token Address ${freya.target} stored. Saved to addresses.json`);



}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})


