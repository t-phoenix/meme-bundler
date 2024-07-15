// Original Address - Impersonate Address on chain / getSigners() from PRIVATE KEY
// Create multiple wallet (hardcode number of wallets in this file) --> ouput in wallets.json
// FUND - fund created wallets using "fundAmount" -- 1ETH default
// Deploy ERC20 contract with @params - address[], mintAmount[]
// ERC20 token mints token once while deploying - can be configured at FreyaMemeCoin.sol


const hre = require("hardhat");
const fs = require("fs");

async function main() {

    let accounts = [];
    // FOR MAINNET
    // const accounts = await hre.ethers.getSigners();
    
    // FOR FORKED IMPERSONATE
    accounts[0] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");

    const accountsBalance = await hre.ethers.provider.getBalance(accounts[0])
    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(accountsBalance)/ 10**18)


    // CREATE WALLET

    const numberOfWallets = 5;
    const fundAmount = 1_000000000000000000n;
    const wallets= []
    const walletsAddress = []


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



    // FUND WALLETS
    for (let index = 0; index < numberOfWallets; index++) {
        await accounts[0].sendTransaction({
            to: wallets[index].address,
            value: fundAmount
        })
        console.log("Balance of ", wallets[index].address, " is ", await hre.ethers.provider.getBalance(wallets[index].address))
    }

    console.log("Balance of", accounts[0].address, " is ", await hre.ethers.provider.getBalance(accounts[0].address))
    

    //CREATE ARRAY FOR MINT TOKEN AMOUNT
    let mintAmount = []
    for (let index = 0; index < numberOfWallets; index++) {
        mintAmount.push(hre.ethers.parseUnits('2000000', 'ether'))
    }
    console.log("Mint Amount Array", mintAmount)


    // DEPLOY TOKEN CONTRACT
    const freya = await hre.ethers.deployContract("FreyaMemeCoin", [walletsAddress, mintAmount], accounts[0]);
    console.log("FREYA TOKEN CONTRACT ADDRESS:" , freya.target)

    const totalFreyaSupply = await freya.totalSupply();
    const freyaOwner = await freya.owner();
    console.log("FREYA => ", totalFreyaSupply);
    console.log("FREYA OWNER: ", freyaOwner)

    for (let index = 0; index < numberOfWallets; index++) {
        const balance = await freya.balanceOf(walletsAddress[index]);
        console.log("FREYA BALANCE: ", Number(balance)/10**18)
    }


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  